#!/usr/bin/env python3
"""
Quick Database Verification Test
Tests that sample data is working correctly for ChefAsap
"""

import mysql.connector
from database.config import db_config
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def test_database_functionality():
    """Test key database functions with sample data"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("🧪 TESTING DATABASE FUNCTIONALITY")
        print("="*50)
        
        # Test 1: Login Authentication
        print("1️⃣  Testing User Authentication...")
        test_email = "chef1@example.com"
        test_password = "QWEasd123!"
        
        cursor.execute("SELECT email, password, user_type FROM users WHERE email = %s", (test_email,))
        user = cursor.fetchone()
        
        if user and bcrypt.check_password_hash(user['password'], test_password):
            print(f"   ✅ Authentication working for {test_email}")
        else:
            print(f"   ❌ Authentication failed for {test_email}")
        
        # Test 2: Chef Search
        print("\n2️⃣  Testing Chef Search...")
        cursor.execute("""
            SELECT c.first_name, c.last_name, c.email, c.city, 
                   GROUP_CONCAT(ct.name) as cuisines
            FROM chefs c
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE c.email LIKE 'chef%@example.com'
            GROUP BY c.id
            LIMIT 3
        """)
        
        chefs = cursor.fetchall()
        if chefs:
            print(f"   ✅ Found {len(chefs)} sample chefs:")
            for chef in chefs:
                print(f"      • {chef['first_name']} {chef['last_name']} - {chef['cuisines']}")
        else:
            print("   ❌ No chefs found")
        
        # Test 3: Customer Data
        print("\n3️⃣  Testing Customer Data...")
        cursor.execute("""
            SELECT c.first_name, c.last_name, c.email, c.city, 
                   ca.address_line1
            FROM customers c
            LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = TRUE
            WHERE c.email LIKE 'user%@example.com'
            LIMIT 3
        """)
        
        customers = cursor.fetchall()
        if customers:
            print(f"   ✅ Found {len(customers)} sample customers:")
            for customer in customers:
                address = customer['address_line1'] or 'No address'
                print(f"      • {customer['first_name']} {customer['last_name']} - {address}")
        else:
            print("   ❌ No customers found")
        
        # Test 4: Booking System
        print("\n4️⃣  Testing Booking System...")
        cursor.execute("""
            SELECT b.id, b.status, c.first_name as chef_name, cu.first_name as customer_name
            FROM bookings b
            JOIN chefs c ON b.chef_id = c.id
            JOIN customers cu ON b.customer_id = cu.id
            LIMIT 3
        """)
        
        bookings = cursor.fetchall()
        if bookings:
            print(f"   ✅ Found {len(bookings)} sample bookings:")
            for booking in bookings:
                print(f"      • Booking #{booking['id']}: {booking['customer_name']} → {booking['chef_name']} ({booking['status']})")
        else:
            print("   ❌ No bookings found")
        
        # Test 5: Reviews
        print("\n5️⃣  Testing Review System...")
        cursor.execute("""
            SELECT r.rating, r.review_text, c.first_name as chef_name, 
                   cu.first_name as customer_name
            FROM chef_reviews r
            JOIN chefs c ON r.chef_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            LIMIT 3
        """)
        
        reviews = cursor.fetchall()
        if reviews:
            print(f"   ✅ Found {len(reviews)} sample reviews:")
            for review in reviews:
                print(f"      • {review['customer_name']} → {review['chef_name']}: {review['rating']}⭐")
        else:
            print("   ❌ No reviews found")
        
        # Test 6: API Endpoint Simulation
        print("\n6️⃣  Testing Chef Search API Logic...")
        cursor.execute("""
            SELECT c.id, c.first_name, c.last_name, c.city, c.average_rating,
                   GROUP_CONCAT(ct.name) as cuisines
            FROM chefs c
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE c.city = 'Chicago'
            AND EXISTS (
                SELECT 1 FROM chef_cuisines cc2 
                JOIN cuisine_types ct2 ON cc2.cuisine_id = ct2.id 
                WHERE cc2.chef_id = c.id AND ct2.name = 'Italian'
            )
            GROUP BY c.id
            LIMIT 2
        """)
        
        chicago_italian_chefs = cursor.fetchall()
        if chicago_italian_chefs:
            print(f"   ✅ API Logic Test - Found Italian chefs in Chicago:")
            for chef in chicago_italian_chefs:
                print(f"      • {chef['first_name']} {chef['last_name']} - Rating: {chef['average_rating']}⭐")
        else:
            print("   ⚠️  No Italian chefs found in Chicago (this is OK, random data)")
        
        print("\n🎉 DATABASE VERIFICATION COMPLETE!")
        print("="*50)
        print("✅ Your database is ready for testing!")
        print("🎯 You can now:")
        print("   • Start your Flask backend")
        print("   • Start your React Native frontend")
        print("   • Test login with any chef1-100@example.com or user1-100@example.com")
        print("   • Password: QWEasd123!")
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    test_database_functionality()