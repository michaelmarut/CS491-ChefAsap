import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from auth import auth
from blueprint.booking import bookings_bp
from blueprint.chat import chat_bp
from database.config import db_config
import mysql.connector

# Simple test to check if all imports work
def test_flask_setup():
    try:
        app = Flask(__name__)
        app.register_blueprint(auth, url_prefix='/auth')
        app.register_blueprint(bookings_bp)
        app.register_blueprint(chat_bp)
        
        print("✅ Flask app setup successful!")
        print("✅ All blueprints registered:")
        print("  - /auth/* (authentication routes)")
        print("  - /api/bookings/* (NEW booking system)")
        print("  - /api/chat/* (chat routes)")
        
        # Test database connection
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        print("✅ Database connection working!")
        
        return True
        
    except Exception as e:
        print(f"❌ Flask setup failed: {e}")
        return False

if __name__ == "__main__":
    test_flask_setup()