from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import mysql.connector
import jwt
import re
from datetime import datetime, timedelta
from database.config import db_config

def validate_email(email):
    email_regex = r'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_password(password):
    """Validate password meets requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, "Password is valid"

# Create the blueprint
auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

JWT_SECRET = 'your-secret-key'  

@auth_bp.route('/signup', methods=['POST'])
def signup():
    print('\n=== Signup Request Received ===\n')
    conn = None
    cursor = None
    try:
        data = request.get_json()
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('user_type')  # 'chef' or 'customer'
        phone = data.get('phone')
        address = data.get('address')
        address2 = data.get('address2', '')  # Optional field
        city = data.get('city')
        state = data.get('state')
        zip_code = data.get('zip')

        # Validate input
        if not all([first_name, last_name, email, password, user_type, phone, address, city, state, zip_code]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if user_type not in ['chef', 'customer']:
            return jsonify({'error': 'Invalid user type'}), 400

      
        is_valid, msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': msg}), 400

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

       
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 409

        
        cursor.execute('''
            INSERT INTO users (email, password, user_type)
            VALUES (%s, %s, %s)
        ''', (email, hashed_password, user_type))
        
        user_id = cursor.lastrowid
        
        # Create chef or customer profile based on user type
        if user_type == 'chef':
            # Insert into chefs table
            cursor.execute('''
                INSERT INTO chefs (first_name, last_name, email, phone)
                VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))
            
            chef_id = cursor.lastrowid
            
            # Update user with chef_id
            cursor.execute('''
                UPDATE users SET chef_id = %s WHERE id = %s
            ''', (chef_id, user_id))
            
            # Insert chef address
            cursor.execute('''
                INSERT INTO chef_addresses (chef_id, address_line1, address_line2, city, state, zip_code, is_default)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (chef_id, address, address2, city, state, zip_code, True))
            
        elif user_type == 'customer':
            # Insert into customers table
            cursor.execute('''
                INSERT INTO customers (first_name, last_name, email, phone)
                VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))
            
            customer_id = cursor.lastrowid
            
            # Update user with customer_id
            cursor.execute('''
                UPDATE users SET customer_id = %s WHERE id = %s
            ''', (customer_id, user_id))
            
            # Insert customer address
            cursor.execute('''
                INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, zip_code, is_default)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (customer_id, address, address2, city, state, zip_code, True))
        
        conn.commit()
        
        print(f'\nNew user signed up - Email: {email}, Type: {user_type}, ID: {user_id}\n')

        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'user_type': user_type,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user_type': user_type
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@auth_bp.route('/signin', methods=['POST'])
def signin():
    conn = None
    cursor = None
    try:
        # Check if request has JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Email and password are required'}), 400
            
        email = data.get('email')
        password = data.get('password')

        # Validate input fields
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        # Clean and validate email
        email = email.strip().lower()
        if not email:
            return jsonify({'error': 'Email cannot be empty'}), 400
            
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Validate password
        if len(password.strip()) == 0:
            return jsonify({'error': 'Password cannot be empty'}), 400

        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get user
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'user_type': user['user_type'],
            'exp': datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')

        print(f'\nUser signed in - Email: {user["email"]}, Type: {user["user_type"]}, ID: {user["id"]}')
        print(f'Chef ID: {user["chef_id"]}, Customer ID: {user["customer_id"]}\n')
        
        profile_id = user['chef_id'] if user['user_type'] == 'chef' else user['customer_id']
        print(f'Returning profile_id: {profile_id}')
        
        response_data = {
            'message': 'Login successful',
            'token': token,
            'user_type': user['user_type'],
            'user_id': user['id'],
            'profile_id': profile_id,
        }
        print(f'Response data: {response_data}')
        
        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """Get user profile information including chef or customer details"""
    conn = None
    cursor = None
    try:
        # Get user_id from query parameter
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get user information with linked profile
        cursor.execute('''
            SELECT u.id as user_id, u.email, u.user_type, u.chef_id, u.customer_id,
                   u.created_at as user_created_at
            FROM users u
            WHERE u.id = %s
        ''', (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        profile_data = {
            'user_id': user['user_id'],
            'email': user['email'],
            'user_type': user['user_type'],
            'created_at': user['user_created_at']
        }

        # Get detailed profile based on user type
        if user['user_type'] == 'chef' and user['chef_id']:
            # Get chef profile with additional details
            cursor.execute('''
                SELECT c.id as chef_id, c.first_name, c.last_name, c.phone, c.photo_url,
                       c.created_at, c.updated_at
                FROM chefs c
                WHERE c.id = %s
            ''', (user['chef_id'],))
            
            chef_profile = cursor.fetchone()
            if chef_profile:
                profile_data.update({
                    'profile_id': chef_profile['chef_id'],
                    'first_name': chef_profile['first_name'],
                    'last_name': chef_profile['last_name'],
                    'phone': chef_profile['phone'],
                    'photo_url': chef_profile['photo_url'],
                    'profile_created_at': chef_profile['created_at'],
                    'profile_updated_at': chef_profile['updated_at']
                })

                # Get chef cuisines
                cursor.execute('''
                    SELECT ct.name
                    FROM chef_cuisines cc
                    JOIN cuisine_types ct ON cc.cuisine_id = ct.id
                    WHERE cc.chef_id = %s
                ''', (user['chef_id'],))
                cuisines = [row['name'] for row in cursor.fetchall()]
                profile_data['cuisines'] = cuisines

                # Get chef service areas
                cursor.execute('''
                    SELECT city, state, zip_code, service_radius_miles
                    FROM chef_service_areas
                    WHERE chef_id = %s
                ''', (user['chef_id'],))
                service_areas = cursor.fetchall()
                profile_data['service_areas'] = service_areas

                # Get chef pricing
                cursor.execute('''
                    SELECT base_rate_per_person, produce_supply_extra_cost, 
                           minimum_people, maximum_people
                    FROM chef_pricing
                    WHERE chef_id = %s
                ''', (user['chef_id'],))
                pricing = cursor.fetchone()
                if pricing:
                    profile_data['pricing'] = pricing

        elif user['user_type'] == 'customer' and user['customer_id']:
            # Get customer profile
            cursor.execute('''
                SELECT c.id as customer_id, c.first_name, c.last_name, c.phone, 
                       c.photo_url, c.allergy_notes, c.created_at, c.updated_at
                FROM customers c
                WHERE c.id = %s
            ''', (user['customer_id'],))
            
            customer_profile = cursor.fetchone()
            if customer_profile:
                profile_data.update({
                    'profile_id': customer_profile['customer_id'],
                    'first_name': customer_profile['first_name'],
                    'last_name': customer_profile['last_name'],
                    'phone': customer_profile['phone'],
                    'photo_url': customer_profile['photo_url'],
                    'allergy_notes': customer_profile['allergy_notes'],
                    'profile_created_at': customer_profile['created_at'],
                    'profile_updated_at': customer_profile['updated_at']
                })

                # Get customer addresses
                cursor.execute('''
                    SELECT id, address_line1, address_line2, city, state, zip_code, is_default
                    FROM customer_addresses
                    WHERE customer_id = %s
                ''', (user['customer_id'],))
                addresses = cursor.fetchall()
                profile_data['addresses'] = addresses

        return jsonify(profile_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()