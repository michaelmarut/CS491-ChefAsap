from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database.config import db_config
from database.init_db import init_db
from auth import auth
from blueprint.booking import bookings_bp
from blueprint.chat import chat_bp
from blueprint.profiles import profiles_bp
from blueprint.availability import availability_bp
import mysql.connector
import socket

app = Flask(__name__)


def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

app.after_request(add_cors_headers)


bcrypt = Bcrypt(app)


app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(bookings_bp)  # New booking system with /api/bookings routes
app.register_blueprint(chat_bp)
app.register_blueprint(profiles_bp)  # Profile management endpoints
app.register_blueprint(availability_bp)  # Chef availability management

@app.route('/')
def index():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        return 'Flask and MySQL connection successful!'
    except Exception as e:
        return f'Error: {str(e)}'

# Legacy booking routes for frontend compatibility
@app.route('/booking/create', methods=['POST', 'OPTIONS'])
def legacy_create_booking():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json(silent=True) or {}
    
    required = ["customer_id", "cuisine_type", "booking_date", "booking_time", "number_of_people"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify(error=f"Missing field(s): {', '.join(missing)}"), 400
    
    try:
        from datetime import datetime, timedelta
        
        conn = mysql.connector.connect(**db_config)
        cur = conn.cursor()
        
        # Convert date/time format and add duration (default 2 hours)
        start_datetime_str = f"{data['booking_date']} {data['booking_time']}:00"
        start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%d %H:%M:%S")
        
        # Add 2 hours to meet the constraint end_time > start_time
        end_datetime = start_datetime + timedelta(hours=2)
        
        # Insert booking record
        cur.execute("""
            INSERT INTO bookings (customer_id, chef_id, start_time, end_time, status, notes)
            VALUES (%s, %s, %s, %s, 'pending', %s)
        """, (
            data['customer_id'],
            1,  # Temporary chef_id, will be updated when chef is selected
            start_datetime,
            end_datetime,  # Now properly 2 hours after start_time
            data.get('special_notes', '')
        ))
        
        booking_id = cur.lastrowid
        conn.commit()
        
        return jsonify({"booking_id": booking_id, "status": "created"}), 201
        
    except mysql.connector.Error as e:
        print("create_legacy_booking error:", e)
        return jsonify(error="Internal server error"), 500
    except Exception as e:
        print("create_legacy_booking general error:", e)
        return jsonify(error="Invalid date/time format"), 400
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

@app.route('/booking/book-chef', methods=['POST', 'OPTIONS'])
def legacy_book_chef():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json(silent=True) or {}
    
    booking_id = data.get('booking_id')
    chef_id = data.get('chef_id')
    
    if not booking_id or not chef_id:
        return jsonify(error="Missing booking_id or chef_id"), 400
    
    try:
        conn = mysql.connector.connect(**db_config)
        cur = conn.cursor()
        
        # Update booking with selected chef
        cur.execute("""
            UPDATE bookings 
            SET chef_id = %s, status = 'pending'
            WHERE id = %s
        """, (chef_id, booking_id))
        
        conn.commit()
        
        return jsonify({"message": "Chef booked successfully", "status": "pending"}), 200
        
    except mysql.connector.Error as e:
        print("book_legacy_chef error:", e)
        return jsonify(error="Internal server error"), 500
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

if __name__ == '__main__':
    init_db() 
    

    hostname = socket.gethostname()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()

    print(f'Server starting on {local_ip}:3000')
    app.run(debug=True, host='0.0.0.0', port=3000, threaded=True)
