from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, timedelta
from database.config import db_config
import math

# Create the blueprint
booking_bp = Blueprint('booking', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 3959  
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def get_zip_coordinates(zip_code):
    """Get approximate coordinates for a zip code (simplified version)"""
 
    zip_coords = {
        '60601': (41.8781, -87.6298),  # Chicago
        '10001': (40.7505, -73.9934),  # NYC
        '90210': (34.0901, -118.4065), # Beverly Hills
        '94102': (37.7749, -122.4194), # San Francisco
    }
    return zip_coords.get(zip_code, (40.7128, -74.0060))  # Default to NYC

@booking_bp.route('/create', methods=['POST'])
def create_booking():
    """Create a new booking request"""
    try:
        data = request.get_json()
        
    
        customer_id = data.get('customer_id')
        cuisine_type = data.get('cuisine_type')
        meal_type = data.get('meal_type')
        event_type = data.get('event_type')
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        produce_supply = data.get('produce_supply', 'customer')
        number_of_people = data.get('number_of_people')
        special_notes = data.get('special_notes', '')
        
     
        if not all([customer_id, cuisine_type, meal_type, event_type, 
                   booking_date, booking_time, number_of_people]):
            return jsonify({'error': 'Missing required fields'}), 400
        
 
        booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
        if booking_datetime <= datetime.now():
            return jsonify({'error': 'Booking date must be in the future'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        

        cursor.execute('''
            INSERT INTO bookings (customer_id, cuisine_type, meal_type, event_type, 
                                booking_date, booking_time, produce_supply, 
                                number_of_people, special_notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (customer_id, cuisine_type, meal_type, event_type, 
              booking_date, booking_time, produce_supply, number_of_people, special_notes))
        
        booking_id = cursor.lastrowid
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/search-chefs', methods=['POST'])
def search_chefs():
    """Search for available chefs based on booking criteria"""
    try:
        data = request.get_json()
        
        cuisine_type = data.get('cuisine_type')
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        customer_zip = data.get('customer_zip')
        number_of_people = data.get('number_of_people')
        
        if not all([cuisine_type, booking_date, booking_time, customer_zip]):
            return jsonify({'error': 'Missing required search criteria'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
  
        customer_lat, customer_lon = get_zip_coordinates(customer_zip)
        
  
        cursor.execute('''
            SELECT DISTINCT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.photo_url,
                csa.city,
                csa.state,
                csa.zip_code,
                csa.service_radius_miles,
                cp.base_rate_per_person,
                cp.produce_supply_extra_cost,
                cp.minimum_people,
                cp.maximum_people,
                GROUP_CONCAT(DISTINCT ct.name) as cuisines
            FROM chefs c
            JOIN chef_cuisines cc ON c.id = cc.chef_id
            JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            WHERE ct.name = %s
            AND (cp.minimum_people IS NULL OR cp.minimum_people <= %s)
            AND (cp.maximum_people IS NULL OR cp.maximum_people >= %s)
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url,
                     csa.city, csa.state, csa.zip_code, csa.service_radius_miles,
                     cp.base_rate_per_person, cp.produce_supply_extra_cost,
                     cp.minimum_people, cp.maximum_people
        ''', (cuisine_type, number_of_people, number_of_people))
        
        chefs = cursor.fetchall()
        
      
        available_chefs = []
        for chef in chefs:
      
            chef_lat, chef_lon = get_zip_coordinates(chef['zip_code'])
            distance = calculate_distance(customer_lat, customer_lon, chef_lat, chef_lon)
            
          
            service_radius = chef['service_radius_miles'] or 10
            if distance <= service_radius:

                cursor.execute('''
                    SELECT COUNT(*) as conflict_count
                    FROM bookings
                    WHERE chef_id = %s 
                    AND booking_date = %s 
                    AND booking_time = %s
                    AND status NOT IN ('declined', 'cancelled')
                ''', (chef['chef_id'], booking_date, booking_time))
                
                conflict = cursor.fetchone()
                if conflict['conflict_count'] == 0:

                    base_cost = (chef['base_rate_per_person'] or 50) * number_of_people
                    produce_cost = chef['produce_supply_extra_cost'] or 0
                    
                    chef_info = {
                        'chef_id': chef['chef_id'],
                        'name': f"{chef['first_name']} {chef['last_name']}",
                        'email': chef['email'],
                        'phone': chef['phone'],
                        'photo_url': chef['photo_url'],
                        'location': f"{chef['city']}, {chef['state']} {chef['zip_code']}",
                        'distance_miles': round(distance, 1),
                        'cuisines': chef['cuisines'].split(',') if chef['cuisines'] else [],
                        'base_rate_per_person': float(chef['base_rate_per_person'] or 50),
                        'produce_supply_extra_cost': float(produce_cost),
                        'estimated_total_cost': float(base_cost),
                        'min_people': chef['minimum_people'] or 1,
                        'max_people': chef['maximum_people'] or 50
                    }
                    available_chefs.append(chef_info)
        
       
        available_chefs.sort(key=lambda x: x['distance_miles'])
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'available_chefs': available_chefs,
            'total_found': len(available_chefs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/book-chef', methods=['POST'])
def book_chef():
    """Book a specific chef for a booking request"""
    try:
        data = request.get_json()
        
        booking_id = data.get('booking_id')
        chef_id = data.get('chef_id')
        
        if not all([booking_id, chef_id]):
            return jsonify({'error': 'Missing booking_id or chef_id'}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
      
        cursor.execute('''
            UPDATE bookings 
            SET chef_id = %s, status = 'pending'
            WHERE id = %s
        ''', (chef_id, booking_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Booking not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Chef booked successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>', methods=['GET'])
def get_customer_bookings(customer_id):
    """Get all bookings for a customer"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT 
                b.*,
                CONCAT(c.first_name, ' ', c.last_name) as chef_name,
                c.email as chef_email,
                c.phone as chef_phone
            FROM bookings b
            LEFT JOIN chefs c ON b.chef_id = c.id
            WHERE b.customer_id = %s
            ORDER BY b.booking_date DESC, b.booking_time DESC
        ''', (customer_id,))
        
        bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'bookings': bookings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500