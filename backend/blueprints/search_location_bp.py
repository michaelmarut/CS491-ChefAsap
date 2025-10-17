from flask import Blueprint, request, jsonify
import mysql.connector
from database.config import db_config
from datetime import datetime

# Create the blueprint
search_location_bp = Blueprint('search_location', __name__)

@search_location_bp.route('/customer/<int:customer_id>/search-locations', methods=['POST'])
def save_search_location(customer_id):
    """
    Save or update a customer's search location
    If the same location exists, update last_used_at and usage_count
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        city = data.get('city')
        state = data.get('state')
        
        # Validate required fields
        if not all([latitude, longitude, city, state]):
            return jsonify({'error': 'latitude, longitude, city, and state are required'}), 400
        
        # Optional fields
        location_name = data.get('location_name')
        address_line1 = data.get('address_line1')
        address_line2 = data.get('address_line2')
        zip_code = data.get('zip_code')
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Check if customer exists
        cursor.execute('SELECT id FROM customers WHERE id = %s', (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if similar location already exists (within ~100 meters)
        # Using approximate distance check: 0.001 degrees ≈ 111 meters
        cursor.execute('''
            SELECT id, usage_count 
            FROM customer_search_locations 
            WHERE customer_id = %s 
            AND ABS(latitude - %s) < 0.001 
            AND ABS(longitude - %s) < 0.001
            LIMIT 1
        ''', (customer_id, latitude, longitude))
        
        existing_location = cursor.fetchone()
        
        if existing_location:
            # Update existing location
            location_id = existing_location['id']
            new_usage_count = existing_location['usage_count'] + 1
            
            update_fields = ['last_used_at = NOW()', 'usage_count = %s']
            update_values = [new_usage_count]
            
            # Update optional fields if provided
            if location_name is not None:
                update_fields.append('location_name = %s')
                update_values.append(location_name)
            
            if address_line1 is not None:
                update_fields.append('address_line1 = %s')
                update_values.append(address_line1)
            
            if address_line2 is not None:
                update_fields.append('address_line2 = %s')
                update_values.append(address_line2)
            
            if zip_code is not None:
                update_fields.append('zip_code = %s')
                update_values.append(zip_code)
            
            update_values.append(location_id)
            
            query = f"UPDATE customer_search_locations SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
            
            message = 'Search location updated'
        else:
            # Insert new location
            cursor.execute('''
                INSERT INTO customer_search_locations 
                (customer_id, location_name, address_line1, address_line2, city, state, zip_code, 
                 latitude, longitude, last_used_at, usage_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 1)
            ''', (customer_id, location_name, address_line1, address_line2, city, state, zip_code, 
                  latitude, longitude))
            
            location_id = cursor.lastrowid
            message = 'Search location saved'
        
        conn.commit()
        
        # Fetch the saved/updated location
        cursor.execute('''
            SELECT id, customer_id, location_name, address_line1, address_line2, 
                   city, state, zip_code, latitude, longitude, 
                   last_used_at, usage_count, created_at
            FROM customer_search_locations
            WHERE id = %s
        ''', (location_id,))
        
        location = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Format response
        response_data = {
            'id': location['id'],
            'customer_id': location['customer_id'],
            'location_name': location['location_name'],
            'address_line1': location['address_line1'],
            'address_line2': location['address_line2'],
            'city': location['city'],
            'state': location['state'],
            'zip_code': location['zip_code'],
            'latitude': float(location['latitude']),
            'longitude': float(location['longitude']),
            'last_used_at': location['last_used_at'].isoformat() if location['last_used_at'] else None,
            'usage_count': location['usage_count'],
            'created_at': location['created_at'].isoformat() if location['created_at'] else None
        }
        
        return jsonify({
            'message': message,
            'location': response_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_location_bp.route('/customer/<int:customer_id>/search-locations', methods=['GET'])
def get_search_locations(customer_id):
    """
    Get customer's recent search locations
    Query params:
    - limit: number of locations to return (default: 10, max: 50)
    """
    try:
        # Get limit from query params
        limit = request.args.get('limit', 10, type=int)
        if limit > 50:
            limit = 50
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Check if customer exists
        cursor.execute('SELECT id FROM customers WHERE id = %s', (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get recent search locations
        cursor.execute('''
            SELECT id, customer_id, location_name, address_line1, address_line2, 
                   city, state, zip_code, latitude, longitude, 
                   last_used_at, usage_count, created_at
            FROM customer_search_locations
            WHERE customer_id = %s
            ORDER BY last_used_at DESC
            LIMIT %s
        ''', (customer_id, limit))
        
        locations = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Format response
        formatted_locations = []
        for loc in locations:
            formatted_locations.append({
                'id': loc['id'],
                'location_name': loc['location_name'],
                'address_line1': loc['address_line1'],
                'address_line2': loc['address_line2'],
                'city': loc['city'],
                'state': loc['state'],
                'zip_code': loc['zip_code'],
                'latitude': float(loc['latitude']),
                'longitude': float(loc['longitude']),
                'last_used_at': loc['last_used_at'].isoformat() if loc['last_used_at'] else None,
                'usage_count': loc['usage_count'],
                'created_at': loc['created_at'].isoformat() if loc['created_at'] else None
            })
        
        return jsonify({
            'customer_id': customer_id,
            'locations': formatted_locations,
            'count': len(formatted_locations)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_location_bp.route('/customer/<int:customer_id>/search-locations/<int:location_id>', methods=['PUT'])
def update_search_location(customer_id, location_id):
    """
    Update a saved search location (e.g., change location name)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if location exists and belongs to customer
        cursor.execute('''
            SELECT id FROM customer_search_locations 
            WHERE id = %s AND customer_id = %s
        ''', (location_id, customer_id))
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Search location not found'}), 404
        
        # Build update query
        update_fields = []
        update_values = []
        
        if 'location_name' in data:
            update_fields.append('location_name = %s')
            update_values.append(data['location_name'])
        
        if 'address_line1' in data:
            update_fields.append('address_line1 = %s')
            update_values.append(data['address_line1'])
        
        if 'address_line2' in data:
            update_fields.append('address_line2 = %s')
            update_values.append(data['address_line2'])
        
        if not update_fields:
            cursor.close()
            conn.close()
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_values.append(location_id)
        
        query = f"UPDATE customer_search_locations SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, update_values)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Search location updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_location_bp.route('/customer/<int:customer_id>/search-locations/<int:location_id>/use', methods=['PUT'])
def mark_location_used(customer_id, location_id):
    """
    Mark a location as used (update last_used_at and increment usage_count)
    Call this when user selects a saved location for searching
    """
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Check if location exists and belongs to customer
        cursor.execute('''
            SELECT id, usage_count 
            FROM customer_search_locations 
            WHERE id = %s AND customer_id = %s
        ''', (location_id, customer_id))
        
        location = cursor.fetchone()
        
        if not location:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Search location not found'}), 404
        
        # Update last_used_at and usage_count
        new_usage_count = location['usage_count'] + 1
        cursor.execute('''
            UPDATE customer_search_locations 
            SET last_used_at = NOW(), usage_count = %s
            WHERE id = %s
        ''', (new_usage_count, location_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Location marked as used',
            'usage_count': new_usage_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_location_bp.route('/customer/<int:customer_id>/search-locations/<int:location_id>', methods=['DELETE'])
def delete_search_location(customer_id, location_id):
    """
    Delete a saved search location
    """
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if location exists and belongs to customer
        cursor.execute('''
            SELECT id FROM customer_search_locations 
            WHERE id = %s AND customer_id = %s
        ''', (location_id, customer_id))
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Search location not found'}), 404
        
        # Delete the location
        cursor.execute('''
            DELETE FROM customer_search_locations 
            WHERE id = %s AND customer_id = %s
        ''', (location_id, customer_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Search location deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_location_bp.route('/customer/<int:customer_id>/search-locations/cleanup', methods=['DELETE'])
def cleanup_old_locations(customer_id):
    """
    Clean up old unused locations
    Removes locations not used in the last 90 days, keeping max 20 most recent
    """
    try:
        # Get parameters
        days_old = request.args.get('days', 90, type=int)
        keep_count = request.args.get('keep', 20, type=int)
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Delete old locations, but keep the most recent ones
        cursor.execute('''
            DELETE FROM customer_search_locations
            WHERE customer_id = %s
            AND id NOT IN (
                SELECT id FROM (
                    SELECT id 
                    FROM customer_search_locations
                    WHERE customer_id = %s
                    ORDER BY last_used_at DESC
                    LIMIT %s
                ) AS keep_locations
            )
            AND last_used_at < DATE_SUB(NOW(), INTERVAL %s DAY)
        ''', (customer_id, customer_id, keep_count, days_old))
        
        deleted_count = cursor.rowcount
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': f'Cleaned up {deleted_count} old search locations',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
