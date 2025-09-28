#!/usr/bin/env python3
"""
Create Sample Bookings for Testing the My Bookings Page
This will create realistic booking scenarios between customers and chefs
"""

import mysql.connector
from database.config import db_config
from datetime import datetime, timedelta
import random

def create_sample_bookings():
    """Create sample bookings for testing"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("🎪 CREATING SAMPLE BOOKINGS FOR TESTING")
        print("="*50)
        
        # Get some customer and chef IDs
        cursor.execute("SELECT id FROM customers WHERE email LIKE 'user%@example.com' LIMIT 10")
        customers = [row['id'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT id FROM chefs WHERE email LIKE 'chef%@example.com' LIMIT 10") 
        chefs = [row['id'] for row in cursor.fetchall()]
        
        if not customers or not chefs:
            print("❌ No sample customers or chefs found. Run generate_sample_users.py first.")
            return
        
        print(f"📋 Found {len(customers)} customers and {len(chefs)} chefs")
        
        # Clear existing sample bookings for first 5 customers and chefs
        if len(customers) >= 5 and len(chefs) >= 5:
            customer_ids = customers[:5]
            chef_ids = chefs[:5]
            
            cursor.execute("DELETE FROM bookings WHERE customer_id IN (%s,%s,%s,%s,%s) OR chef_id IN (%s,%s,%s,%s,%s)", 
                         (*customer_ids, *chef_ids))
            print(f"🗑️  Cleared existing test bookings")
        
        booking_scenarios = [
            # Recent bookings with different statuses
            {
                'customer_id': customers[0], 'chef_id': chefs[0],
                'start_time': datetime.now() + timedelta(days=2, hours=18),
                'end_time': datetime.now() + timedelta(days=2, hours=21),
                'status': 'pending',
                'notes': 'Birthday dinner for 4 people. Please prepare Italian cuisine with vegetarian options.'
            },
            {
                'customer_id': customers[1], 'chef_id': chefs[1],
                'start_time': datetime.now() + timedelta(days=5, hours=19),
                'end_time': datetime.now() + timedelta(days=5, hours=22),
                'status': 'accepted',
                'notes': 'Anniversary celebration. Looking for romantic French cuisine setup.'
            },
            {
                'customer_id': customers[2], 'chef_id': chefs[0],
                'start_time': datetime.now() + timedelta(days=1, hours=12),
                'end_time': datetime.now() + timedelta(days=1, hours=15),
                'status': 'pending',
                'notes': 'Lunch meeting with business partners. Need professional presentation.'
            },
            {
                'customer_id': customers[0], 'chef_id': chefs[2],
                'start_time': datetime.now() - timedelta(days=3, hours=-17),
                'end_time': datetime.now() - timedelta(days=3, hours=-20),
                'status': 'completed',
                'notes': 'Family gathering. Thank you for the amazing Mexican food!'
            },
            {
                'customer_id': customers[3], 'chef_id': chefs[1],
                'start_time': datetime.now() + timedelta(days=7, hours=18),
                'end_time': datetime.now() + timedelta(days=7, hours=21),
                'status': 'rejected',
                'notes': 'Corporate event catering for 20 people.'
            },
            {
                'customer_id': customers[1], 'chef_id': chefs[3],
                'start_time': datetime.now() + timedelta(days=3, hours=11),
                'end_time': datetime.now() + timedelta(days=3, hours=14),
                'status': 'cancelled_by_customer',
                'notes': 'Weekend brunch party. Had to cancel due to venue issues.'
            },
            {
                'customer_id': customers[4], 'chef_id': chefs[0],
                'start_time': datetime.now() + timedelta(days=10, hours=19),
                'end_time': datetime.now() + timedelta(days=10, hours=22),
                'status': 'pending',
                'notes': 'Engagement party! Looking for creative fusion cuisine.'
            },
            {
                'customer_id': customers[2], 'chef_id': chefs[4],
                'start_time': datetime.now() + timedelta(days=4, hours=17),
                'end_time': datetime.now() + timedelta(days=4, hours=20),
                'status': 'accepted',
                'notes': 'Cooking class for family. Interested in learning Thai recipes.'
            },
            {
                'customer_id': customers[0], 'chef_id': chefs[1],
                'start_time': datetime.now() - timedelta(days=1, hours=-18),
                'end_time': datetime.now() - timedelta(days=1, hours=-21),
                'status': 'completed',
                'notes': 'Outstanding service! The Japanese cuisine was perfect.'
            },
            {
                'customer_id': customers[3], 'chef_id': chefs[2],
                'start_time': datetime.now() + timedelta(days=6, hours=16),
                'end_time': datetime.now() + timedelta(days=6, hours=19),
                'status': 'cancelled_by_chef',
                'notes': 'Holiday dinner preparation. Unfortunately had a conflict.'
            }
        ]
        
        created_bookings = 0
        for scenario in booking_scenarios:
            cursor.execute("""
                INSERT INTO bookings (customer_id, chef_id, start_time, end_time, status, notes)
                VALUES (%(customer_id)s, %(chef_id)s, %(start_time)s, %(end_time)s, %(status)s, %(notes)s)
            """, scenario)
            created_bookings += 1
        
        conn.commit()
        
        print(f"✅ Created {created_bookings} sample bookings!")
        
        # Show summary
        print(f"\n📊 BOOKING SUMMARY:")
        customer_ids = customers[:5]
        chef_ids = chefs[:5]
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM bookings 
            WHERE customer_id IN (%s,%s,%s,%s,%s) OR chef_id IN (%s,%s,%s,%s,%s)
            GROUP BY status
        """, (*customer_ids, *chef_ids))
        
        status_counts = cursor.fetchall()
        for status_info in status_counts:
            print(f"   {status_info['status']}: {status_info['count']} bookings")
        
        # Show test scenarios
        print(f"\n🧪 TEST SCENARIOS:")
        print(f"Customer ID 1 ({customers[0]}): Has multiple bookings in different states")
        print(f"Chef ID 1 ({chefs[0]}): Has pending requests to accept/reject")
        print(f"Customer ID 2 ({customers[1]}): Has accepted and cancelled bookings")
        print(f"Chef ID 2 ({chefs[1]}): Has completed and rejected bookings")
        
        print(f"\n🎯 READY FOR TESTING:")
        print(f"1. Open My Bookings page")
        print(f"2. Switch between Customer and Chef views")
        print(f"3. Test with User IDs 1-5")
        print(f"4. Try accepting/rejecting/cancelling bookings")
        
    except Exception as e:
        print(f"❌ Error creating sample bookings: {e}")
        if conn:
            conn.rollback()
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_sample_bookings()