#!/usr/bin/env python3
"""
Enhanced debug script to catch the exact error in profile API
This will run the same code as the profile API to see what fails
"""

import mysql.connector
from database.config import db_config

def test_exact_profile_query():
    """Run the exact same code as get_chef_profile to find the error"""
    
    chef_id = 70
    print("🔍 TESTING EXACT PROFILE API CODE")
    print("=" * 50)
    print(f"Testing chef ID: {chef_id}")
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("✅ Database connection successful")
        
        # Step 1: Get chef basic info (this worked in our previous test)
        print("\n📋 Step 1: Getting chef basic info...")
        cursor.execute("""
            SELECT c.*, u.email, u.created_at as user_created_at
            FROM chefs c
            JOIN users u ON c.email = u.email
            WHERE c.id = %s
        """, (chef_id,))
        
        chef = cursor.fetchone()
        if not chef:
            print(f"❌ Chef {chef_id} not found!")
            return
        
        print(f"✅ Found chef: {chef['first_name']} {chef['last_name']}")
        
        # Step 2: Get chef cuisines
        print("\n📋 Step 2: Getting chef cuisines...")
        cursor.execute("""
            SELECT ct.id, ct.name
            FROM chef_cuisines cc
            JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE cc.chef_id = %s
        """, (chef_id,))
        
        cuisines = cursor.fetchall()
        print(f"✅ Found {len(cuisines)} cuisines")
        chef['cuisines'] = cuisines
        
        # Step 3: Get chef addresses  
        print("\n📋 Step 3: Getting chef addresses...")
        cursor.execute("""
            SELECT * FROM chef_addresses 
            WHERE chef_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (chef_id,))
        
        addresses = cursor.fetchall()
        print(f"✅ Found {len(addresses)} addresses")
        chef['addresses'] = addresses
        
        # Step 4: Get chef availability
        print("\n📋 Step 4: Getting chef availability...")
        cursor.execute("""
            SELECT * FROM chef_availability_days 
            WHERE chef_id = %s 
            ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        """, (chef_id,))
        
        availability = cursor.fetchall()
        print(f"✅ Found {len(availability)} availability slots")
        chef['availability'] = availability
        
        # Step 5: Get payment methods
        print("\n📋 Step 5: Getting chef payment methods...")
        cursor.execute("""
            SELECT id, payment_type, is_default, created_at
            FROM chef_payment_methods 
            WHERE chef_id = %s 
            ORDER BY is_default DESC, created_at ASC
        """, (chef_id,))
        
        payment_methods = cursor.fetchall()
        print(f"✅ Found {len(payment_methods)} payment methods")
        chef['payment_methods'] = payment_methods
        
        print(f"\n✅ ALL QUERIES SUCCESSFUL!")
        print(f"📋 Final chef object keys: {list(chef.keys())}")
        
        # Try to convert to JSON (this might fail if there are data type issues)
        print(f"\n📋 Testing JSON serialization...")
        import json
        json_str = json.dumps(chef, default=str)  # default=str handles datetime objects
        print(f"✅ JSON serialization successful ({len(json_str)} characters)")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print(f"  Error code: {e.errno}")
        print(f"  SQL state: {e.sqlstate}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print(f"  Error type: {type(e).__name__}")
        import traceback
        print(f"  Traceback: {traceback.format_exc()}")
        return False
    finally:
        try:
            cursor.close()
            conn.close()
            print("🔐 Database connection closed")
        except Exception:
            pass

if __name__ == '__main__':
    test_exact_profile_query()