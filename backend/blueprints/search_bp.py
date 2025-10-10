from flask import Blueprint, request, jsonify
import mysql.connector
from database.config import db_config

# Create the search blueprint
search_bp = Blueprint('search', __name__)

@search_bp.route('/chefs', methods=['GET'])
def search_chefs():
    """
    Chef search API endpoint
    
    Searchable parameters (Priority Order):
    1. Time availability: booking_date, booking_time (MOST IMPORTANT - chef must be available)
    2. Location search: location (city/state/zip code)
    3. Cuisine search: cuisine (cuisine type)
    4. Name search: name (chef name)
    5. Price search: min_price, max_price (price range)
    6. People search: min_people, max_people (service capacity range)
    7. Rating search: min_rating (minimum rating)
    8. Service radius: radius (service radius in miles)
    9. Pagination: limit, offset
    """
    conn = None
    cursor = None
    try:
        # Get query parameters (TIME FIRST - most important!)
        booking_date = request.args.get('booking_date')      # Required booking date (YYYY-MM-DD)
        booking_time = request.args.get('booking_time')      # Required booking time (HH:MM)
        
        location = request.args.get('location', '').strip()  # Location search
        cuisine = request.args.get('cuisine', '').strip()   # Cuisine search
        name = request.args.get('name', '').strip()         # Name search
        min_price = request.args.get('min_price', type=float)  # Minimum price
        max_price = request.args.get('max_price', type=float)  # Maximum price
        min_people = request.args.get('min_people', type=int)  # Minimum people
        max_people = request.args.get('max_people', type=int)  # Maximum people
        min_rating = request.args.get('min_rating', type=float)  # Minimum rating
        radius = request.args.get('radius', 25, type=int)     # Search radius
        limit = request.args.get('limit', 20, type=int)       # Result limit
        offset = request.args.get('offset', 0, type=int)      # Pagination offset

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Validate time parameters if provided
        day_of_week = None
        booking_datetime = None
        if booking_date or booking_time:
            if not (booking_date and booking_time):
                return jsonify({
                    'success': False,
                    'error': 'Both booking_date and booking_time must be provided together',
                    'message': 'Please provide both date (YYYY-MM-DD) and time (HH:MM) for availability search'
                }), 400
            
            # Validate date format and ensure it's in the future
            try:
                from datetime import datetime, timedelta
                booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
                if booking_datetime <= datetime.now():
                    return jsonify({
                        'success': False,
                        'error': 'Booking time must be in the future',
                        'message': 'Please select a future date and time'
                    }), 400
                
                # Get day of week for availability check
                day_of_week = booking_datetime.strftime('%A').lower()
                
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date/time format',
                    'message': 'Please use YYYY-MM-DD format for date and HH:MM format for time'
                }), 400

        # Build base query - TIME AVAILABILITY IS PRIORITY!
        base_query = '''
            SELECT DISTINCT
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as full_name,
                c.email,
                c.phone,
                c.photo_url,
                c.created_at,
                
                -- Pricing information
                cp.base_rate_per_person,
                cp.produce_supply_extra_cost,
                cp.minimum_people,
                cp.maximum_people,
                
                -- Service area information
                csa.city,
                csa.state,
                csa.zip_code,
                csa.service_radius_miles,
                
                -- Cuisine information
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
                
                -- Rating information
                AVG(cr.rating) as average_rating,
                COUNT(cr.rating) as total_reviews,
                
                -- Availability information
                cad.start_time,
                cad.end_time,
                cad.day_of_week
                
            FROM chefs c
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
            LEFT JOIN chef_availability_days cad ON c.id = cad.chef_id
        '''

        # Build WHERE conditions
        conditions = []
        params = []

        # 0. TIME AVAILABILITY CHECK (HIGHEST PRIORITY!)
        if booking_date and booking_time and day_of_week:
            # Check chef is available on that day and time
            time_availability_condition = '''(
                cad.day_of_week = %s 
                AND cad.start_time <= %s 
                AND cad.end_time >= %s
                AND c.id NOT IN (
                    SELECT DISTINCT b.chef_id 
                    FROM bookings b 
                    WHERE b.booking_date = %s 
                    AND b.booking_time = %s 
                    AND b.status IN ('accepted', 'pending')
                    AND b.chef_id IS NOT NULL
                )
            )'''
            conditions.append(time_availability_condition)
            params.extend([day_of_week, booking_time, booking_time, booking_date, booking_time])

        # 1. Location search (search city, state or zip code)
        if location:
            location_condition = '(LOWER(csa.city) LIKE LOWER(%s) OR LOWER(csa.state) LIKE LOWER(%s) OR csa.zip_code LIKE %s)'
            conditions.append(location_condition)
            location_param = f'%{location}%'
            params.extend([location_param, location_param, location_param])

        # 2. Cuisine search
        if cuisine:
            conditions.append('LOWER(ct.name) LIKE LOWER(%s)')
            params.append(f'%{cuisine}%')

        # 3. Name search (search first name, last name or full name)
        if name:
            name_condition = '(LOWER(c.first_name) LIKE LOWER(%s) OR LOWER(c.last_name) LIKE LOWER(%s) OR LOWER(CONCAT(c.first_name, " ", c.last_name)) LIKE LOWER(%s))'
            conditions.append(name_condition)
            name_param = f'%{name}%'
            params.extend([name_param, name_param, name_param])

        # 4. Price range search
        if min_price is not None:
            conditions.append('cp.base_rate_per_person >= %s')
            params.append(min_price)

        if max_price is not None:
            conditions.append('cp.base_rate_per_person <= %s')
            params.append(max_price)

        # 5. People capacity range search
        if min_people is not None:
            conditions.append('cp.maximum_people >= %s')
            params.append(min_people)

        if max_people is not None:
            conditions.append('cp.minimum_people <= %s')
            params.append(max_people)

        # Combine WHERE clause
        where_clause = ''
        if conditions:
            where_clause = ' WHERE ' + ' AND '.join(conditions)

        # Full query - add GROUP BY and HAVING
        full_query = base_query + where_clause + '''
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url, c.created_at,
                     cp.base_rate_per_person, cp.produce_supply_extra_cost,
                     cp.minimum_people, cp.maximum_people,
                     csa.city, csa.state, csa.zip_code, csa.service_radius_miles,
                     cad.start_time, cad.end_time, cad.day_of_week
        '''

        # 6. Rating search (use HAVING because it's an aggregate function)
        if min_rating is not None:
            full_query += ' HAVING AVG(cr.rating) >= %s'
            params.append(min_rating)

        # Sorting and pagination - TIME AVAILABLE CHEFS FIRST!
        if booking_date and booking_time:
            # Prioritize chefs who are available at requested time
            full_query += '''
                ORDER BY 
                    CASE WHEN cad.day_of_week IS NOT NULL THEN 1 ELSE 2 END,
                    average_rating DESC, 
                    total_reviews DESC, 
                    c.first_name, c.last_name
                LIMIT %s OFFSET %s
            '''
        else:
            # Standard sorting when no time specified
            full_query += '''
                ORDER BY average_rating DESC, total_reviews DESC, c.first_name, c.last_name
                LIMIT %s OFFSET %s
            '''
        params.extend([limit, offset])

        print(f'Executing search query with params: {params}')
        cursor.execute(full_query, params)
        chefs = cursor.fetchall()

        # Get total count (for pagination)
        count_base_query = '''
            SELECT COUNT(DISTINCT c.id) as total
            FROM chefs c
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
        ''' + where_clause

        count_params = params[:-2]  # Exclude limit and offset parameters

        # Special handling for total count query if rating search exists
        if min_rating is not None:
            count_query = f'''
                SELECT COUNT(*) as total FROM (
                    {base_query + where_clause}
                    GROUP BY c.id
                    HAVING AVG(cr.rating) >= %s
                ) as filtered_results
            '''
            count_params = params[:-2]  # Include min_rating but exclude limit and offset
        else:
            count_query = count_base_query
            count_params = params[:-2]  # Exclude limit and offset

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']

        # Process result data
        results = []
        for chef in chefs:
            chef_data = {
                'chef_id': chef['chef_id'],
                'first_name': chef['first_name'],
                'last_name': chef['last_name'],
                'full_name': chef['full_name'],
                'email': chef['email'],
                'phone': chef['phone'],
                'photo_url': chef['photo_url'],
                'created_at': chef['created_at'].isoformat() if chef['created_at'] else None,
                
                # Location information
                'location': {
                    'city': chef['city'],
                    'state': chef['state'],
                    'zip_code': chef['zip_code'],
                    'service_radius_miles': chef['service_radius_miles']
                } if chef['city'] else None,
                
                # Pricing information
                'pricing': {
                    'base_rate_per_person': float(chef['base_rate_per_person']) if chef['base_rate_per_person'] else None,
                    'produce_supply_extra_cost': float(chef['produce_supply_extra_cost']) if chef['produce_supply_extra_cost'] else 0.0,
                    'minimum_people': chef['minimum_people'],
                    'maximum_people': chef['maximum_people']
                } if chef['base_rate_per_person'] else None,
                
                # Cuisine information
                'cuisines': chef['cuisines'].split(',') if chef['cuisines'] else [],
                
                # Rating information
                'rating': {
                    'average_rating': round(float(chef['average_rating']), 2) if chef['average_rating'] else None,
                    'total_reviews': chef['total_reviews'] or 0
                },
                
                # Availability information
                'availability': {
                    'is_available_at_requested_time': chef['day_of_week'] is not None if booking_date and booking_time else None,
                    'available_day': chef['day_of_week'],
                    'available_start_time': str(chef['start_time']) if chef['start_time'] else None,
                    'available_end_time': str(chef['end_time']) if chef['end_time'] else None
                } if booking_date and booking_time else None
            }
            results.append(chef_data)

        response_data = {
            'success': True,
            'chefs': results,
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_next': offset + limit < total_count,
                'has_prev': offset > 0,
                'total_pages': (total_count + limit - 1) // limit,
                'current_page': (offset // limit) + 1
            },
            'search_params': {
                'booking_date': booking_date,
                'booking_time': booking_time,
                'location': location or None,
                'cuisine': cuisine or None,
                'name': name or None,
                'min_price': min_price,
                'max_price': max_price,
                'min_people': min_people,
                'max_people': max_people,
                'min_rating': min_rating,
                'radius': radius
            }
        }

        print(f'Search completed: Found {len(results)} chefs out of {total_count} total')
        return jsonify(response_data), 200

    except Exception as e:
        print(f'Error in search_chefs: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to search chefs'
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
            SELECT DISTINCT ct.id, ct.name, COUNT(cc.chef_id) as chef_count
            FROM cuisine_types ct
            LEFT JOIN chef_cuisines cc ON ct.id = cc.cuisine_id
            GROUP BY ct.id, ct.name
            HAVING chef_count > 0
            ORDER BY chef_count DESC, ct.name
        ''')
        cuisines = cursor.fetchall()

        return jsonify({
            'success': True,
            'cuisines': cuisines
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


@search_bp.route('/locations', methods=['GET'])
def get_available_locations():
    """Get all available service locations"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute('''
            SELECT DISTINCT 
                csa.city, 
                csa.state, 
                COUNT(DISTINCT csa.chef_id) as chef_count
            FROM chef_service_areas csa
            GROUP BY csa.city, csa.state
            ORDER BY chef_count DESC, csa.state, csa.city
        ''')
        locations = cursor.fetchall()

        return jsonify({
            'success': True,
            'locations': locations
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


@search_bp.route('/chef/<int:chef_id>', methods=['GET'])
def get_chef_details(chef_id):
    """Get detailed information for a specific chef"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get chef basic info, pricing, service areas
        cursor.execute('''
            SELECT c.*, cp.*, csa.*,
                   AVG(cr.rating) as average_rating,
                   COUNT(cr.rating) as total_reviews
            FROM chefs c
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
            WHERE c.id = %s
            GROUP BY c.id
        ''', (chef_id,))
        
        chef = cursor.fetchone()
        if not chef:
            return jsonify({
                'success': False,
                'error': 'Chef not found'
            }), 404

        # Get chef's cuisines
        cursor.execute('''
            SELECT ct.id, ct.name
            FROM chef_cuisines cc
            JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE cc.chef_id = %s
            ORDER BY ct.name
        ''', (chef_id,))
        cuisines = cursor.fetchall()

        # Get recent reviews
        cursor.execute('''
            SELECT cr.rating, cr.review_text, cr.created_at,
                   cu.first_name as customer_first_name
            FROM chef_ratings cr
            JOIN customers cu ON cr.customer_id = cu.id
            WHERE cr.chef_id = %s AND cr.review_text IS NOT NULL
            ORDER BY cr.created_at DESC
            LIMIT 5
        ''', (chef_id,))
        recent_reviews = cursor.fetchall()

        chef_data = {
            'chef_id': chef['id'],
            'first_name': chef['first_name'],
            'last_name': chef['last_name'],
            'full_name': f"{chef['first_name']} {chef['last_name']}",
            'email': chef['email'],
            'phone': chef['phone'],
            'photo_url': chef['photo_url'],
            'created_at': chef['created_at'].isoformat() if chef['created_at'] else None,
            
            'location': {
                'city': chef['city'],
                'state': chef['state'],
                'zip_code': chef['zip_code'],
                'service_radius_miles': chef['service_radius_miles']
            } if chef['city'] else None,
            
            'pricing': {
                'base_rate_per_person': float(chef['base_rate_per_person']) if chef['base_rate_per_person'] else None,
                'produce_supply_extra_cost': float(chef['produce_supply_extra_cost']) if chef['produce_supply_extra_cost'] else 0.0,
                'minimum_people': chef['minimum_people'],
                'maximum_people': chef['maximum_people']
            } if chef['base_rate_per_person'] else None,
            
            'cuisines': cuisines,
            
            'rating': {
                'average_rating': round(float(chef['average_rating']), 2) if chef['average_rating'] else None,
                'total_reviews': chef['total_reviews'] or 0
            },
            
            'recent_reviews': [
                {
                    'rating': review['rating'],
                    'review_text': review['review_text'],
                    'customer_first_name': review['customer_first_name'],
                    'created_at': review['created_at'].isoformat() if review['created_at'] else None
                }
                for review in recent_reviews
            ]
        }

        return jsonify({
            'success': True,
            'chef': chef_data
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


@search_bp.route('/quick-search', methods=['GET'])
def quick_search():
    """
    Universal search bar functionality
    Intelligently searches across chef names, locations, cuisines, and other fields
    """
    conn = None
    cursor = None
    try:
        # Get search query
        query = request.args.get('q', '').strip()  # Universal search query
        booking_date = request.args.get('booking_date')  # Optional time filter
        booking_time = request.args.get('booking_time')
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        if not query:
            return jsonify({
                'success': False,
                'error': 'Search query is required',
                'message': 'Please provide a search term (q parameter)'
            }), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Time validation (same as main search)
        day_of_week = None
        if booking_date and booking_time:
            try:
                from datetime import datetime
                booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
                if booking_datetime <= datetime.now():
                    return jsonify({
                        'success': False,
                        'error': 'Booking time must be in the future'
                    }), 400
                day_of_week = booking_datetime.strftime('%A').lower()
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date/time format'
                }), 400

        # Universal search query - searches across multiple fields
        search_query = '''
            SELECT DISTINCT
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as full_name,
                c.email,
                c.phone,
                c.photo_url,
                
                -- Pricing information
                cp.base_rate_per_person,
                cp.produce_supply_extra_cost,
                cp.minimum_people,
                cp.maximum_people,
                
                -- Location information
                csa.city,
                csa.state,
                csa.zip_code,
                csa.service_radius_miles,
                
                -- Cuisine information
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
                
                -- Rating information
                AVG(cr.rating) as average_rating,
                COUNT(cr.rating) as total_reviews,
                
                -- Search relevance scoring (simplified to avoid GROUP BY issues)
                CASE 
                    -- Exact name match gets highest score
                    WHEN LOWER(CONCAT(c.first_name, ' ', c.last_name)) = LOWER(%s) THEN 100
                    WHEN LOWER(c.first_name) = LOWER(%s) OR LOWER(c.last_name) = LOWER(%s) THEN 90
                    
                    -- Exact location match
                    WHEN LOWER(csa.city) = LOWER(%s) OR LOWER(csa.state) = LOWER(%s) THEN 80
                    
                    -- Partial name match
                    WHEN LOWER(CONCAT(c.first_name, ' ', c.last_name)) LIKE LOWER(%s) THEN 70
                    WHEN LOWER(c.first_name) LIKE LOWER(%s) OR LOWER(c.last_name) LIKE LOWER(%s) THEN 65
                    
                    -- Partial location match
                    WHEN LOWER(csa.city) LIKE LOWER(%s) OR LOWER(csa.state) LIKE LOWER(%s) THEN 55
                    WHEN csa.zip_code LIKE %s THEN 50
                    
                    ELSE 0
                END as search_relevance
                
            FROM chefs c
            LEFT JOIN chef_pricing cp ON c.id = cp.chef_id
            LEFT JOIN chef_service_areas csa ON c.id = csa.chef_id
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            LEFT JOIN chef_ratings cr ON c.id = cr.chef_id
        '''

        # Add time availability check if provided
        if booking_date and booking_time and day_of_week:
            search_query += '''
                LEFT JOIN chef_availability_days cad ON c.id = cad.chef_id
            '''

        # WHERE clause for search matching
        where_conditions = '''
            WHERE (
                LOWER(c.first_name) LIKE LOWER(%s) OR
                LOWER(c.last_name) LIKE LOWER(%s) OR
                LOWER(CONCAT(c.first_name, ' ', c.last_name)) LIKE LOWER(%s) OR
                LOWER(ct.name) LIKE LOWER(%s) OR
                LOWER(csa.city) LIKE LOWER(%s) OR
                LOWER(csa.state) LIKE LOWER(%s) OR
                csa.zip_code LIKE %s
            )
        '''

        # Add time availability filter
        if booking_date and booking_time and day_of_week:
            where_conditions += '''
                AND (
                    cad.day_of_week IS NULL OR
                    (
                        cad.day_of_week = %s 
                        AND cad.start_time <= %s 
                        AND cad.end_time >= %s
                        AND c.id NOT IN (
                            SELECT DISTINCT b.chef_id 
                            FROM bookings b 
                            WHERE b.booking_date = %s 
                            AND b.booking_time = %s 
                            AND b.status IN ('accepted', 'pending')
                            AND b.chef_id IS NOT NULL
                        )
                    )
                )
            '''

        # Prepare parameters
        search_param = f'%{query}%'
        
        # Parameters for relevance scoring (11 parameters - removed cuisine parameters)
        relevance_params = [
            query, query, query,  # exact name matches
            query, query,  # exact location
            search_param, search_param, search_param,  # partial name
            search_param, search_param,  # partial location
            search_param  # zip code
        ]
        
        # Parameters for WHERE clause (7 parameters)
        where_params = [
            search_param, search_param, search_param,  # name matching
            search_param,  # cuisine matching
            search_param, search_param,  # location matching
            search_param  # zip code matching
        ]

        # Add time parameters if needed
        time_params = []
        if booking_date and booking_time and day_of_week:
            time_params = [day_of_week, booking_time, booking_time, booking_date, booking_time]

        # Complete query
        full_query = search_query + where_conditions + '''
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.photo_url,
                     cp.base_rate_per_person, cp.produce_supply_extra_cost,
                     cp.minimum_people, cp.maximum_people,
                     csa.city, csa.state, csa.zip_code, csa.service_radius_miles
            HAVING search_relevance >= 0
            ORDER BY 
                search_relevance DESC,
                average_rating DESC,
                total_reviews DESC,
                c.first_name, c.last_name
            LIMIT %s OFFSET %s
        '''

        # Combine all parameters
        all_params = relevance_params + where_params + time_params + [limit, offset]

        print(f'Quick search query: "{query}" with {len(all_params)} parameters')
        cursor.execute(full_query, all_params)
        results = cursor.fetchall()

        # Process results
        chefs = []
        for chef in results:
            chef_data = {
                'chef_id': chef['chef_id'],
                'first_name': chef['first_name'],
                'last_name': chef['last_name'],
                'full_name': chef['full_name'],
                'email': chef['email'],
                'phone': chef['phone'],
                'photo_url': chef['photo_url'],
                
                'location': {
                    'city': chef['city'],
                    'state': chef['state'],
                    'zip_code': chef['zip_code'],
                    'service_radius_miles': chef['service_radius_miles']
                } if chef['city'] else None,
                
                'pricing': {
                    'base_rate_per_person': float(chef['base_rate_per_person']) if chef['base_rate_per_person'] else None,
                    'produce_supply_extra_cost': float(chef['produce_supply_extra_cost']) if chef['produce_supply_extra_cost'] else 0.0,
                    'minimum_people': chef['minimum_people'],
                    'maximum_people': chef['maximum_people']
                } if chef['base_rate_per_person'] else None,
                
                'cuisines': chef['cuisines'].split(',') if chef['cuisines'] else [],
                
                'rating': {
                    'average_rating': round(float(chef['average_rating']), 2) if chef['average_rating'] else None,
                    'total_reviews': chef['total_reviews'] or 0
                },
                
                'search_relevance': chef['search_relevance']
            }
            chefs.append(chef_data)

        return jsonify({
            'success': True,
            'query': query,
            'results': chefs,
            'total_found': len(chefs),
            'search_info': {
                'searched_fields': ['chef_name', 'cuisine', 'location', 'zip_code'],
                'booking_date': booking_date,
                'booking_time': booking_time,
                'time_filtered': booking_date and booking_time
            }
        }), 200

    except Exception as e:
        print(f'Error in quick_search: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@search_bp.route('/search-suggestions', methods=['GET'])
def get_search_suggestions():
    """
    Provide search suggestions as user types (autocomplete functionality)
    """
    conn = None
    cursor = None
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if len(query) < 2:  # Only suggest after 2+ characters
            return jsonify({
                'success': True,
                'suggestions': []
            }), 200

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        suggestions = []

        # Get chef name suggestions
        cursor.execute('''
            SELECT DISTINCT 
                CONCAT(first_name, ' ', last_name) as suggestion,
                'chef_name' as type,
                first_name, last_name
            FROM chefs 
            WHERE LOWER(first_name) LIKE LOWER(%s) 
               OR LOWER(last_name) LIKE LOWER(%s)
               OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER(%s)
            ORDER BY first_name, last_name
            LIMIT 5
        ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
        
        chef_suggestions = cursor.fetchall()
        for chef in chef_suggestions:
            suggestions.append({
                'text': chef['suggestion'],
                'type': 'chef_name',
                'display': f"👨‍🍳 {chef['suggestion']}"
            })

        # Get cuisine suggestions
        cursor.execute('''
            SELECT DISTINCT ct.name as suggestion
            FROM cuisine_types ct
            JOIN chef_cuisines cc ON ct.id = cc.cuisine_id
            WHERE LOWER(ct.name) LIKE LOWER(%s)
            ORDER BY ct.name
            LIMIT 3
        ''', (f'%{query}%',))
        
        cuisine_suggestions = cursor.fetchall()
        for cuisine in cuisine_suggestions:
            suggestions.append({
                'text': cuisine['suggestion'],
                'type': 'cuisine',
                'display': f"🍽️ {cuisine['suggestion']} Cuisine"
            })

        # Get location suggestions
        cursor.execute('''
            SELECT DISTINCT 
                CONCAT(city, ', ', state) as suggestion,
                city, state
            FROM chef_service_areas 
            WHERE LOWER(city) LIKE LOWER(%s) 
               OR LOWER(state) LIKE LOWER(%s)
            ORDER BY city, state
            LIMIT 3
        ''', (f'%{query}%', f'%{query}%'))
        
        location_suggestions = cursor.fetchall()
        for location in location_suggestions:
            suggestions.append({
                'text': location['suggestion'],
                'type': 'location', 
                'display': f"📍 {location['suggestion']}"
            })

        return jsonify({
            'success': True,
            'query': query,
            'suggestions': suggestions[:limit]
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


@search_bp.route('/availability', methods=['GET'])
def check_chef_availability():
    """Check which chefs are available at a specific date and time"""
    conn = None
    cursor = None
    try:
        booking_date = request.args.get('booking_date')
        booking_time = request.args.get('booking_time')
        
        if not (booking_date and booking_time):
            return jsonify({
                'success': False,
                'error': 'Both booking_date and booking_time are required',
                'message': 'Please provide both date (YYYY-MM-DD) and time (HH:MM)'
            }), 400

        # Validate and parse date/time
        try:
            from datetime import datetime
            booking_datetime = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
            day_of_week = booking_datetime.strftime('%A').lower()
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid date/time format'
            }), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get available chefs at the specified time
        cursor.execute('''
            SELECT DISTINCT
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as full_name,
                cad.day_of_week,
                cad.start_time,
                cad.end_time
            FROM chefs c
            JOIN chef_availability_days cad ON c.id = cad.chef_id
            WHERE cad.day_of_week = %s
            AND cad.start_time <= %s
            AND cad.end_time >= %s
            AND c.id NOT IN (
                SELECT DISTINCT b.chef_id 
                FROM bookings b 
                WHERE b.booking_date = %s 
                AND b.booking_time = %s 
                AND b.status IN ('accepted', 'pending')
                AND b.chef_id IS NOT NULL
            )
            ORDER BY c.first_name, c.last_name
        ''', (day_of_week, booking_time, booking_time, booking_date, booking_time))

        available_chefs = cursor.fetchall()

        return jsonify({
            'success': True,
            'booking_date': booking_date,
            'booking_time': booking_time,
            'day_of_week': day_of_week,
            'available_chefs': [
                {
                    'chef_id': chef['chef_id'],
                    'full_name': chef['full_name'],
                    'available_from': str(chef['start_time']),
                    'available_until': str(chef['end_time'])
                }
                for chef in available_chefs
            ],
            'total_available': len(available_chefs)
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


@search_bp.route('/stats', methods=['GET'])
def get_search_stats():
    """Get search-related statistics"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get basic statistics
        cursor.execute('SELECT COUNT(*) as total_chefs FROM chefs')
        total_chefs = cursor.fetchone()['total_chefs']

        cursor.execute('SELECT COUNT(DISTINCT cuisine_id) as total_cuisines FROM chef_cuisines')
        total_cuisines = cursor.fetchone()['total_cuisines']

        cursor.execute('SELECT COUNT(DISTINCT CONCAT(city, state)) as total_locations FROM chef_service_areas')
        total_locations = cursor.fetchone()['total_locations']

        cursor.execute('SELECT MIN(base_rate_per_person) as min_price, MAX(base_rate_per_person) as max_price FROM chef_pricing WHERE base_rate_per_person > 0')
        price_range = cursor.fetchone()

        return jsonify({
            'success': True,
            'stats': {
                'total_chefs': total_chefs,
                'total_cuisines': total_cuisines,
                'total_locations': total_locations,
                'price_range': {
                    'min_price': float(price_range['min_price']) if price_range['min_price'] else 0,
                    'max_price': float(price_range['max_price']) if price_range['max_price'] else 0
                }
            }
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


# Helper functions for search page user interface features
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    import math
    R = 3959  # Earth's radius in miles
    
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


@search_bp.route('/customer/<int:customer_id>/favorite-chefs', methods=['GET'])
def get_customer_favorite_chefs(customer_id):
    """Get customer's favorite chefs for search page"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
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
            LIMIT 10
        ''', (customer_id,))
        
        favorite_chefs = cursor.fetchall()
        
        # Format data for search page
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
        
        return jsonify({
            'success': True,
            'favorite_chefs': formatted_chefs,
            'count': len(formatted_chefs)
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


@search_bp.route('/customer/<int:customer_id>/recent-chefs', methods=['GET'])
def get_customer_recent_chefs(customer_id):
    """Get chefs the customer has recently completed appointments with for search page"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        limit = request.args.get('limit', 10, type=int)
        
        cursor.execute('''
            SELECT DISTINCT
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
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
        
        # Format data for search page
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
        
        return jsonify({
            'success': True,
            'recent_chefs': formatted_chefs,
            'count': len(formatted_chefs)
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


@search_bp.route('/customer/<int:customer_id>/nearby-chefs', methods=['GET'])
def get_customer_nearby_chefs(customer_id):
    """Get chefs near the customer's location for search page"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        limit = request.args.get('limit', 20, type=int)
        radius_km = request.args.get('radius_km', 40, type=int)
        max_distance = radius_km * 0.621371  # Convert km to miles
        
        # Get customer's default address
        cursor.execute('''
            SELECT zip_code, city, state
            FROM customer_addresses 
            WHERE customer_id = %s AND is_default = TRUE
            LIMIT 1
        ''', (customer_id,))
        
        customer_address = cursor.fetchone()
        if not customer_address:
            return jsonify({
                'success': False,
                'error': 'Customer address not found',
                'message': 'Please add your address to see nearby chefs'
            }), 404
        
        customer_lat, customer_lon = get_zip_coordinates(customer_address['zip_code'])
        
        cursor.execute('''
            SELECT 
                c.id as chef_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) as chef_name,
                c.email,
                c.phone,
                c.photo_url,
                GROUP_CONCAT(DISTINCT ct.name ORDER BY ct.name) as cuisines,
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
        
        # Sort by distance and limit results
        nearby_chefs.sort(key=lambda x: x['distance_miles'])
        nearby_chefs = nearby_chefs[:limit]
        
        return jsonify({
            'success': True,
            'nearby_chefs': nearby_chefs,
            'count': len(nearby_chefs),
            'customer_location': {
                'city': customer_address['city'],
                'state': customer_address['state'],
                'zip_code': customer_address['zip_code']
            },
            'search_radius_miles': round(max_distance, 1)
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