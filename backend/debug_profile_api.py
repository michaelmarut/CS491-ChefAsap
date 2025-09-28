#!/usr/bin/env python3
"""
Debug script to check what's causing the profile API error
This will help us identify the exact issue
"""

import mysql.connector
from database.config import db_config

def debug_profile_issue():
    """Debug the profile API issue step by step"""
    try:
        print("🔍 DEBUGGING PROFILE API ISSUE")
        print("=" * 50)
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Check if chefs table has any data
        print("📋 Checking chefs table...")
        cursor.execute("SELECT COUNT(*) as count FROM chefs")
        chef_count = cursor.fetchone()['count']
        print(f"  Total chefs in database: {chef_count}")
        
        if chef_count > 0:
            cursor.execute("SELECT id, first_name, last_name, email FROM chefs LIMIT 5")
            chefs = cursor.fetchall()
            print("  Sample chefs:")
            for chef in chefs:
                print(f"    Chef ID {chef['id']}: {chef['first_name']} {chef['last_name']} ({chef['email']})")
        
        # 2. Check if users table exists and has matching records
        print("\n📋 Checking users table...")
        try:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE user_type = 'chef'")
            user_count = cursor.fetchone()['count']
            print(f"  Total chef users: {user_count}")
            
            if user_count > 0:
                cursor.execute("SELECT id, email FROM users WHERE user_type = 'chef' LIMIT 5")
                users = cursor.fetchall()
                print("  Sample chef users:")
                for user in users:
                    print(f"    User ID {user['id']}: {user['email']}")
        except Exception as e:
            print(f"  ⚠️ Users table issue: {e}")
        
        # 3. Check all the tables we created
        print("\n📋 Verifying profile-related tables...")
        tables_to_check = [
            'customer_addresses', 'payment_methods', 'chef_addresses', 
            'chef_payment_methods', 'chef_cuisines', 'cuisine_types',
            'chef_availability_days'
        ]
        
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                count = cursor.fetchone()['count']
                print(f"  ✅ {table}: {count} records")
            except Exception as e:
                print(f"  ❌ {table}: ERROR - {e}")
        
        # 4. Test the exact query that's failing
        print("\n🧪 Testing profile API query...")
        test_chef_id = 70  # The ID from your logs
        
        try:
            # This is the exact query from profiles.py
            cursor.execute("""
                SELECT c.*, u.email, u.created_at as user_created_at
                FROM chefs c
                JOIN users u ON c.email = u.email
                WHERE c.id = %s
            """, (test_chef_id,))
            
            chef = cursor.fetchone()
            if chef:
                print(f"  ✅ Found chef {test_chef_id}: {chef['first_name']} {chef['last_name']}")
            else:
                print(f"  ❌ Chef {test_chef_id} not found!")
                
                # Check if chef exists in chefs table
                cursor.execute("SELECT * FROM chefs WHERE id = %s", (test_chef_id,))
                chef_only = cursor.fetchone()
                if chef_only:
                    print(f"    Chef {test_chef_id} exists in chefs table")
                    print(f"    Chef email: {chef_only['email']}")
                    
                    # Check if user exists with that email
                    cursor.execute("SELECT * FROM users WHERE email = %s", (chef_only['email'],))
                    user = cursor.fetchone()
                    if user:
                        print(f"    User exists with email {chef_only['email']}")
                        print(f"    User type: {user.get('user_type', 'NOT SET')}")
                    else:
                        print(f"    ❌ No user found with email {chef_only['email']}")
                else:
                    print(f"    ❌ Chef {test_chef_id} does not exist in chefs table")
        
        except Exception as e:
            print(f"  ❌ Query failed: {e}")
            print(f"    This is likely the cause of the Internal server error!")
        
        # 5. Check what chef IDs actually exist
        print(f"\n📋 Available chef IDs...")
        cursor.execute("SELECT id FROM chefs ORDER BY id LIMIT 10")
        available_ids = [row['id'] for row in cursor.fetchall()]
        print(f"  Available chef IDs: {available_ids}")
        
        print("\n" + "=" * 50)
        print("🔍 DEBUGGING COMPLETE")
        
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"🚨 Unexpected error: {e}")
        return False
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

if __name__ == '__main__':
    debug_profile_issue()