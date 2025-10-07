from flask import Blueprint, request, jsonify
import mysql.connector
from database.config import db_config
import re
import os
from werkzeug.utils import secure_filename

# Create the blueprint
profile_bp = Blueprint('profile', __name__)

def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional
    phone_regex = r'^[\+]?[1-9]?[\s\-\(\)]?[\d\s\-\(\)]{7,15}$'
    return bool(re.match(phone_regex, phone.strip()))

def validate_image_url(url):
    """Basic validation for image URL"""
    if not url:
        return True  # Image is optional
    # Check if it's a valid URL pattern or file path
    return url.startswith(('http://', 'https://', '/uploads/', './uploads/')) or '.' in url

@profile_bp.route('/chef/<int:chef_id>', methods=['GET'])
def get_chef_profile(chef_id):
    """Get chef profile information"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get chef basic info with default address
        cursor.execute('''
            SELECT 
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.photo_url,
                c.created_at,
                ca.address_line1,
                ca.address_line2,
                ca.city,
                ca.state,
                ca.zip_code
            FROM chefs c
            LEFT JOIN chef_addresses ca ON c.id = ca.chef_id AND ca.is_default = TRUE
            WHERE c.id = %s
        ''', (chef_id,))
        
        chef_profile = cursor.fetchone()
        
        if not chef_profile:
            return jsonify({'error': 'Chef not found'}), 404
        
        # Format the address as "residency" (city, state)
        residency = ""
        if chef_profile['city'] and chef_profile['state']:
            residency = f"{chef_profile['city']}, {chef_profile['state']}"
        elif chef_profile['city']:
            residency = chef_profile['city']
        elif chef_profile['state']:
            residency = chef_profile['state']
        
        # Get chef cuisines
        cursor.execute('''
            SELECT ct.name 
            FROM chef_cuisines cc
            JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE cc.chef_id = %s
        ''', (chef_id,))
        
        cuisines = [row['name'] for row in cursor.fetchall()]
        
        # Get chef ratings average
        cursor.execute('''
            SELECT 
                AVG(rating) as avg_rating,
                COUNT(*) as total_ratings
            FROM chef_ratings 
            WHERE chef_id = %s
        ''', (chef_id,))
        
        rating_info = cursor.fetchone()
        
        profile_data = {
            'chef_id': chef_profile['id'],
            'first_name': chef_profile['first_name'],
            'last_name': chef_profile['last_name'],
            'email': chef_profile['email'],
            'phone': chef_profile['phone'],
            'photo_url': chef_profile['photo_url'],
            'residency': residency,
            'full_address': {
                'address_line1': chef_profile['address_line1'],
                'address_line2': chef_profile['address_line2'],
                'city': chef_profile['city'],
                'state': chef_profile['state'],
                'zip_code': chef_profile['zip_code']
            },
            'cuisines': cuisines,
            'average_rating': float(rating_info['avg_rating'] or 0),
            'total_ratings': rating_info['total_ratings'],
            'member_since': chef_profile['created_at'].strftime('%B %Y') if chef_profile['created_at'] else None
        }
        
        cursor.close()
        conn.close()
        
        return jsonify({'profile': profile_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/chef/<int:chef_id>', methods=['PUT'])
def update_chef_profile(chef_id):
    """Update chef profile information - All fields editable except email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract fields that can be updated (email is NOT editable)
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone')
        photo_url = data.get('photo_url')
        
        # Address fields - all editable
        address_line1 = data.get('address_line1')
        address_line2 = data.get('address_line2', '')
        city = data.get('city')
        state = data.get('state')
        zip_code = data.get('zip_code')
        
        # Check if user is trying to update email (not allowed)
        if 'email' in data:
            return jsonify({'error': 'Email address cannot be changed'}), 400
        
        # Validate names cannot be empty (if provided)
        if first_name is not None and (not first_name or not first_name.strip()):
            return jsonify({'error': 'First name cannot be empty'}), 400
        
        if last_name is not None and (not last_name or not last_name.strip()):
            return jsonify({'error': 'Last name cannot be empty'}), 400
        
        if phone and not validate_phone(phone):
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        if photo_url and not validate_image_url(photo_url):
            return jsonify({'error': 'Invalid image URL format'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if chef exists
        cursor.execute('SELECT id FROM chefs WHERE id = %s', (chef_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Chef not found'}), 404
        
        # Build dynamic UPDATE query based on provided fields
        update_fields = []
        update_values = []
        
        if first_name is not None:
            update_fields.append('first_name = %s')
            update_values.append(first_name)
        
        if last_name is not None:
            update_fields.append('last_name = %s')
            update_values.append(last_name)
        
        if phone is not None:
            update_fields.append('phone = %s')
            update_values.append(phone)
        
        if photo_url is not None:
            update_fields.append('photo_url = %s')
            update_values.append(photo_url)
        
        # Always update the timestamp
        update_fields.append('updated_at = NOW()')
        update_values.append(chef_id)
        
        # Only update if there are fields to update
        if len(update_fields) > 1:  # More than just the timestamp
            query = f"UPDATE chefs SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
        
        # Update address if provided
        if address_line1 and city and state and zip_code:
            # Check if default address exists
            cursor.execute('''
                SELECT id FROM chef_addresses 
                WHERE chef_id = %s AND is_default = TRUE
            ''', (chef_id,))
            
            address_record = cursor.fetchone()
            
            if address_record:
                # Update existing default address
                cursor.execute('''
                    UPDATE chef_addresses 
                    SET address_line1 = %s, address_line2 = %s, city = %s, state = %s, zip_code = %s
                    WHERE chef_id = %s AND is_default = TRUE
                ''', (address_line1, address_line2, city, state, zip_code, chef_id))
            else:
                # Create new default address
                cursor.execute('''
                    INSERT INTO chef_addresses (chef_id, address_line1, address_line2, city, state, zip_code, is_default)
                    VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                ''', (chef_id, address_line1, address_line2, city, state, zip_code))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/customer/<int:customer_id>', methods=['GET'])
def get_customer_profile(customer_id):
    """Get customer profile information"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get customer basic info with default address
        cursor.execute('''
            SELECT 
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.photo_url,
                c.allergy_notes,
                c.created_at,
                ca.address_line1,
                ca.address_line2,
                ca.city,
                ca.state,
                ca.zip_code
            FROM customers c
            LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = TRUE
            WHERE c.id = %s
        ''', (customer_id,))
        
        customer_profile = cursor.fetchone()
        
        if not customer_profile:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Format the address as "residency" (city, state)
        residency = ""
        if customer_profile['city'] and customer_profile['state']:
            residency = f"{customer_profile['city']}, {customer_profile['state']}"
        elif customer_profile['city']:
            residency = customer_profile['city']
        elif customer_profile['state']:
            residency = customer_profile['state']
        
        profile_data = {
            'customer_id': customer_profile['id'],
            'first_name': customer_profile['first_name'],
            'last_name': customer_profile['last_name'],
            'email': customer_profile['email'],
            'phone': customer_profile['phone'],
            'photo_url': customer_profile['photo_url'],
            'allergy_notes': customer_profile['allergy_notes'],
            'residency': residency,
            'full_address': {
                'address_line1': customer_profile['address_line1'],
                'address_line2': customer_profile['address_line2'],
                'city': customer_profile['city'],
                'state': customer_profile['state'],
                'zip_code': customer_profile['zip_code']
            },
            'member_since': customer_profile['created_at'].strftime('%B %Y') if customer_profile['created_at'] else None
        }
        
        cursor.close()
        conn.close()
        
        return jsonify({'profile': profile_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/customer/<int:customer_id>', methods=['PUT'])
def update_customer_profile(customer_id):
    """Update customer profile information - All fields editable except email"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract fields that can be updated (email is NOT editable)
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone')
        photo_url = data.get('photo_url')
        allergy_notes = data.get('allergy_notes')
        
        # Address fields - all editable
        address_line1 = data.get('address_line1')
        address_line2 = data.get('address_line2', '')
        city = data.get('city')
        state = data.get('state')
        zip_code = data.get('zip_code')
        
        # Check if user is trying to update email (not allowed)
        if 'email' in data:
            return jsonify({'error': 'Email address cannot be changed'}), 400
        
        # Validate names cannot be empty (if provided)
        if first_name is not None and (not first_name or not first_name.strip()):
            return jsonify({'error': 'First name cannot be empty'}), 400
        
        if last_name is not None and (not last_name or not last_name.strip()):
            return jsonify({'error': 'Last name cannot be empty'}), 400
        
        if phone and not validate_phone(phone):
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        if photo_url and not validate_image_url(photo_url):
            return jsonify({'error': 'Invalid image URL format'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if customer exists
        cursor.execute('SELECT id FROM customers WHERE id = %s', (customer_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Customer not found'}), 404
        
        # Build dynamic UPDATE query based on provided fields
        update_fields = []
        update_values = []
        
        if first_name is not None:
            update_fields.append('first_name = %s')
            update_values.append(first_name)
        
        if last_name is not None:
            update_fields.append('last_name = %s')
            update_values.append(last_name)
        
        if phone is not None:
            update_fields.append('phone = %s')
            update_values.append(phone)
        
        if photo_url is not None:
            update_fields.append('photo_url = %s')
            update_values.append(photo_url)
        
        if allergy_notes is not None:
            update_fields.append('allergy_notes = %s')
            update_values.append(allergy_notes)
        
        # Always update the timestamp
        update_fields.append('updated_at = NOW()')
        update_values.append(customer_id)
        
        # Only update if there are fields to update
        if len(update_fields) > 1:  # More than just the timestamp
            query = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
        
        # Update address if provided
        if address_line1 and city and state and zip_code:
            # Check if default address exists
            cursor.execute('''
                SELECT id FROM customer_addresses 
                WHERE customer_id = %s AND is_default = TRUE
            ''', (customer_id,))
            
            address_record = cursor.fetchone()
            
            if address_record:
                # Update existing default address
                cursor.execute('''
                    UPDATE customer_addresses 
                    SET address_line1 = %s, address_line2 = %s, city = %s, state = %s, zip_code = %s
                    WHERE customer_id = %s AND is_default = TRUE
                ''', (address_line1, address_line2, city, state, zip_code, customer_id))
            else:
                # Create new default address
                cursor.execute('''
                    INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, zip_code, is_default)
                    VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                ''', (customer_id, address_line1, address_line2, city, state, zip_code))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/customer/<int:customer_id>/photo', methods=['POST'])
def upload_customer_photo(customer_id):
    """Upload and update customer profile photo"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(f"profile_customer{customer_id}.{photo.filename.rsplit('.', 1)[-1]}")
        filepath = os.path.join('static/profile_photos', filename)
        photo.save(filepath)

        photo_url = f"/static/profile_photos/{filename}"

        # Update photo_url in database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('UPDATE customers SET photo_url = %s WHERE id = %s', (photo_url, customer_id))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'photo_url': f"{request.host_url.rstrip('/')}{photo_url}"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@profile_bp.route('/chef/<int:chef_id>/photo', methods=['POST'])
def upload_chef_photo(chef_id):
    """Upload and update chef profile photo"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(f"profile_chef{chef_id}.{photo.filename.rsplit('.', 1)[-1]}")
        filepath = os.path.join('static/profile_photos', filename)
        photo.save(filepath)

        photo_url = f"/static/profile_photos/{filename}"

        # Update photo_url in database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('UPDATE chefs SET photo_url = %s WHERE id = %s', (photo_url, chef_id))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'photo_url': f"{request.host_url.rstrip('/')}{photo_url}"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500