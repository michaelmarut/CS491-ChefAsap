import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.config import db_config
import mysql.connector
from mysql.connector import Error

def test_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("✅ Database connection successful!")
        
        # Test basic table existence
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"✅ Found {len(tables)} tables in database")
        
        # Check specific tables needed by chat.py
        required_tables = ['users', 'chefs', 'customers', 'bookings', 'conversations', 'chat_messages']
        cursor.execute("SHOW TABLES")
        existing_tables = [table[0] for table in cursor.fetchall()]
        
        for table in required_tables:
            if table in existing_tables:
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' is missing")
        
        cursor.close()
        conn.close()
        
    except Error as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    test_connection()