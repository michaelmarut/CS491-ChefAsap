from flask import Blueprint, request, jsonify
import stripe
import mysql.connector
import jwt
from database.config import db_config

# Initialize Stripe with your secret key
stripe.api_key = "sk_test_..."  # Replace with your actual Stripe secret key

payments = Blueprint('payments', __name__)

JWT_SECRET = 'your-secret-key'  # Should match auth.py

def verify_token(auth_header):
    """Verify JWT token and return user info"""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, 'Missing or invalid authorization header'
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, 'Token has expired'
    except jwt.InvalidTokenError:
        return None, 'Invalid token'

@payments.route('/create-setup-intent', methods=['POST'])
def create_setup_intent():
    """Create a Stripe SetupIntent for saving payment methods"""
    try:
        auth_header = request.headers.get('Authorization')
        payload, error = verify_token(auth_header)
        
        if error:
            return jsonify({'error': error}), 401
        
        user_id = payload['user_id']
        email = payload['email']
        
        # Create or get Stripe customer
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Check if customer already has a Stripe customer ID
        cursor.execute('SELECT stripe_customer_id FROM customers WHERE email = %s', (email,))
        customer_data = cursor.fetchone()
        
        if customer_data and customer_data['stripe_customer_id']:
            stripe_customer_id = customer_data['stripe_customer_id']
        else:
            # Create new Stripe customer
            stripe_customer = stripe.Customer.create(
                email=email,
                metadata={'user_id': user_id}
            )
            stripe_customer_id = stripe_customer.id
            
            # Update database with Stripe customer ID
            cursor.execute(
                'UPDATE customers SET stripe_customer_id = %s WHERE email = %s',
                (stripe_customer_id, email)
            )
            conn.commit()
        
        # Create SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
        )
        
        return jsonify({
            'client_secret': setup_intent.client_secret,
            'customer_id': stripe_customer_id
        }), 200
        
    except Exception as e:
        print(f'Error creating setup intent: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@payments.route('/payment-methods', methods=['GET'])
def get_payment_methods():
    """Get customer's saved payment methods"""
    try:
        auth_header = request.headers.get('Authorization')
        payload, error = verify_token(auth_header)
        
        if error:
            return jsonify({'error': error}), 401
        
        email = payload['email']
        
        # Get Stripe customer ID
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('SELECT stripe_customer_id FROM customers WHERE email = %s', (email,))
        customer_data = cursor.fetchone()
        
        if not customer_data or not customer_data['stripe_customer_id']:
            return jsonify({'payment_methods': []}), 200
        
        stripe_customer_id = customer_data['stripe_customer_id']
        
        # Get payment methods from Stripe
        payment_methods = stripe.PaymentMethod.list(
            customer=stripe_customer_id,
            type='card'
        )
        
        # Format payment methods for frontend
        formatted_methods = []
        for pm in payment_methods.data:
            formatted_methods.append({
                'id': pm.id,
                'brand': pm.card.brand,
                'last4': pm.card.last4,
                'exp_month': pm.card.exp_month,
                'exp_year': pm.card.exp_year,
                'is_default': False  # You can implement default logic later
            })
        
        return jsonify({'payment_methods': formatted_methods}), 200
        
    except Exception as e:
        print(f'Error getting payment methods: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@payments.route('/payment-methods/<payment_method_id>', methods=['DELETE'])
def delete_payment_method(payment_method_id):
    """Delete a payment method"""
    try:
        auth_header = request.headers.get('Authorization')
        payload, error = verify_token(auth_header)
        
        if error:
            return jsonify({'error': error}), 401
        
        # Detach payment method from customer
        stripe.PaymentMethod.detach(payment_method_id)
        
        return jsonify({'message': 'Payment method deleted successfully'}), 200
        
    except Exception as e:
        print(f'Error deleting payment method: {str(e)}')
        return jsonify({'error': str(e)}), 500

@payments.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a payment intent for booking payments"""
    try:
        auth_header = request.headers.get('Authorization')
        payload, error = verify_token(auth_header)
        
        if error:
            return jsonify({'error': error}), 401
        
        data = request.get_json()
        amount = data.get('amount')  # Amount in cents
        currency = data.get('currency', 'usd')
        payment_method_id = data.get('payment_method_id')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400
        
        email = payload['email']
        
        # Get Stripe customer ID
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('SELECT stripe_customer_id FROM customers WHERE email = %s', (email,))
        customer_data = cursor.fetchone()
        
        if not customer_data or not customer_data['stripe_customer_id']:
            return jsonify({'error': 'Customer not found'}), 404
        
        stripe_customer_id = customer_data['stripe_customer_id']
        
        # Create payment intent
        payment_intent_data = {
            'amount': amount,
            'currency': currency,
            'customer': stripe_customer_id,
            'metadata': {'user_id': payload['user_id']}
        }
        
        if payment_method_id:
            payment_intent_data['payment_method'] = payment_method_id
            payment_intent_data['confirmation_method'] = 'manual'
            payment_intent_data['confirm'] = True
        
        payment_intent = stripe.PaymentIntent.create(**payment_intent_data)
        
        return jsonify({
            'client_secret': payment_intent.client_secret,
            'status': payment_intent.status
        }), 200
        
    except Exception as e:
        print(f'Error creating payment intent: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
