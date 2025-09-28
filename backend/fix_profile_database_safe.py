#!/usr/bin/env python3
"""
Script to fix missing database tables for profile API - SAFE VERSION
Creates tables one by one with proper error handling
"""

import mysql.connector
from database.config import db_config

def create_missing_tables():
    """Create missing profile-related tables safely"""
    try:
        print("🔧 Connecting to database...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # 1. Create customer_addresses table
        print("📦 Creating customer_addresses table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS customer_addresses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_id INT NOT NULL,
                    address_line1 VARCHAR(255) NOT NULL,
                    address_line2 VARCHAR(255),
                    city VARCHAR(100) NOT NULL,
                    state VARCHAR(100),
                    postal_code VARCHAR(20),
                    country VARCHAR(100) DEFAULT 'USA',
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ customer_addresses created/verified")
        except Exception as e:
            print(f"  ⚠️ customer_addresses: {e}")

        # 2. Create payment_methods table
        print("📦 Creating payment_methods table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payment_methods (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_id INT NOT NULL,
                    payment_type ENUM('credit_card', 'debit_card', 'paypal', 'cash') NOT NULL,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ payment_methods created/verified")
        except Exception as e:
            print(f"  ⚠️ payment_methods: {e}")

        # 3. Create chef_addresses table
        print("📦 Creating chef_addresses table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chef_addresses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chef_id INT NOT NULL,
                    address_line1 VARCHAR(255) NOT NULL,
                    address_line2 VARCHAR(255),
                    city VARCHAR(100) NOT NULL,
                    state VARCHAR(100),
                    postal_code VARCHAR(20),
                    country VARCHAR(100) DEFAULT 'USA',
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ chef_addresses created/verified")
        except Exception as e:
            print(f"  ⚠️ chef_addresses: {e}")

        # 4. Create chef_payment_methods table
        print("📦 Creating chef_payment_methods table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chef_payment_methods (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chef_id INT NOT NULL,
                    payment_type ENUM('bank_transfer', 'paypal', 'venmo', 'cash') NOT NULL,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ chef_payment_methods created/verified")
        except Exception as e:
            print(f"  ⚠️ chef_payment_methods: {e}")

        # 5. Create cuisine_types table (simple version)
        print("📦 Creating cuisine_types table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cuisine_types (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ cuisine_types created/verified")
        except Exception as e:
            print(f"  ⚠️ cuisine_types: {e}")

        # 6. Create chef_cuisines table
        print("📦 Creating chef_cuisines table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chef_cuisines (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chef_id INT NOT NULL,
                    cuisine_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("  ✅ chef_cuisines created/verified")
        except Exception as e:
            print(f"  ⚠️ chef_cuisines: {e}")

        # 7. Insert sample cuisine types
        print("📦 Adding sample cuisine types...")
        cuisines = [
            'Italian', 'Chinese', 'Mexican', 'Indian', 'French',
            'Japanese', 'Thai', 'American', 'Mediterranean', 'Korean'
        ]
        
        for cuisine in cuisines:
            try:
                cursor.execute("INSERT IGNORE INTO cuisine_types (name) VALUES (%s)", (cuisine,))
            except Exception as e:
                print(f"  ⚠️ Failed to add {cuisine}: {e}")
        
        conn.commit()
        print("  ✅ Sample cuisines added")

        # 8. Add missing columns to chefs table
        print("📦 Adding missing columns to chefs table...")
        chef_columns = [
            ('bio', 'TEXT'),
            ('city', 'VARCHAR(100)'),
            ('residency', 'VARCHAR(100)'),
            ('gender', "ENUM('male', 'female', 'other')"),
            ('hourly_rate', 'DECIMAL(10,2)'),
            ('facebook_link', 'VARCHAR(255)'),
            ('instagram_link', 'VARCHAR(255)'),
            ('twitter_link', 'VARCHAR(255)')
        ]
        
        for col_name, col_type in chef_columns:
            try:
                cursor.execute(f"ALTER TABLE chefs ADD COLUMN {col_name} {col_type}")
                conn.commit()
                print(f"  ✅ Added {col_name} to chefs")
            except Exception as e:
                if "Duplicate column" in str(e):
                    print(f"  ✓ {col_name} already exists in chefs")
                else:
                    print(f"  ⚠️ Failed to add {col_name} to chefs: {e}")

        # 9. Add missing columns to customers table
        print("📦 Adding missing columns to customers table...")
        customer_columns = [
            ('allergy_notes', 'TEXT'),
            ('dietary_preferences', 'TEXT'),
            ('preferred_cuisine_types', 'TEXT'),
            ('facebook_link', 'VARCHAR(255)'),
            ('instagram_link', 'VARCHAR(255)'),
            ('twitter_link', 'VARCHAR(255)')
        ]
        
        for col_name, col_type in customer_columns:
            try:
                cursor.execute(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type}")
                conn.commit()
                print(f"  ✅ Added {col_name} to customers")
            except Exception as e:
                if "Duplicate column" in str(e):
                    print(f"  ✓ {col_name} already exists in customers")
                else:
                    print(f"  ⚠️ Failed to add {col_name} to customers: {e}")

        print("✅ Database schema updated successfully!")
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
            print("🔐 Database connection closed")
        except Exception:
            pass

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 FIXING PROFILE API DATABASE SCHEMA - SAFE VERSION")
    print("=" * 60)
    
    success = create_missing_tables()
    
    if success:
        print("\n🎉 SUCCESS! Database schema has been updated.")
        print("🧑‍🍳 Try accessing Chef Dashboard → Profile again!")
        print("👤 The profile API should now work without 'Internal server error'")
    else:
        print("\n❌ FAILED! Please check the error messages above.")
    
    print("=" * 60)