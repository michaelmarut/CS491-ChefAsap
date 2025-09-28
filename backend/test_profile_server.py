#!/usr/bin/env python3
"""
Simple test to create a minimal profile endpoint to isolate the issue
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from database.config import db_config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/test/profile/chef/<int:chef_id>', methods=['GET', 'OPTIONS'])
def test_chef_profile(chef_id):
    """Simplified test version of chef profile"""
    if request.method == 'OPTIONS':
        return '', 200
    
    print(f"🧪 TEST: Getting profile for chef {chef_id}")
    
    try:
        # Simple version - just get basic chef info
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM chefs WHERE id = %s", (chef_id,))
        chef = cursor.fetchone()
        
        if not chef:
            return jsonify({"error": "Chef not found"}), 404
        
        # Convert any problematic data types
        result = {}
        for key, value in chef.items():
            if value is None:
                result[key] = None
            elif hasattr(value, 'isoformat'):  # datetime objects
                result[key] = value.isoformat()
            else:
                result[key] = str(value) if not isinstance(value, (int, float, bool, str)) else value
        
        cursor.close()
        conn.close()
        
        print(f"✅ TEST: Successfully returning chef profile")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ TEST: Error - {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🧪 Starting test profile server...")
    print("Test URL will be: http://192.168.1.181:5000/test/profile/chef/70")
    app.run(host='0.0.0.0', port=5000, debug=True)