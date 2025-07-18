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
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('user_type')  # 'chef' or 'customer'

        # Validate input
        if not all([email, password, user_type]):
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
