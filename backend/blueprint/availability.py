from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, timedelta
from database.config import db_config

availability_bp = Blueprint('availability', __name__)

@availability_bp.route('/api/availability/chef/<int:chef_id>', methods=['GET', 'OPTIONS'])
def get_chef_availability(chef_id):
    """Get chef's weekly availability schedule"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    print(f"📅 Getting availability for chef ID: {chef_id}")
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get chef's availability from database
        cursor.execute("""
            SELECT id, day_of_week, start_time, end_time 
            FROM chef_availability_days 
            WHERE chef_id = %s
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        """, (chef_id,))
        
        availability = cursor.fetchall()
        
        # Convert timedelta objects to string format for JSON serialization
        for slot in availability:
            if isinstance(slot['start_time'], timedelta):
                total_seconds = int(slot['start_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                slot['start_time'] = f"{hours:02d}:{minutes:02d}"
            
            if isinstance(slot['end_time'], timedelta):
                total_seconds = int(slot['end_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                slot['end_time'] = f"{hours:02d}:{minutes:02d}"
        
        print(f"✅ Found {len(availability)} availability slots for chef {chef_id}")
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'availability': availability
        })
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"🚨 Unexpected error: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@availability_bp.route('/api/availability/chef/<int:chef_id>', methods=['PUT', 'OPTIONS'])
def update_chef_availability(chef_id):
    """Update chef's weekly availability schedule"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    print(f"💾 Updating availability for chef ID: {chef_id}")
    
    try:
        data = request.get_json()
        availability_data = data.get('availability', [])
        
        print(f"📋 Received availability data: {availability_data}")
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # First, delete existing availability for this chef
        cursor.execute("DELETE FROM chef_availability_days WHERE chef_id = %s", (chef_id,))
        print(f"🗑️ Deleted existing availability for chef {chef_id}")
        
        # Insert new availability slots
        for slot in availability_data:
            day_of_week = slot['day_of_week']
            start_time = slot['start_time']
            end_time = slot['end_time']
            
            cursor.execute("""
                INSERT INTO chef_availability_days (chef_id, day_of_week, start_time, end_time)
                VALUES (%s, %s, %s, %s)
            """, (chef_id, day_of_week, start_time, end_time))
            
            print(f"✅ Added availability: {day_of_week} {start_time}-{end_time}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"💾 Successfully updated availability for chef {chef_id}")
        
        return jsonify({
            'success': True,
            'message': 'Availability updated successfully'
        })
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"🚨 Unexpected error: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@availability_bp.route('/api/availability/check', methods=['POST', 'OPTIONS'])
def check_chef_availability():
    """Check if a chef is available at a specific date and time"""
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200
        
    print("🔍 Checking chef availability...")
    
    try:
        data = request.get_json()
        chef_id = data.get('chef_id')
        date_str = data.get('date')
        time_str = data.get('time')
        
        print(f"📋 Checking availability for chef {chef_id} on {date_str} at {time_str}")
        
        if not all([chef_id, date_str, time_str]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Parse the date to get day of week
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        day_of_week = date_obj.strftime('%A').lower()
        
        # Parse the requested time
        requested_time = datetime.strptime(time_str, '%H:%M').time()
        
        print(f"🗓️ Day of week: {day_of_week}, Requested time: {requested_time}")
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Check if chef has availability for this day
        cursor.execute("""
            SELECT start_time, end_time 
            FROM chef_availability_days 
            WHERE chef_id = %s AND day_of_week = %s
        """, (chef_id, day_of_week))
        
        availability = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not availability:
            print(f"❌ Chef {chef_id} is not available on {day_of_week}")
            return jsonify({
                'available': False,
                'message': f'Chef is not available on {day_of_week.title()}'
            })
        
        # Convert timedelta to time objects for comparison
        if isinstance(availability['start_time'], timedelta):
            start_seconds = int(availability['start_time'].total_seconds())
            start_time = datetime.min.replace(
                hour=start_seconds // 3600,
                minute=(start_seconds % 3600) // 60
            ).time()
        else:
            start_time = availability['start_time']
        
        if isinstance(availability['end_time'], timedelta):
            end_seconds = int(availability['end_time'].total_seconds())
            end_time = datetime.min.replace(
                hour=end_seconds // 3600,
                minute=(end_seconds % 3600) // 60
            ).time()
        else:
            end_time = availability['end_time']
        
        # Check if requested time falls within availability window
        is_available = start_time <= requested_time <= end_time
        
        print(f"⏰ Availability window: {start_time} - {end_time}")
        print(f"✅ Available: {is_available}")
        
        return jsonify({
            'available': is_available,
            'availability_window': {
                'start_time': start_time.strftime('%H:%M'),
                'end_time': end_time.strftime('%H:%M')
            },
            'message': 'Available' if is_available else f'Not available at {time_str}. Available from {start_time.strftime("%H:%M")} to {end_time.strftime("%H:%M")}'
        })
        
    except ValueError as e:
        print(f"Invalid date/time format: {e}")
        return jsonify({'error': 'Invalid date or time format'}), 400
    except mysql.connector.Error as e:
        print(f" Database error: {e}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f" Unexpected error: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500







#abca
