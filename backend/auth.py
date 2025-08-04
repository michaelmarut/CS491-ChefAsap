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

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

JWT_SECRET = 'your-secret-key'  

@auth.route('/signup', methods=['POST'])
def signup():
    print('\n=== Signup Request Received ===\n')
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

@auth.route('/signin', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({'error': 'Missing email or password'}), 400

        
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

        print(f'\nUser signed in - Email: {user["email"]}, Type: {user["user_type"]}, ID: {user["id"]}\n')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user_type': user['user_type']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
@auth.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile data"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
            user_type = payload['user_type']
            email = payload['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        if user_type == 'customer':
            # Get customer profile data
            cursor.execute('''
                SELECT c.first_name, c.last_name, c.email, c.phone,
                       ca.address_line1, ca.address_line2, ca.city, ca.state, ca.zip_code
                FROM customers c
                LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = 1
                WHERE c.email = %s
            ''', (email,))
            
            profile_data = cursor.fetchone()
            
            if not profile_data:
                return jsonify({'error': 'Profile not found'}), 404
            
            return jsonify({
                'firstName': profile_data['first_name'],
                'lastName': profile_data['last_name'],
                'email': profile_data['email'],
                'phone': profile_data['phone'],
                'address': profile_data['address_line1'] or '',
                'address2': profile_data['address_line2'] or '',
                'city': profile_data['city'] or '',
                'state': profile_data['state'] or '',
                'zipCode': profile_data['zip_code'] or '',
                'userType': user_type
            }), 200
            
        elif user_type == 'chef':
            # Get chef profile data
            cursor.execute('''
                SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
                       ca.address_line1, ca.address_line2, ca.city, ca.state, ca.zip_code
                FROM chefs c
                LEFT JOIN chef_addresses ca ON c.id = ca.chef_id AND ca.is_default = 1
                WHERE c.email = %s
            ''', (email,))
            
            profile_data = cursor.fetchone()
            
            if not profile_data:
                return jsonify({'error': 'Profile not found'}), 404
            
            return jsonify({
                'id': profile_data['id'],
                'firstName': profile_data['first_name'],
                'lastName': profile_data['last_name'],
                'email': profile_data['email'],
                'phone': profile_data['phone'],
                'address': profile_data['address_line1'] or '',
                'address2': profile_data['address_line2'] or '',
                'city': profile_data['city'] or '',
                'state': profile_data['state'] or '',
                'zipCode': profile_data['zip_code'] or '',
                'userType': user_type
            }), 200
        
        else:
            return jsonify({'error': 'Invalid user type'}), 400
            
    except Exception as e:
        print(f'Error in get_profile: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
@auth.route('/profile', methods=['PUT'])
def update_profile():
    print('\n=== Update Profile Request Received ===')
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode the JWT token
            decoded_token = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = decoded_token['user_id']
            email = decoded_token['email']
            user_type = decoded_token['user_type']
            print(f'Updating profile for user ID: {user_id}, Email: {email}, Type: {user_type}')
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get the updated profile data from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract profile fields
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        address2 = data.get('address2', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        zip_code = data.get('zipCode', '').strip()
        cuisines = data.get('cuisines', [])  # Get cuisine specialties for chefs
        
        # Validate required fields
        if not all([first_name, last_name, email, phone, address, city, state, zip_code]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Connect to database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Update the main user table (chefs or customers)
        if user_type == 'customer':
            # First get the customer ID by email
            cursor.execute('SELECT id FROM customers WHERE email = %s', (email,))
            customer_record = cursor.fetchone()
            if not customer_record:
                return jsonify({'error': 'Customer profile not found'}), 404
            
            customer_id = customer_record['id']
            
            # Update customer basic info
            update_query = '''
                UPDATE customers 
                SET first_name = %s, last_name = %s, email = %s, phone = %s
                WHERE id = %s
            '''
            cursor.execute(update_query, (first_name, last_name, email, phone, customer_id))
            
            # Update or insert address in customer_addresses table
            # First check if address exists
            cursor.execute('SELECT id FROM customer_addresses WHERE customer_id = %s', (customer_id,))
            address_record = cursor.fetchone()
            
            if address_record:
                # Update existing address
                address_update_query = '''
                    UPDATE customer_addresses 
                    SET address_line1 = %s, address_line2 = %s, city = %s, state = %s, zip_code = %s
                    WHERE customer_id = %s
                '''
                cursor.execute(address_update_query, (address, address2, city, state, zip_code, customer_id))
            else:
                # Insert new address
                address_insert_query = '''
                    INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, zip_code, is_default)
                    VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                '''
                cursor.execute(address_insert_query, (customer_id, address, address2, city, state, zip_code))
                
        elif user_type == 'chef':
            # First get the chef ID by email
            cursor.execute('SELECT id FROM chefs WHERE email = %s', (email,))
            chef_record = cursor.fetchone()
            if not chef_record:
                return jsonify({'error': 'Chef profile not found'}), 404
            
            chef_id = chef_record['id']
            
            # Update chef basic info
            update_query = '''
                UPDATE chefs 
                SET first_name = %s, last_name = %s, email = %s, phone = %s
                WHERE id = %s
            '''
            cursor.execute(update_query, (first_name, last_name, email, phone, chef_id))
            
            # Update or insert address in chef_addresses table
            # First check if address exists
            cursor.execute('SELECT id FROM chef_addresses WHERE chef_id = %s', (chef_id,))
            address_record = cursor.fetchone()
            
            if address_record:
                # Update existing address
                address_update_query = '''
                    UPDATE chef_addresses 
                    SET address_line1 = %s, address_line2 = %s, city = %s, state = %s, zip_code = %s
                    WHERE chef_id = %s
                '''
                cursor.execute(address_update_query, (address, address2, city, state, zip_code, chef_id))
            else:
                # Insert new address
                address_insert_query = '''
                    INSERT INTO chef_addresses (chef_id, address_line1, address_line2, city, state, zip_code, is_default)
                    VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                '''
                cursor.execute(address_insert_query, (chef_id, address, address2, city, state, zip_code))
            
            # Handle cuisine specialties for chefs
            if cuisines:
                # First, remove existing cuisine associations
                cursor.execute('DELETE FROM chef_cuisines WHERE chef_id = %s', (chef_id,))
                
                # Get cuisine IDs for the selected cuisines
                for cuisine_name in cuisines:
                    cursor.execute('SELECT id FROM cuisine_types WHERE name = %s', (cuisine_name,))
                    cuisine_record = cursor.fetchone()
                    if cuisine_record:
                        cursor.execute('''
                            INSERT INTO chef_cuisines (chef_id, cuisine_id) VALUES (%s, %s)
                        ''', (chef_id, cuisine_record['id']))
                
                print(f'Updated {len(cuisines)} cuisine specialties for chef {chef_id}')
            
            # Ensure chef has service area and pricing data for booking searches
            # Check if service area exists
            cursor.execute('SELECT id FROM chef_service_areas WHERE chef_id = %s', (chef_id,))
            service_area = cursor.fetchone()
            if not service_area:
                # Create default service area using chef's address
                # Ensure state is only 2 characters (database constraint)
                state_code = state[:2].upper() if state else 'XX'
                cursor.execute('''
                    INSERT INTO chef_service_areas (chef_id, city, state, zip_code, service_radius_miles)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, city, state_code, zip_code, 25))  # Default 25 mile radius
                print(f'Created default service area for chef {chef_id}')
            
            # Check if pricing exists
            cursor.execute('SELECT id FROM chef_pricing WHERE chef_id = %s', (chef_id,))
            pricing = cursor.fetchone()
            if not pricing:
                # Create default pricing
                cursor.execute('''
                    INSERT INTO chef_pricing (chef_id, base_rate_per_person, produce_supply_extra_cost, minimum_people, maximum_people)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, 50.00, 15.00, 2, 20))  # Default pricing
                print(f'Created default pricing for chef {chef_id}')
                
        else:
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Commit all changes
        conn.commit()
        
        print(f'Profile updated successfully for user ID: {user_id}')
        
        # Return the updated profile data
        return jsonify({
            'message': 'Profile updated successfully',
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'phone': phone,
            'address': address,
            'address2': address2,
            'city': city,
            'state': state,
            'zipCode': zip_code,
            'userType': user_type
        }), 200
        
    except Exception as e:
        print(f'Error in update_profile: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@auth.route('/change-password', methods=['POST'])
def change_password():
    """Change user password after verifying current password"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload['user_id']
            email = payload['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get request data
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        confirm_password = data.get('confirmPassword')
        
        # Validate required fields
        if not all([current_password, new_password, confirm_password]):
            return jsonify({'error': 'All password fields are required'}), 400
        
        # Check if new passwords match
        if new_password != confirm_password:
            return jsonify({'error': 'New passwords do not match'}), 400
        
        # Validate new password strength
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        if not any(c.isupper() for c in new_password):
            return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
        
        if not any(c.islower() for c in new_password):
            return jsonify({'error': 'Password must contain at least one lowercase letter'}), 400
        
        if not any(c.isdigit() for c in new_password):
            return jsonify({'error': 'Password must contain at least one number'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get current user data
        cursor.execute('SELECT password FROM users WHERE id = %s', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not bcrypt.check_password_hash(user_data['password'], current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Hash new password
        hashed_new_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        # Update password in database
        cursor.execute('''
            UPDATE users 
            SET password = %s, updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        ''', (hashed_new_password, user_id))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        print(f'Error in change_password: {str(e)}')
        return jsonify({'error': 'Failed to change password'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
