from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from database.config import db_config
from database.db_helper import get_db_connection, get_cursor, handle_db_error
import math
from services.geocoding_service import geocoding_service, get_coordinates_for_zip

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
    """Get coordinates for a zip code using improved geocoding service"""
    return get_coordinates_for_zip(zip_code)

@booking_bp.route('/create', methods=['POST'])
def create_booking():
    """Create a new booking request"""
    try:
        data = request.get_json()
        
    
        customer_id = data.get('customer_id')
        cuisine_type = data.get('cuisine_type')
        meal_type = data.get('meal_type')
        event_type = data.get('event_type', 'dinner')  # Default to 'dinner'
        booking_date = data.get('booking_date')
        booking_time = data.get('booking_time')
        produce_supply = data.get('produce_supply', 'customer')
        number_of_people = data.get('number_of_people')
        special_notes = data.get('special_notes', '')
        
     
        if not all([customer_id, cuisine_type, meal_type, 
                   booking_date, booking_time, number_of_people]):
            return jsonify({'error': 'Missing required fields'}), 400
        
 
        booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
        if booking_datetime <= datetime.now():
            return jsonify({'error': 'Booking date must be in the future'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # PostgreSQL: INSERT with RETURNING
        cursor.execute('''
            INSERT INTO bookings (customer_id, cuisine_type, meal_type, event_type, 
                                booking_date, booking_time, produce_supply, 
                                number_of_people, special_notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        ''', (customer_id, cuisine_type, meal_type, event_type, 
              booking_date, booking_time, produce_supply, number_of_people, special_notes))
        booking_id = cursor.fetchone()[0]
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
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Use improved geocoding service
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
                STRING_AGG(ct.name, ', ') as cuisines
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
        
        conn = get_db_connection()
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

@booking_bp.route('/customer/<int:customer_id>/dashboard', methods=['GET'])
def get_customer_dashboard(customer_id):
    """Get categorized bookings for customer dashboard: previous, today's, and upcoming"""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Get today's date
        from datetime import date
        today = date.today()
        
        # Base query for booking details
        base_query = '''
            SELECT 
                b.id as booking_id,
                b.chef_id,
                b.booking_date,
                b.booking_time,
                b.cuisine_type,
                b.meal_type,
                b.event_type,
                b.number_of_people,
                b.special_notes,
                b.status,
                b.total_cost,
                b.created_at,
                c.first_name || ' ' || c.last_name as chef_name,
                c.email as chef_email,
                c.phone as chef_phone,
                c.photo_url as chef_photo,
                ca.address_line1 as chef_address_line1,
                ca.address_line2 as chef_address_line2,
                ca.city as chef_city,
                ca.state as chef_state,
                ca.zip_code as chef_zip_code,
                CASE WHEN cr.id IS NOT NULL THEN TRUE ELSE FALSE END as has_reviewed
            FROM bookings b
            LEFT JOIN chefs c ON b.chef_id = c.id
            LEFT JOIN chef_addresses ca ON c.id = ca.chef_id AND ca.is_default = TRUE
            LEFT JOIN chef_ratings cr ON b.id = cr.booking_id AND cr.customer_id = b.customer_id
            WHERE b.customer_id = %s
        '''
        
        # Get previous bookings (before today)
        cursor.execute(base_query + ' AND b.booking_date < %s ORDER BY b.booking_date DESC, b.booking_time DESC', 
                      (customer_id, today))
        previous_bookings = cursor.fetchall()
        
        # Get today's bookings
        cursor.execute(base_query + ' AND b.booking_date = %s ORDER BY b.booking_time ASC', 
                      (customer_id, today))
        todays_bookings = cursor.fetchall()
        
        # Get upcoming bookings (after today)
        cursor.execute(base_query + ' AND b.booking_date > %s ORDER BY b.booking_date ASC, b.booking_time ASC', 
                      (customer_id, today))
        upcoming_bookings = cursor.fetchall()
        
        # Convert datetime/date objects to strings for JSON serialization
        def format_booking_data(bookings):
            formatted = []
            for booking in bookings:
                formatted_booking = dict(booking)
                # Convert date to string
                if formatted_booking.get('booking_date'):
                    formatted_booking['booking_date'] = str(formatted_booking['booking_date'])
                # Convert time to string
                if formatted_booking.get('booking_time'):
                    formatted_booking['booking_time'] = str(formatted_booking['booking_time'])
                # Convert datetime to string
                if formatted_booking.get('created_at'):
                    formatted_booking['created_at'] = formatted_booking['created_at'].isoformat()
                # Convert decimal to float
                if formatted_booking.get('total_cost'):
                    formatted_booking['total_cost'] = float(formatted_booking['total_cost'])
                formatted.append(formatted_booking)
            return formatted
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'previous_bookings': format_booking_data(previous_bookings),
                'todays_bookings': format_booking_data(todays_bookings),
                'upcoming_bookings': format_booking_data(upcoming_bookings)
            },
            'counts': {
                'previous_count': len(previous_bookings),
                'todays_count': len(todays_bookings),
                'upcoming_count': len(upcoming_bookings),
                'total_count': len(previous_bookings) + len(todays_bookings) + len(upcoming_bookings)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>', methods=['GET'])
def get_customer_bookings(customer_id):
    """Get all bookings for a customer (legacy endpoint - use dashboard for categorized data)"""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        cursor.execute('''
            SELECT 
                b.id as booking_id,
                b.booking_date,
                b.booking_time,
                b.cuisine_type,
                b.meal_type,
                b.event_type,
                b.number_of_people,
                b.special_notes,
                b.status,
                b.total_cost,
                b.created_at,
                c.first_name || ' ' || c.last_name as chef_name,
                c.email as chef_email,
                c.phone as chef_phone
            FROM bookings b
            LEFT JOIN chefs c ON b.chef_id = c.id
            WHERE b.customer_id = %s
            ORDER BY b.booking_date DESC, b.booking_time DESC
        ''', (customer_id,))
        
        bookings = cursor.fetchall()
        
        # Format data for JSON serialization
        formatted_bookings = []
        for booking in bookings:
            formatted_booking = dict(booking)
            if formatted_booking.get('booking_date'):
                formatted_booking['booking_date'] = str(formatted_booking['booking_date'])
            if formatted_booking.get('booking_time'):
                formatted_booking['booking_time'] = str(formatted_booking['booking_time'])
            if formatted_booking.get('created_at'):
                formatted_booking['created_at'] = formatted_booking['created_at'].isoformat()
            if formatted_booking.get('total_cost'):
                formatted_booking['total_cost'] = float(formatted_booking['total_cost'])
            formatted_bookings.append(formatted_booking)
        
        cursor.close()
        conn.close()
        
        return jsonify({'bookings': formatted_bookings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>/favorite-chefs', methods=['GET'])
def get_favorite_chefs(customer_id):
    """Get customer's favorite chefs"""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        cursor.execute('''
            SELECT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                c.first_name || ' ' || c.last_name as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                STRING_AGG(ct.name, ', ' ORDER BY ct.name) as cuisines,
                AVG(cr.rating) as average_rating,
                COUNT(cr.rating) as total_reviews,
                csa.city,
                csa.state,
                cp.base_rate_per_person,
                fcf.created_at as favorited_at
            FROM customer_favorite_chefs fcf
            JOIN chefs c ON fcf.chef_id = c.id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            WHERE fcf.customer_id = %s
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url,
                     csa.city, csa.state, cp.base_rate_per_person, fcf.created_at
            ORDER BY fcf.created_at DESC
        ''', (customer_id,))
        
        favorite_chefs = cursor.fetchall()
        
        # Format data
        formatted_chefs = []
        for chef in favorite_chefs:
            formatted_chef = dict(chef)
            if formatted_chef.get('favorited_at'):
                formatted_chef['favorited_at'] = formatted_chef['favorited_at'].isoformat()
            if formatted_chef.get('cuisines'):
                formatted_chef['cuisines'] = formatted_chef['cuisines'].split(',')
            if formatted_chef.get('average_rating'):
                formatted_chef['average_rating'] = round(float(formatted_chef['average_rating']), 2)
            if formatted_chef.get('base_rate_per_person'):
                formatted_chef['base_rate_per_person'] = float(formatted_chef['base_rate_per_person'])
            formatted_chefs.append(formatted_chef)
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'favorite_chefs': formatted_chefs,
            'count': len(formatted_chefs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>/favorite-chefs', methods=['POST'])
def add_favorite_chef(customer_id):
    """Add a chef to customer's favorites"""
    try:
        data = request.get_json()
        chef_id = data.get('chef_id')
        
        if not chef_id:
            return jsonify({'error': 'chef_id is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO customer_favorite_chefs (customer_id, chef_id) VALUES (%s, %s) ON CONFLICT DO NOTHING
        ''', (customer_id, chef_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Chef added to favorites successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>/favorite-chefs/<int:chef_id>', methods=['DELETE'])
def remove_favorite_chef(customer_id, chef_id):
    """Remove a chef from customer's favorites"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM customer_favorite_chefs 
            WHERE customer_id = %s AND chef_id = %s
        ''', (customer_id, chef_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Chef removed from favorites successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>/recent-chefs', methods=['GET'])
def get_recent_chefs(customer_id):
    """Get chefs the customer has recently completed appointments with"""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        limit = request.args.get('limit', 10, type=int)
        
        cursor.execute('''
            SELECT DISTINCT
                c.id as chef_id,
                c.first_name,
                c.last_name,
                c.first_name || ' ' || c.last_name as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                STRING_AGG(ct.name, ', ' ORDER BY ct.name) as cuisines,
                AVG(cr.rating) as average_rating,
                COUNT(cr.rating) as total_reviews,
                csa.city,
                csa.state,
                cp.base_rate_per_person,
                MAX(b.booking_date) as last_completed_date,
                COUNT(DISTINCT b.id) as completed_bookings
            FROM bookings b
            JOIN chefs c ON b.chef_id = c.id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            WHERE b.customer_id = %s AND b.chef_id IS NOT NULL AND b.status = 'completed'
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url,
                     csa.city, csa.state, cp.base_rate_per_person
            ORDER BY MAX(b.booking_date) DESC, MAX(b.booking_time) DESC
            LIMIT %s
        ''', (customer_id, limit))
        
        recent_chefs = cursor.fetchall()
        
        # Format data
        formatted_chefs = []
        for chef in recent_chefs:
            formatted_chef = dict(chef)
            if formatted_chef.get('last_completed_date'):
                formatted_chef['last_completed_date'] = str(formatted_chef['last_completed_date'])
            if formatted_chef.get('cuisines'):
                formatted_chef['cuisines'] = formatted_chef['cuisines'].split(',')
            if formatted_chef.get('average_rating'):
                formatted_chef['average_rating'] = round(float(formatted_chef['average_rating']), 2)
            if formatted_chef.get('base_rate_per_person'):
                formatted_chef['base_rate_per_person'] = float(formatted_chef['base_rate_per_person'])
            formatted_chefs.append(formatted_chef)
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'recent_chefs': formatted_chefs,
            'count': len(formatted_chefs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/customer/<int:customer_id>/nearby-chefs', methods=['GET'])
def get_nearby_chefs(customer_id):
    """Get chefs near the customer's location"""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        limit = request.args.get('limit', 20, type=int)
        max_distance = request.args.get('max_distance', 25, type=int)  # miles
        
        # Get customer's default address
        cursor.execute('''
            SELECT zip_code, city, state
            FROM customer_addresses 
            WHERE customer_id = %s AND is_default = TRUE
            LIMIT 1
        ''', (customer_id,))
        
        customer_address = cursor.fetchone()
        if not customer_address:
            return jsonify({'error': 'Customer address not found'}), 404
        
        customer_lat, customer_lon = get_zip_coordinates(customer_address['zip_code'])
        
        cursor.execute('''
            SELECT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                c.first_name || ' ' || c.last_name as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                STRING_AGG(ct.name, ', ' ORDER BY ct.name) as cuisines,
                AVG(cr.rating) as average_rating,
                COUNT(cr.rating) as total_reviews,
                csa.city,
                csa.state,
                csa.zip_code,
                csa.service_radius_miles,
                cp.base_rate_per_person
            FROM chefs c
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
            JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url,
                     csa.city, csa.state, csa.zip_code, csa.service_radius_miles, cp.base_rate_per_person
        ''')
        
        all_chefs = cursor.fetchall()
        
        # Calculate distances and filter
        nearby_chefs = []
        for chef in all_chefs:
            chef_lat, chef_lon = get_zip_coordinates(chef['zip_code'])
            distance = calculate_distance(customer_lat, customer_lon, chef_lat, chef_lon)
            
            # Check if customer is within chef's service radius and within max_distance
            service_radius = chef['service_radius_miles'] or 10
            if distance <= min(service_radius, max_distance):
                formatted_chef = dict(chef)
                formatted_chef['distance_miles'] = round(distance, 1)
                if formatted_chef.get('cuisines'):
                    formatted_chef['cuisines'] = formatted_chef['cuisines'].split(',')
                if formatted_chef.get('average_rating'):
                    formatted_chef['average_rating'] = round(float(formatted_chef['average_rating']), 2)
                if formatted_chef.get('base_rate_per_person'):
                    formatted_chef['base_rate_per_person'] = float(formatted_chef['base_rate_per_person'])
                nearby_chefs.append(formatted_chef)
        
        # Sort by distance
        nearby_chefs.sort(key=lambda x: x['distance_miles'])
        nearby_chefs = nearby_chefs[:limit]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'nearby_chefs': nearby_chefs,
            'count': len(nearby_chefs),
            'customer_location': {
                'city': customer_address['city'],
                'state': customer_address['state'],
                'zip_code': customer_address['zip_code']
            },
            'max_distance_miles': max_distance
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/chef/<int:chef_id>/bookings', methods=['GET'])
def get_chef_bookings(chef_id):
    """Get all bookings for a specific chef"""
    try:
        status = request.args.get('status', 'all')
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Base query
        query = '''
            SELECT 
                b.id as booking_id,
                b.booking_date,
                b.booking_time,
                b.cuisine_type,
                b.meal_type,
                b.event_type,
                b.number_of_people,
                b.special_notes,
                b.status,
                b.total_cost,
                b.produce_supply,
                b.created_at,
                b.updated_at,
                c.first_name || ' ' || c.last_name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone,
                ca.address_line1 as chef_address_line1,
                ca.address_line2 as chef_address_line2,
                ca.city as chef_city,
                ca.state as chef_state,
                ca.zip_code as chef_zip_code
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN chefs ch ON b.chef_id = ch.id
            LEFT JOIN chef_addresses ca ON ch.id = ca.chef_id AND ca.is_default = TRUE
            WHERE b.chef_id = %s
        '''
        
        params = [chef_id]
        
        if status != 'all':
            query += ' AND b.status = %s'
            params.append(status)
        
        query += ' ORDER BY b.booking_date DESC, b.booking_time DESC'
        
        cursor.execute(query, tuple(params))
        bookings = cursor.fetchall()
        
        # Format the results
        formatted_bookings = []
        for booking in bookings:
            formatted_booking = dict(booking)
            # Format date and time
            if formatted_booking.get('booking_date'):
                formatted_booking['booking_date'] = formatted_booking['booking_date'].strftime('%Y-%m-%d')
            if formatted_booking.get('booking_time'):
                formatted_booking['booking_time'] = str(formatted_booking['booking_time'])
            if formatted_booking.get('total_cost'):
                formatted_booking['total_cost'] = float(formatted_booking['total_cost'])
            formatted_bookings.append(formatted_booking)
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'bookings': formatted_bookings,
            'count': len(formatted_bookings)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/booking/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    """Update booking status (for chef to accept/decline bookings)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        # Validate status
        valid_statuses = ['pending', 'accepted', 'declined', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE bookings 
            SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (new_status, booking_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Booking not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Booking status updated to {new_status}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
