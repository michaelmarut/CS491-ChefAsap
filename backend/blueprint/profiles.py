from flask import Blueprint, jsonify, request
import mysql.connector
from database.config import db_config

profiles_bp = Blueprint('profiles', __name__)

@profiles_bp.route('/api/profile/customer/<int:customer_id>', methods=['GET', 'OPTIONS'])
def get_customer_profile(customer_id):
    """Get customer profile information"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get customer basic info
        cursor.execute("""
            SELECT c.*, u.email, u.created_at as user_created_at
            FROM customers c
            JOIN users u ON c.email = u.email
            WHERE c.id = %s
        """, (customer_id,))
        
        customer = cursor.fetchone()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        
        # Get customer addresses
        cursor.execute("""
            SELECT * FROM customer_addresses 
            WHERE customer_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (customer_id,))
        
        addresses = cursor.fetchall()
        customer['addresses'] = addresses
        
        # Get payment methods (without sensitive data)
        cursor.execute("""
            SELECT id, payment_type, is_default, created_at
            FROM payment_methods 
            WHERE customer_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (customer_id,))
        
        payment_methods = cursor.fetchall()
        customer['payment_methods'] = payment_methods
        
        return jsonify(customer), 200
        
    except mysql.connector.Error as e:
        print("Database error:", e)
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print("General error:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@profiles_bp.route('/api/profile/chef/<int:chef_id>', methods=['GET', 'OPTIONS'])
def get_chef_profile(chef_id):
    """Get chef profile information"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
    
    print(f"🧑‍🍳 get_chef_profile called with chef_id: {chef_id}")
    print(f"📡 Request method: {request.method}")
    print(f"📋 Request headers: {dict(request.headers)}")
        
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get chef basic info
        cursor.execute("""
            SELECT c.*, u.email, u.created_at as user_created_at
            FROM chefs c
            JOIN users u ON c.email = u.email
            WHERE c.id = %s
        """, (chef_id,))
        
        chef = cursor.fetchone()
        if not chef:
            return jsonify({"error": "Chef not found"}), 404
        
        # Get chef cuisines
        cursor.execute("""
            SELECT ct.id, ct.name
            FROM chef_cuisines cc
            JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE cc.chef_id = %s
        """, (chef_id,))
        
        cuisines = cursor.fetchall()
        chef['cuisines'] = cuisines
        
        # Get chef addresses
        cursor.execute("""
            SELECT * FROM chef_addresses 
            WHERE chef_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (chef_id,))
        
        addresses = cursor.fetchall()
        chef['addresses'] = addresses
        
        # Get chef availability
        cursor.execute("""
            SELECT * FROM chef_availability_days 
            WHERE chef_id = %s 
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        """, (chef_id,))
        
        availability = cursor.fetchall()
        
        # Convert time objects to strings for JSON serialization
        for slot in availability:
            if slot.get('start_time'):
                if hasattr(slot['start_time'], 'total_seconds'):  # timedelta object
                    total_seconds = int(slot['start_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    slot['start_time'] = f"{hours:02d}:{minutes:02d}"
                elif hasattr(slot['start_time'], 'strftime'):  # time object
                    slot['start_time'] = slot['start_time'].strftime('%H:%M')
            
            if slot.get('end_time'):
                if hasattr(slot['end_time'], 'total_seconds'):  # timedelta object
                    total_seconds = int(slot['end_time'].total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    slot['end_time'] = f"{hours:02d}:{minutes:02d}"
                elif hasattr(slot['end_time'], 'strftime'):  # time object
                    slot['end_time'] = slot['end_time'].strftime('%H:%M')
        
        chef['availability'] = availability
        
        # Get payment methods (without sensitive data)
        cursor.execute("""
            SELECT id, payment_type, is_default, created_at
            FROM chef_payment_methods 
            WHERE chef_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (chef_id,))
        
        payment_methods = cursor.fetchall()
        chef['payment_methods'] = payment_methods
        
        # Ensure all data is JSON serializable
        def make_json_safe(obj):
            if obj is None:
                return None
            elif hasattr(obj, 'isoformat'):  # datetime objects
                return obj.isoformat()
            elif hasattr(obj, 'total_seconds'):  # timedelta objects
                total_seconds = int(obj.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return f"{hours:02d}:{minutes:02d}"
            elif isinstance(obj, dict):
                return {k: make_json_safe(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_safe(item) for item in obj]
            else:
                return obj
        
        safe_chef = make_json_safe(chef)
        
        print(f"✅ Chef profile loaded successfully for chef {chef_id}")
        return jsonify(safe_chef), 200
        
    except mysql.connector.Error as e:
        print(f"❌ Database error in get_chef_profile: {e}")
        print(f"   Error code: {e.errno}")
        print(f"   SQL state: {e.sqlstate}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"❌ General error in get_chef_profile: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@profiles_bp.route('/api/profile/customer/<int:customer_id>', methods=['PUT', 'OPTIONS'])
def update_customer_profile(customer_id):
    """Update customer profile information"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Update customer basic info
        update_fields = []
        update_values = []
        
        allowed_fields = ['first_name', 'last_name', 'phone', 'photo_url', 'allergy_notes', 
                         'dietary_preferences', 'preferred_cuisine_types', 'facebook_link', 
                         'instagram_link', 'twitter_link']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                update_values.append(data[field])
        
        if update_fields:
            update_values.append(customer_id)
            cursor.execute(f"""
                UPDATE customers 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, update_values)
            
            conn.commit()
        
        return jsonify({"message": "Profile updated successfully"}), 200
        
    except mysql.connector.Error as e:
        print("Database error:", e)
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print("General error:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@profiles_bp.route('/api/profile/chef/<int:chef_id>', methods=['PUT', 'OPTIONS'])
def update_chef_profile(chef_id):
    """Update chef profile information"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Update chef basic info
        update_fields = []
        update_values = []
        
        allowed_fields = ['first_name', 'last_name', 'phone', 'photo_url', 'bio', 'city', 
                         'residency', 'gender', 'hourly_rate', 'facebook_link', 
                         'instagram_link', 'twitter_link']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                update_values.append(data[field])
        
        if update_fields:
            update_values.append(chef_id)
            cursor.execute(f"""
                UPDATE chefs 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, update_values)
            
            conn.commit()
        
        return jsonify({"message": "Profile updated successfully"}), 200
        
    except mysql.connector.Error as e:
        print("Database error:", e)
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print("General error:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass