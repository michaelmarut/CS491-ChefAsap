#!/usr/bin/env python3
"""
Complete database setup script for ChefAsap
Run this after cloning the repository to set up all required tables and data
"""

import mysql.connector
from database.config import db_config
import sys

def setup_complete_database():
    """Set up the complete ChefAsap database from scratch"""
    
    print("🚀 CHEFASAP DATABASE SETUP")
    print("=" * 50)
    
    try:
        # Connect to MySQL server (without database)
        connection_config = db_config.copy()
        database_name = connection_config.pop('database')
        
        print("🔌 Connecting to MySQL server...")
        conn = mysql.connector.connect(**connection_config)
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        print(f"📋 Creating database '{database_name}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
        cursor.execute(f"USE {database_name}")
        
        print("✅ Database connected successfully!")
        
        # Create all tables
        create_tables(cursor, conn)
        
        # Add sample data
        add_sample_data(cursor, conn)
        
        print("\n🎉 DATABASE SETUP COMPLETE!")
        print("✅ All tables created")
        print("✅ Sample data inserted") 
        print("✅ Ready to run the application!")
        
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

def create_tables(cursor, conn):
    """Create all required tables"""
    
    print("\n📋 Creating database tables...")
    
    tables = [
        # Users table
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            user_type ENUM('customer', 'chef') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Customers table  
        """
        CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(20),
            photo_url VARCHAR(255),
            allergy_notes TEXT,
            dietary_preferences TEXT,
            preferred_cuisine_types TEXT,
            facebook_link VARCHAR(255),
            instagram_link VARCHAR(255),
            twitter_link VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """,
        
        # Chefs table
        """
        CREATE TABLE IF NOT EXISTS chefs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(20),
            photo_url VARCHAR(255),
            bio TEXT,
            average_rating DECIMAL(3,2) DEFAULT 0.00,
            total_reviews INT DEFAULT 0,
            city VARCHAR(100),
            residency VARCHAR(100),
            gender ENUM('male', 'female', 'other'),
            hourly_rate DECIMAL(10,2),
            facebook_link VARCHAR(255),
            instagram_link VARCHAR(255),
            twitter_link VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """,
        
        # Cuisine types
        """
        CREATE TABLE IF NOT EXISTS cuisine_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Chef cuisines (many-to-many)
        """
        CREATE TABLE IF NOT EXISTS chef_cuisines (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chef_id INT NOT NULL,
            cuisine_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
            FOREIGN KEY (cuisine_id) REFERENCES cuisine_types(id) ON DELETE CASCADE,
            UNIQUE KEY unique_chef_cuisine (chef_id, cuisine_id)
        )
        """,
        
        # Chef availability
        """
        CREATE TABLE IF NOT EXISTS chef_availability_days (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chef_id INT NOT NULL,
            day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
            UNIQUE KEY unique_chef_day (chef_id, day_of_week)
        )
        """,
        
        # Bookings table
        """
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            chef_id INT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
            CONSTRAINT check_end_time CHECK (end_time > start_time)
        )
        """,
        
        # Profile-related tables
        """
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )
        """,
        
        """
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            payment_type ENUM('credit_card', 'debit_card', 'paypal', 'cash') NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )
        """,
        
        """
        CREATE TABLE IF NOT EXISTS chef_payment_methods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chef_id INT NOT NULL,
            payment_type ENUM('bank_transfer', 'paypal', 'venmo', 'cash') NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
        )
        """
    ]
    
    for i, table_sql in enumerate(tables, 1):
        try:
            cursor.execute(table_sql)
            conn.commit()
            table_name = table_sql.split('TABLE IF NOT EXISTS ')[1].split(' (')[0].strip()
            print(f"  [{i}/{len(tables)}] ✅ {table_name}")
        except Exception as e:
            print(f"  [{i}/{len(tables)}] ❌ Error creating table: {e}")

def add_sample_data(cursor, conn):
    """Add sample data for testing"""
    
    print("\n📋 Adding sample data...")
    
    try:
        # Add cuisine types
        print("  🍳 Adding cuisine types...")
        cuisines = [
            'Italian', 'Chinese', 'Mexican', 'Indian', 'French',
            'Japanese', 'Thai', 'American', 'Mediterranean', 'Korean',
            'Spanish', 'Turkish', 'Lebanese', 'Vietnamese', 'Greek'
        ]
        
        for cuisine in cuisines:
            cursor.execute("INSERT IGNORE INTO cuisine_types (name) VALUES (%s)", (cuisine,))
        conn.commit()
        print(f"    ✅ Added {len(cuisines)} cuisine types")
        
        # Add sample users
        print("  👥 Adding sample users...")
        sample_users = [
            ('chef1@example.com', 'password123', 'chef'),
            ('chef2@example.com', 'password123', 'chef'),
            ('chef3@example.com', 'password123', 'chef'),
            ('customer1@example.com', 'password123', 'customer'),
            ('customer2@example.com', 'password123', 'customer'),
        ]
        
        for email, password, user_type in sample_users:
            cursor.execute("""
                INSERT IGNORE INTO users (email, password, user_type)
                VALUES (%s, %s, %s)
            """, (email, password, user_type))
        conn.commit()
        print(f"    ✅ Added {len(sample_users)} sample users")
        
        # Add sample chefs
        print("  🧑‍🍳 Adding sample chefs...")
        sample_chefs = [
            ('chef1@example.com', 'Mario', 'Rossi', '555-1001', 'Experienced Italian chef specializing in authentic pasta and pizza.', 4.5, 23, 'New York', 'NY', 'male', 45.00),
            ('chef2@example.com', 'Sophie', 'Chen', '555-1002', 'Chinese cuisine expert with 10 years experience in traditional cooking.', 4.8, 18, 'San Francisco', 'CA', 'female', 55.00),
            ('chef3@example.com', 'Carlos', 'Rodriguez', '555-1003', 'Authentic Mexican food specialist with family recipes.', 4.2, 31, 'Los Angeles', 'CA', 'male', 40.00),
        ]
        
        for chef_data in sample_chefs:
            cursor.execute("""
                INSERT IGNORE INTO chefs (email, first_name, last_name, phone, bio, average_rating, total_reviews, city, residency, gender, hourly_rate)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, chef_data)
        conn.commit()
        print(f"    ✅ Added {len(sample_chefs)} sample chefs")
        
        # Add sample customers
        print("  👤 Adding sample customers...")
        sample_customers = [
            ('customer1@example.com', 'John', 'Doe', '555-2001'),
            ('customer2@example.com', 'Jane', 'Smith', '555-2002'),
        ]
        
        for email, first_name, last_name, phone in sample_customers:
            cursor.execute("""
                INSERT IGNORE INTO customers (email, first_name, last_name, phone)
                VALUES (%s, %s, %s, %s)
            """, (email, first_name, last_name, phone))
        conn.commit()
        print(f"    ✅ Added {len(sample_customers)} sample customers")
        
        # Link chefs with cuisines
        print("  🔗 Linking chefs with cuisines...")
        chef_cuisine_links = [
            (1, 1),  # Mario -> Italian
            (2, 2),  # Sophie -> Chinese  
            (3, 3),  # Carlos -> Mexican
        ]
        
        for chef_id, cuisine_id in chef_cuisine_links:
            cursor.execute("""
                INSERT IGNORE INTO chef_cuisines (chef_id, cuisine_id)
                VALUES (%s, %s)
            """, (chef_id, cuisine_id))
        conn.commit()
        print(f"    ✅ Linked chefs with their cuisines")
        
        print("  ✅ Sample data setup complete!")
        
    except Exception as e:
        print(f"  ❌ Error adding sample data: {e}")

if __name__ == '__main__':
    print("🚨 IMPORTANT: Make sure MySQL server is running!")
    print("🚨 Update database/config.py with your MySQL credentials!")
    
    response = input("\n⚠️  Continue with database setup? (y/n): ")
    if response.lower() != 'y':
        print("❌ Setup cancelled.")
        sys.exit(1)
    
    success = setup_complete_database()
    
    if success:
        print("\n" + "=" * 50)
        print("🎉 SUCCESS! Database setup complete!")
        print("\n📋 Next Steps:")
        print("1. Start backend: cd backend && python app.py")
        print("2. Start frontend: cd frontend && npm start")
        print("\n🧪 Test Accounts:")
        print("📧 Chef: chef1@example.com | Password: password123")
        print("📧 Customer: customer1@example.com | Password: password123")
        print("\n🚀 Your ChefAsap app is ready to use!")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        print("💡 Make sure MySQL is running and credentials are correct.")
        sys.exit(1)