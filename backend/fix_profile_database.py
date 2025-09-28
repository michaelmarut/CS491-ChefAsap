#!/usr/bin/env python3
"""
Script to fix missing database tables for profile API
Run this to create the missing tables that cause profile API errors
"""

import mysql.connector
from database.config import db_config

def create_missing_tables():
    """Create missing profile-related tables"""
    try:
        print("🔧 Connecting to database...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Read and execute SQL script
        print("📄 Reading SQL script...")
        with open('fix_profile_tables.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Split by statements (simple approach - split on semicolon + newline)
        statements = [stmt.strip() for stmt in sql_script.split(';\n') if stmt.strip()]
        
        print(f"🚀 Executing {len(statements)} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                try:
                    print(f"  [{i}/{len(statements)}] Executing: {statement[:60]}{'...' if len(statement) > 60 else ''}")
                    cursor.execute(statement)
                    conn.commit()
                except mysql.connector.Error as e:
                    if "already exists" in str(e) or "Duplicate" in str(e):
                        print(f"    ⚠️  {e} (This is expected)")
                    else:
                        print(f"    ❌ Error: {e}")
                        raise
        
        print("✅ Database schema updated successfully!")
        print("🎯 Profile API should now work without errors")
        
        # Verify tables exist
        print("\n📋 Verifying created tables...")
        tables_to_check = [
            'customer_addresses', 'payment_methods', 'chef_addresses', 
            'chef_payment_methods', 'chef_cuisines', 'cuisine_types',
            'chef_availability_days'
        ]
        
        for table in tables_to_check:
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if cursor.fetchone():
                print(f"  ✅ {table}")
            else:
                print(f"  ❌ {table} - MISSING!")
        
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
            print("🔐 Database connection closed")
        except Exception:
            pass
    
    return True

if __name__ == '__main__':
    print("=" * 50)
    print("🔧 FIXING PROFILE API DATABASE SCHEMA")
    print("=" * 50)
    
    success = create_missing_tables()
    
    if success:
        print("\n🎉 SUCCESS! Try accessing the profile page again.")
        print("🧑‍🍳 Go to Chef Dashboard → Profile and it should work now!")
    else:
        print("\n❌ FAILED! Please check the error messages above.")
    
    print("=" * 50)