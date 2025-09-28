from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from database.config import db_config as DB_CONFIG

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def bad_request(msg, code=400):
    return jsonify(error=msg), code

def write_history(cur, booking_id, actor_user_id, action, detail=None):
    cur.execute(
        """
        INSERT INTO booking_status_history (booking_id, actor_user_id, action, detail)
        VALUES (%s, %s, %s, %s)
        """,
        (booking_id, actor_user_id, action, detail)
    )

def fetch_one(cur, sql, params):
    cur.execute(sql, params)
    return cur.fetchone()

def fetch_all(cur, sql, params):
    cur.execute(sql, params)
    return cur.fetchall()

def to_dt(val):
    if isinstance(val, datetime):
        return val
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(val, fmt)
        except Exception:
            pass
    raise ValueError("Invalid datetime format, expected 'YYYY-MM-DD HH:MM'")

# -----------------------------
# POST /api/bookings  (pending)
# body: {customer_id, chef_id, start_time, end_time, notes?, actor_user_id}
# -----------------------------
@bookings_bp.route("", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    required = ["customer_id", "chef_id", "start_time", "end_time", "actor_user_id"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return bad_request(f"Missing field(s): {', '.join(missing)}")

    try:
        start_time = to_dt(data["start_time"])
        end_time   = to_dt(data["end_time"])
    except ValueError as e:
        return bad_request(str(e))

    if end_time <= start_time:
        return bad_request("end_time must be greater than start_time")

    customer_id   = int(data["customer_id"])
    chef_id       = int(data["chef_id"])
    notes         = data.get("notes")
    actor_user_id = int(data["actor_user_id"])  

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        # customer/chef exit
        if not fetch_one(cur, "SELECT id FROM customers WHERE id=%s", (customer_id,)):
            return bad_request("Invalid customer_id")
        if not fetch_one(cur, "SELECT id FROM chefs WHERE id=%s", (chef_id,)):
            return bad_request("Invalid chef_id")

        cur.execute("""
            SELECT 1 FROM bookings
             WHERE customer_id=%s
               AND status IN ('pending','accepted')
               AND start_time < %s AND end_time > %s
            LIMIT 1
        """, (customer_id, end_time, start_time))
        if cur.fetchone():
            return bad_request("Customer already has a booking in this time window")


        cur2 = conn.cursor()
        cur2.execute(
            """
            INSERT INTO bookings
              (customer_id, chef_id, start_time, end_time, status, notes)
            VALUES (%s, %s, %s, %s, 'pending', %s)
            """,
            (customer_id, chef_id, start_time, end_time, notes)
        )
        booking_id = cur2.lastrowid

        write_history(cur2, booking_id, actor_user_id, "create", "pending")
        conn.commit()

        return jsonify({"booking_id": booking_id, "status": "pending"}), 201

    except Error as e:
        print(" create_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# GET /api/bookings/<id>  
# -----------------------------
@bookings_bp.route("/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT b.*, c.first_name AS customer_first_name, c.last_name AS customer_last_name,
                   ch.first_name AS chef_first_name, ch.last_name AS chef_last_name
              FROM bookings b
              JOIN customers c ON c.id=b.customer_id
              JOIN chefs ch     ON ch.id=b.chef_id
             WHERE b.id=%s
        """, (booking_id,))
        row = cur.fetchone()
        if not row:
            return bad_request("Booking not found", 404)
        return jsonify(row), 200
    except Error as e:
        print("get_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass


@bookings_bp.route("", methods=["GET"])
def list_bookings():
    role    = (request.args.get("role") or "").strip().lower()
    user_id = request.args.get("user_id")
    if role not in ("customer", "chef") or not user_id:
        return bad_request("Provide role=customer|chef and user_id")

    status = request.args.get("status")
    from_d = request.args.get("from")
    to_d   = request.args.get("to")
    order  = (request.args.get("order") or "desc").lower()
    order  = "ASC" if order == "asc" else "DESC"

    filters, params = [], []
    if role == "customer":
        filters.append("b.customer_id = %s")
    else:
        filters.append("b.chef_id = %s")
    params.append(int(user_id))

    if status:
        s = [s.strip() for s in status.split(",") if s.strip()]
        placeholders = ", ".join(["%s"]*len(s))
        filters.append(f"b.status IN ({placeholders})")
        params.extend(s)

    if from_d:
        filters.append("b.start_time >= %s")
        params.append(from_d + " 00:00:00")
    if to_d:
        filters.append("b.end_time <= %s")
        params.append(to_d + " 23:59:59")

    where = "WHERE " + " AND ".join(filters) if filters else ""
    sql = f"""
        SELECT b.*, c.first_name AS customer_first_name, c.last_name AS customer_last_name,
               ch.first_name AS chef_first_name, ch.last_name AS chef_last_name
          FROM bookings b
          JOIN customers c ON c.id=b.customer_id
          JOIN chefs ch     ON ch.id=b.chef_id
        {where}
        ORDER BY b.start_time {order}, b.id {order}
        LIMIT 500
    """

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)
        cur.execute(sql, tuple(params))
        return jsonify(cur.fetchall()), 200
    except Error as e:
        print("list_bookings:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/accept
# body: {actor_user_id}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/accept", methods=["POST"])
def accept_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    if not actor_user_id:
        return bad_request("Missing actor_user_id")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] not in ("pending",):
            return bad_request("Only pending bookings can be accepted")

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status='accepted', accepted_at=NOW(), accepted_by=%s
             WHERE id=%s
        """, (actor_user_id, booking_id))
        write_history(cur2, booking_id, actor_user_id, "accept", "accepted")
        conn.commit()
        return jsonify(message="accepted"), 200

    except Error as e:
        print("accept_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/reject
# body: {actor_user_id, reason?}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/reject", methods=["POST"])
def reject_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    reason        = data.get("reason")
    if not actor_user_id:
        return bad_request("Missing actor_user_id")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] not in ("pending",):
            return bad_request("Only pending bookings can be rejected")

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status='rejected'
             WHERE id=%s
        """, (booking_id,))
        write_history(cur2, booking_id, actor_user_id, "reject", reason or "rejected")
        conn.commit()
        return jsonify(message="rejected"), 200

    except Error as e:
        print("reject_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/cancel
# body: {actor_user_id, reason?, actor_role: 'customer'|'chef'}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    actor_role    = (data.get("actor_role") or "").strip().lower()
    reason        = data.get("reason")

    if not actor_user_id or actor_role not in ("customer", "chef"):
        return bad_request("Provide actor_user_id and actor_role = 'customer'|'chef'")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] in ("rejected","cancelled_by_customer","cancelled_by_chef","completed"):
            return bad_request("Booking already finalized; cannot cancel")

        new_status = "cancelled_by_customer" if actor_role == "customer" else "cancelled_by_chef"

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status=%s, cancelled_at=NOW(), cancelled_by=%s, cancel_reason=%s
             WHERE id=%s
        """, (new_status, actor_user_id, reason, booking_id))
        action = "cancel_by_customer" if actor_role == "customer" else "cancel_by_chef"
        write_history(cur2, booking_id, actor_user_id, action, reason)
        conn.commit()
        return jsonify(message=new_status), 200

    except Error as e:
        print(" cancel_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# GET /api/bookings/search-chefs
# Query params: cuisine_type, gender, city, state, min_rating, max_distance, availability_date, sort_by
# -----------------------------
@bookings_bp.route("/search-chefs", methods=["GET"])
def search_chefs():
    """
    Advanced chef search with multiple filters
    Query Parameters:
    - cuisine_type: Filter by cuisine specialty (e.g., "Italian", "Chinese")  
    - gender: Filter by chef gender ("male", "female", "nonbinary", "prefer_not_say")
    - city: Filter by chef city
    - state: Filter by chef state  
    - min_rating: Minimum average rating (e.g., 4.0)
    - max_distance: Maximum distance from customer (requires customer_lat, customer_lon)
    - customer_lat, customer_lon: Customer location for distance calculation
    - availability_date: Check chef availability on specific date (YYYY-MM-DD)
    - availability_time: Check availability at specific time (HH:MM)
    - sort_by: Sort results by "rating", "distance", "name", "city" (default: "rating")
    - order: "asc" or "desc" (default: "desc" for rating, "asc" for others)
    - limit: Max number of results (default: 50, max: 100)
    """
    
    # Get filter parameters
    cuisine_type = request.args.get('cuisine_type')
    gender = request.args.get('gender') 
    city = request.args.get('city')
    state = request.args.get('state')
    min_rating = request.args.get('min_rating')
    max_distance = request.args.get('max_distance')
    customer_lat = request.args.get('customer_lat')
    customer_lon = request.args.get('customer_lon')
    availability_date = request.args.get('availability_date')
    availability_time = request.args.get('availability_time')
    sort_by = request.args.get('sort_by', 'rating')
    order = request.args.get('order', 'desc' if sort_by == 'rating' else 'asc')
    limit = min(int(request.args.get('limit', 50)), 100)
    
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        
        # Build dynamic query
        conditions = []
        params = []
        joins = []
        
        # Base query with chef info and ratings
        base_query = """
        SELECT DISTINCT
            c.id as chef_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            c.photo_url,
            c.bio,
            c.city,
            c.residency,
            c.gender,
            c.average_rating,
            c.total_reviews,
            c.facebook_link,
            c.instagram_link,
            c.twitter_link,
            GROUP_CONCAT(DISTINCT ct.name) as cuisines,
            COUNT(DISTINCT cr.id) as review_count
        FROM chefs c
        """
        
        # Join cuisine types if filtering by cuisine
        if cuisine_type:
            joins.append("JOIN chef_cuisines cc ON c.id = cc.chef_id")
            joins.append("JOIN cuisine_types ct ON cc.cuisine_id = ct.id")
            conditions.append("ct.name LIKE %s")
            params.append(f"%{cuisine_type}%")
        else:
            joins.append("LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id")
            joins.append("LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id")
            
        # Join reviews for review count
        joins.append("LEFT JOIN chef_reviews cr ON c.id = cr.chef_id")
        
        # Apply filters
        if gender:
            conditions.append("c.gender = %s")
            params.append(gender.lower())
            
        if city:
            conditions.append("c.city LIKE %s")
            params.append(f"%{city}%")
            
        if state:
            conditions.append("c.residency LIKE %s")
            params.append(f"%{state}%")
            
        if min_rating:
            conditions.append("c.average_rating >= %s")
            params.append(float(min_rating))
        
        # Check availability if date/time provided
        if availability_date:
            availability_conditions = ["b.status IN ('pending', 'accepted')"]
            availability_params = []
            
            if availability_time:
                # Check for conflicts at specific date/time
                start_datetime = f"{availability_date} {availability_time}:00"
                end_datetime = f"{availability_date} {availability_time.split(':')[0]}:{str(int(availability_time.split(':')[1]) + 60).zfill(2)}:00"
                availability_conditions.extend([
                    "b.start_time < %s",
                    "b.end_time > %s"
                ])
                availability_params.extend([end_datetime, start_datetime])
            else:
                # Check for any bookings on the date
                availability_conditions.append("DATE(b.start_time) = %s")
                availability_params.append(availability_date)
            
            # Exclude chefs who have conflicting bookings
            subquery = f"""
            c.id NOT IN (
                SELECT DISTINCT b.chef_id 
                FROM bookings b 
                WHERE {' AND '.join(availability_conditions)}
            )
            """
            conditions.append(subquery)
            params.extend(availability_params)
        
        # Build WHERE clause
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # Build ORDER BY clause
        order_direction = "ASC" if order.lower() == "asc" else "DESC"
        if sort_by == "rating":
            order_clause = f"ORDER BY c.average_rating {order_direction}, c.total_reviews DESC"
        elif sort_by == "distance":
            # Distance sorting requires coordinates
            if customer_lat and customer_lon:
                order_clause = f"ORDER BY distance {order_direction}"
            else:
                order_clause = "ORDER BY c.average_rating DESC"
        elif sort_by == "name":
            order_clause = f"ORDER BY c.first_name {order_direction}, c.last_name {order_direction}"
        elif sort_by == "city":
            order_clause = f"ORDER BY c.city {order_direction}, c.first_name ASC"
        else:
            order_clause = "ORDER BY c.average_rating DESC"
        
        # Combine query parts
        full_query = f"""
        {base_query}
        {' '.join(joins)}
        {where_clause}
        GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, 
                 c.photo_url, c.bio, c.city, c.residency, c.gender,
                 c.average_rating, c.total_reviews, c.facebook_link,
                 c.instagram_link, c.twitter_link
        {order_clause}
        LIMIT %s
        """
        
        params.append(limit)
        
        cur.execute(full_query, params)
        chefs = cur.fetchall()
        
        # Calculate distances if coordinates provided
        if customer_lat and customer_lon and chefs:
            import math
            
            def calculate_distance(lat1, lon1, lat2, lon2):
                """Calculate distance using Haversine formula (in miles)"""
                R = 3959  # Earth's radius in miles
                lat1_rad = math.radians(float(lat1))
                lon1_rad = math.radians(float(lon1))
                lat2_rad = math.radians(float(lat2))
                lon2_rad = math.radians(float(lon2))
                
                dlat = lat2_rad - lat1_rad
                dlon = lon2_rad - lon1_rad
                
                a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                return R * c
            
            # Add distance to each chef (simplified - in production you'd have chef coordinates in DB)
            for chef in chefs:
                # For demo purposes, assign random coordinates based on city
                # In production, you'd store actual chef coordinates
                chef_lat, chef_lon = get_city_coordinates(chef.get('city', 'Unknown'))
                distance = calculate_distance(
                    float(customer_lat), float(customer_lon),
                    chef_lat, chef_lon
                )
                chef['distance_miles'] = round(distance, 1)
                
            # Filter by max_distance if specified
            if max_distance:
                chefs = [chef for chef in chefs if chef.get('distance_miles', 0) <= float(max_distance)]
                
            # Re-sort by distance if requested
            if sort_by == "distance" and customer_lat and customer_lon:
                chefs.sort(key=lambda x: x.get('distance_miles', 999), 
                          reverse=(order.lower() == "desc"))
        
        # Format response
        for chef in chefs:
            chef['cuisines'] = chef['cuisines'].split(',') if chef['cuisines'] else []
            chef['average_rating'] = float(chef['average_rating'] or 0)
            
        return jsonify({
            'chefs': chefs,
            'total_found': len(chefs),
            'filters_applied': {
                'cuisine_type': cuisine_type,
                'gender': gender, 
                'city': city,
                'state': state,
                'min_rating': min_rating,
                'max_distance': max_distance,
                'availability_date': availability_date,
                'availability_time': availability_time
            },
            'sort_by': sort_by,
            'order': order
        }), 200
        
    except Error as e:
        print("search_chefs error:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

def get_city_coordinates(city):
    """Get approximate coordinates for a city (simplified version)"""
    # In production, you'd use a geocoding service or database
    city_coords = {
        'chicago': (41.8781, -87.6298),
        'new york': (40.7128, -74.0060),
        'los angeles': (34.0522, -118.2437),
        'san francisco': (37.7749, -122.4194),
        'miami': (25.7617, -80.1918),
        'seattle': (47.6062, -122.3321),
        'boston': (42.3601, -71.0589),
        'austin': (30.2672, -97.7431),
        'denver': (39.7392, -104.9903),
        'atlanta': (33.7490, -84.3880)
    }
    
    city_lower = city.lower() if city else 'chicago'
    return city_coords.get(city_lower, (41.8781, -87.6298))  # Default to Chicago

# -----------------------------
# GET /api/bookings/filter-options 
# Returns available filter options for the search
# -----------------------------
@bookings_bp.route("/filter-options", methods=["GET"])
def get_filter_options():
    """Get available filter options for chef search"""
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        
        # Get cuisine types
        cur.execute("SELECT DISTINCT name FROM cuisine_types ORDER BY name")
        cuisine_types = [row['name'] for row in cur.fetchall()]
        
        # Get available cities
        cur.execute("SELECT DISTINCT city FROM chefs WHERE city IS NOT NULL ORDER BY city")
        cities = [row['city'] for row in cur.fetchall()]
        
        # Get available states
        cur.execute("SELECT DISTINCT residency FROM chefs WHERE residency IS NOT NULL ORDER BY residency")  
        states = [row['residency'] for row in cur.fetchall()]
        
        # Get gender options (from enum)
        genders = ['male', 'female', 'nonbinary', 'prefer_not_say']
        
        # Get rating ranges
        cur.execute("SELECT MIN(average_rating) as min_rating, MAX(average_rating) as max_rating FROM chefs WHERE average_rating > 0")
        rating_range = cur.fetchone()
        
        return jsonify({
            'cuisine_types': cuisine_types,
            'cities': cities,
            'states': states, 
            'genders': genders,
            'rating_range': {
                'min': float(rating_range['min_rating'] or 0),
                'max': float(rating_range['max_rating'] or 5)
            },
            'sort_options': [
                {'value': 'rating', 'label': 'Rating'},
                {'value': 'distance', 'label': 'Distance'}, 
                {'value': 'name', 'label': 'Name'},
                {'value': 'city', 'label': 'City'}
            ]
        }), 200
        
    except Error as e:
        print("get_filter_options error:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# Legacy booking endpoints for backwards compatibility
# -----------------------------

# POST /api/bookings/create - Legacy booking creation
@bookings_bp.route("/create", methods=["POST"])
def create_legacy_booking():
    """Legacy booking creation for existing frontend"""
    data = request.get_json(silent=True) or {}
    
    required = ["customer_id", "cuisine_type", "booking_date", "booking_time", "number_of_people"]
    missing = [k for k in required if k not in data]
    if missing:
        return bad_request(f"Missing field(s): {', '.join(missing)}")
    
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        
        # Convert date/time format
        booking_datetime = f"{data['booking_date']} {data['booking_time']}:00"
        
        # Insert booking record
        cur2 = conn.cursor()
        cur2.execute("""
            INSERT INTO bookings (customer_id, chef_id, start_time, end_time, status, notes)
            VALUES (%s, %s, %s, %s, 'pending', %s)
        """, (
            data['customer_id'],
            1,  # Temporary chef_id, will be updated when chef is selected
            booking_datetime,
            booking_datetime,  # Same time for now
            data.get('special_notes', '')
        ))
        
        booking_id = cur2.lastrowid
        conn.commit()
        
        return jsonify({"booking_id": booking_id, "status": "created"}), 201
        
    except Error as e:
        print("create_legacy_booking error:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# POST /api/bookings/book-chef - Legacy chef booking
@bookings_bp.route("/book-chef", methods=["POST"])
def book_legacy_chef():
    """Legacy chef booking for existing frontend"""
    data = request.get_json(silent=True) or {}
    
    booking_id = data.get('booking_id')
    chef_id = data.get('chef_id')
    
    if not booking_id or not chef_id:
        return bad_request("Missing booking_id or chef_id")
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        # Update booking with selected chef
        cur.execute("""
            UPDATE bookings 
            SET chef_id = %s, status = 'pending'
            WHERE id = %s
        """, (chef_id, booking_id))
        
        conn.commit()
        
        return jsonify({"message": "Chef booked successfully", "status": "pending"}), 200
        
    except Error as e:
        print("book_legacy_chef error:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# Handle OPTIONS requests for CORS
@bookings_bp.route("/create", methods=["OPTIONS"])
@bookings_bp.route("/book-chef", methods=["OPTIONS"])
def handle_options():
    """Handle preflight OPTIONS requests"""
    return '', 200
