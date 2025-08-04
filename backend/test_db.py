#!/usr/bin/env python3
import mysql.connector
from database.config import db_config

def test_database():
    """Test database connection and check for booking data"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("=== DATABASE CONNECTION TEST ===")
        print("✅ Connected to database successfully!")
        
        # Check if tables exist
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {list(table.values())[0]}")
        
        # Check for chefs
        cursor.execute("SELECT COUNT(*) as count FROM chefs")
        chef_count = cursor.fetchone()['count']
        print(f"\n👨‍🍳 Number of chefs: {chef_count}")
        
        if chef_count > 0:
            cursor.execute("SELECT id, first_name, last_name, email FROM chefs LIMIT 5")
            chefs = cursor.fetchall()
            print("Sample chefs:")
            for chef in chefs:
                print(f"  - ID: {chef['id']}, Name: {chef['first_name']} {chef['last_name']}, Email: {chef['email']}")
        
        # Check for customers
        cursor.execute("SELECT COUNT(*) as count FROM customers")
        customer_count = cursor.fetchone()['count']
        print(f"\n👤 Number of customers: {customer_count}")
        
        # Check for bookings
        cursor.execute("SELECT COUNT(*) as count FROM bookings")
        booking_count = cursor.fetchone()['count']
        print(f"\n📅 Number of bookings: {booking_count}")
        
        if booking_count > 0:
            cursor.execute("""
                SELECT b.id, b.chef_id, b.customer_id, b.cuisine_type, b.status, b.created_at,
                       c.first_name as chef_name, cu.first_name as customer_name
                FROM bookings b
                LEFT JOIN chefs c ON b.chef_id = c.id
                LEFT JOIN customers cu ON b.customer_id = cu.id
                ORDER BY b.created_at DESC
                LIMIT 5
            """)
            bookings = cursor.fetchall()
            print("Recent bookings:")
            for booking in bookings:
                print(f"  - ID: {booking['id']}, Chef: {booking['chef_name']} (ID: {booking['chef_id']}), Customer: {booking['customer_name']}, Cuisine: {booking['cuisine_type']}, Status: {booking['status']}")
        else:
            print("⚠️  No bookings found in database!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    test_database()
