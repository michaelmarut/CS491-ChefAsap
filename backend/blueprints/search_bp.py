from flask import Blueprint, request, jsonify
import mysql.connector
from database.config import db_config

# Create the search blueprint
search_bp = Blueprint('search', __name__)

@search_bp.route('/chefs/nearby', methods=['GET'])
def search_nearby_chefs():
    """
    Search for chefs within a specified radius of a location
    """
    conn = None
    cursor = None
    try:
        # Get location parameters
        customer_lat = request.args.get('latitude', type=float)
        customer_lon = request.args.get('longitude', type=float) 
        radius = request.args.get('radius', 30, type=float)
        
        # Get other search parameters
        # Support both frontend (searchQuery, timing) and backend (chef_name, meal_timing) parameter names
        chef_name = request.args.get('searchQuery', '').strip() or request.args.get('chef_name', '').strip()
        cuisine = request.args.get('cuisine', '').strip()
        gender = request.args.get('gender', '').strip().lower()
        timing = request.args.get('timing', '').strip().lower() or request.args.get('meal_timing', '').strip().lower()
        min_rating = request.args.get('min_rating', type=float)
        max_price = request.args.get('max_price', type=float)
        sort_by = request.args.get('sort_by', 'distance').lower()  # distance, rating, price, reviews
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Convert 'all' to empty string for compatibility
        if gender == 'all':
            gender = ''
        if timing == 'all':
            timing = ''

        if not (customer_lat and customer_lon):
            return jsonify({
                'success': False,
                'error': 'Location required',
                'message': 'Please provide latitude and longitude'
            }), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Start with base parameters for distance calculation
        params = [customer_lat, customer_lon, customer_lat]

        # Build the complete SQL query with all parameters properly managed
        query = f'''
            SELECT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as full_name,
                c.email,
                c.phone,
                c.gender,
                
                -- Distance calculation (Haversine formula)
                (3959 * acos(cos(radians(%s)) * cos(radians(ca.latitude)) * 
                cos(radians(ca.longitude) - radians(%s)) + 
                sin(radians(%s)) * sin(radians(ca.latitude)))) as distance_miles,
                
                -- Pricing information
                cp.base_rate_per_person,
                cp.minimum_people,
                cp.maximum_people,
                cp.produce_supply_extra_cost as additional_charges,
                
                -- Address information 
                ca.address_line1 as street_address,
                ca.city,
                ca.state,
                ca.zip_code,
                ca.latitude,
                ca.longitude,
                
                -- Cuisine information
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
                
                -- Rating information from summary table
                crs.average_rating,
                crs.total_reviews
                
            FROM chefs c
            INNER JOIN chef_addresses ca ON c.id = ca.chef_id AND ca.is_default = TRUE
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_rating_summary crs ON c.id = crs.chef_id
        '''
        
        # Add meal timing JOIN if filtering by meal time
        if timing and timing in ['breakfast', 'lunch', 'dinner']:
            query += '''
            INNER JOIN chef_meal_availability cma ON c.id = cma.chef_id 
                AND cma.meal_type = %s AND cma.is_available = TRUE
            '''
            params.append(timing)
        
        query += '''
            WHERE ca.latitude IS NOT NULL 
            AND ca.longitude IS NOT NULL
        '''
        
        # Add chef name filter to WHERE clause (before GROUP BY)
        if chef_name:
            query += ' AND (c.first_name LIKE %s OR c.last_name LIKE %s OR CONCAT(c.first_name, " ", c.last_name) LIKE %s)'
            search_pattern = f'%{chef_name}%'
            params.extend([search_pattern, search_pattern, search_pattern])
        
        # Add gender filter to WHERE clause
        if gender and gender in ['male', 'female']:
            query += ' AND c.gender = %s'
            params.append(gender)
        
        query += '''
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.gender,
                     cp.base_rate_per_person, cp.minimum_people, cp.maximum_people, cp.produce_supply_extra_cost,
                     ca.address_line1, ca.city, ca.state, ca.zip_code, ca.latitude, ca.longitude,
                     crs.average_rating, crs.total_reviews
            HAVING distance_miles <= %s
        '''
        params.append(radius)
        
        # Add additional HAVING conditions
        if cuisine:
            query += ' AND FIND_IN_SET(%s, cuisines) > 0'
            params.append(cuisine)

        if min_rating is not None:
            query += ' AND average_rating >= %s'
            params.append(min_rating)

        if max_price is not None:
            query += ' AND base_rate_per_person <= %s'
            params.append(max_price)

        # Add dynamic ordering based on sort_by parameter
        if sort_by == 'distance':
            order_clause = 'distance_miles ASC, average_rating DESC, total_reviews DESC'
        elif sort_by == 'rating':
            order_clause = 'average_rating DESC, total_reviews DESC, distance_miles ASC'
        elif sort_by == 'price':
            order_clause = 'base_rate_per_person ASC, distance_miles ASC, average_rating DESC'
        elif sort_by == 'reviews':
            order_clause = 'total_reviews DESC, average_rating DESC, distance_miles ASC'
        else:
            # Default to distance sorting
            order_clause = 'distance_miles ASC, average_rating DESC, total_reviews DESC'
            
        query += f'''
            ORDER BY {order_clause}
            LIMIT %s OFFSET %s
        '''
        params.extend([limit, offset])

        print(f'Executing nearby search query for location ({customer_lat}, {customer_lon}) within {radius} miles')
        cursor.execute(query, params)
        chefs = cursor.fetchall()

        # Process results
        results = []
        for chef in chefs:
            chef_data = {
                'chef_id': chef['chef_id'],
                'first_name': chef['first_name'],
                'last_name': chef['last_name'],
                'full_name': chef['full_name'],
                'email': chef['email'],
                'phone': chef['phone'],
                'gender': chef['gender'],
                
                # Distance information
                'distance_miles': round(float(chef['distance_miles']), 1) if chef['distance_miles'] else None,
                
                # Location information
                'location': {
                    'street_address': chef['street_address'],
                    'city': chef['city'],
                    'state': chef['state'],
                    'zip_code': chef['zip_code'],
                    'latitude': float(chef['latitude']) if chef['latitude'] else None,
                    'longitude': float(chef['longitude']) if chef['longitude'] else None
                } if chef['city'] else None,
                
                # Pricing information
                'pricing': {
                    'base_rate_per_person': float(chef['base_rate_per_person']) if chef['base_rate_per_person'] else None,
                    'minimum_people': chef['minimum_people'],
                    'maximum_people': chef['maximum_people'],
                    'additional_charges': float(chef['additional_charges']) if chef['additional_charges'] else 0.0
                } if chef['base_rate_per_person'] else None,
                
                # Cuisine information
                'cuisines': chef['cuisines'].split(',') if chef['cuisines'] else [],
                
                # Rating information
                'rating': {
                    'average_rating': round(float(chef['average_rating']), 2) if chef['average_rating'] else None,
                    'total_reviews': chef['total_reviews'] or 0
                }
            }
            results.append(chef_data)

        response_data = {
            'success': True,
            'chefs': results,
            'search_location': {
                'latitude': customer_lat,
                'longitude': customer_lon
            },
            'search_radius_miles': radius,
            'total_found': len(results),
            'search_params': {
                'searchQuery': chef_name or None,
                'cuisine': cuisine or None,
                'gender': gender or None,
                'timing': timing or None,
                'min_rating': min_rating,
                'max_price': max_price,
                'radius': radius,
                'sort_by': sort_by
            }
        }

        print(f'Nearby search completed: Found {len(results)} chefs within {radius} miles')
        return jsonify(response_data), 200

    except Exception as e:
        print(f'Error in search_nearby_chefs: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to search nearby chefs'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@search_bp.route('/cuisines', methods=['GET'])
def get_available_cuisines():
    """Get all available cuisine types"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute('''
            SELECT DISTINCT ct.name, COUNT(cc.chef_id) as chef_count
            FROM cuisine_types ct
            LEFT JOIN chef_cuisines cc ON ct.id = cc.cuisine_id
            GROUP BY ct.name
            HAVING chef_count > 0
            ORDER BY chef_count DESC, ct.name
        ''')
        cuisines = cursor.fetchall()   

        return jsonify({
            'success': True,
            'cuisines': [c['name'] for c in cuisines]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()