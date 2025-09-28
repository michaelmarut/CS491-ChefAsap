#!/usr/bin/env python3
"""
Comprehensive Sample Data Generator for ChefAsap
Generates 100 chefs and 100 customers with complete information
"""

import mysql.connector
from database.config import db_config
from flask_bcrypt import Bcrypt
import random
from datetime import datetime, timedelta

bcrypt = Bcrypt()

def generate_comprehensive_sample_data():
    """Generate 100 chefs and 100 customers with complete information"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Common password for all users
        password = "QWEasd123!"
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        print("🚀 Starting comprehensive sample data generation...")
        print(f"📝 Password for all users: {password}")
        
        # First, ensure cuisine types exist
        cuisines = [
            'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
            'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek',
            'Spanish', 'Turkish', 'Lebanese', 'Moroccan', 'Ethiopian', 'Brazilian', 'Peruvian'
        ]
        
        print("🍽️  Adding cuisine types...")
        for cuisine in cuisines:
            cursor.execute('INSERT IGNORE INTO cuisine_types (name) VALUES (%s)', (cuisine,))
        
        # Get cuisine IDs for later use
        cursor.execute('SELECT id, name FROM cuisine_types')
        cuisine_map = {name: id for id, name in cursor.fetchall()}
        
        # US Cities and States for realistic locations
        cities_states = [
            ('New York', 'NY'), ('Los Angeles', 'CA'), ('Chicago', 'IL'), ('Houston', 'TX'),
            ('Phoenix', 'AZ'), ('Philadelphia', 'PA'), ('San Antonio', 'TX'), ('San Diego', 'CA'),
            ('Dallas', 'TX'), ('San Jose', 'CA'), ('Austin', 'TX'), ('Jacksonville', 'FL'),
            ('Fort Worth', 'TX'), ('Columbus', 'OH'), ('Charlotte', 'NC'), ('San Francisco', 'CA'),
            ('Indianapolis', 'IN'), ('Seattle', 'WA'), ('Denver', 'CO'), ('Boston', 'MA'),
            ('El Paso', 'TX'), ('Nashville', 'TN'), ('Detroit', 'MI'), ('Oklahoma City', 'OK'),
            ('Portland', 'OR'), ('Las Vegas', 'NV'), ('Memphis', 'TN'), ('Louisville', 'KY'),
            ('Baltimore', 'MD'), ('Milwaukee', 'WI'), ('Albuquerque', 'NM'), ('Tucson', 'AZ'),
            ('Fresno', 'CA'), ('Sacramento', 'CA'), ('Kansas City', 'MO'), ('Long Beach', 'CA'),
            ('Mesa', 'AZ'), ('Atlanta', 'GA'), ('Colorado Springs', 'CO'), ('Virginia Beach', 'VA'),
            ('Raleigh', 'NC'), ('Omaha', 'NE'), ('Miami', 'FL'), ('Oakland', 'CA'),
            ('Minneapolis', 'MN'), ('Tulsa', 'OK'), ('Wichita', 'KS'), ('New Orleans', 'LA'),
            ('Arlington', 'TX'), ('Cleveland', 'OH')
        ]
        
        # Chef first names (diverse)
        chef_first_names = [
            'Alessandro', 'Maria', 'Ahmed', 'Priya', 'Hiroshi', 'Sophie', 'Carlos', 'Fatima',
            'Antonio', 'Lucia', 'Chen', 'Isabella', 'Mohammed', 'Anastasia', 'Luis', 'Amara',
            'Giovanni', 'Sakura', 'Omar', 'Elena', 'Raj', 'Camila', 'Dimitri', 'Aisha',
            'Francesco', 'Yuki', 'Hassan', 'Victoria', 'Diego', 'Natasha', 'Marco', 'Layla',
            'Vincenzo', 'Mei', 'Khalid', 'Gabriela', 'Pablo', 'Zara', 'Roberto', 'Aaliyah',
            'Mateo', 'Ling', 'Tariq', 'Valentina', 'Sergio', 'Noor', 'Rafael', 'Emilia',
            'Alejandro', 'Yara', 'Sami', 'Bianca', 'Andres', 'Jasmine', 'Ricardo', 'Maya',
            'Javier', 'Leila', 'Nicolas', 'Aria', 'Eduardo', 'Zoe', 'Fabio', 'Chloe',
            'Emilio', 'Luna', 'Bruno', 'Ivy', 'Leonardo', 'Rose', 'Matteo', 'Grace',
            'Lorenzo', 'Emma', 'Giuseppe', 'Mia', 'Stefano', 'Ava', 'Luca', 'Ella',
            'Cristiano', 'Lily', 'Massimo', 'Sophia', 'Riccardo', 'Olivia', 'Angelo', 'Harper',
            'Davide', 'Amelia', 'Salvatore', 'Evelyn', 'Claudio', 'Abigail', 'Filippo', 'Emily',
            'Tommaso', 'Charlotte', 'Simone', 'Sofia'
        ]
        
        # Chef last names (diverse)
        chef_last_names = [
            'Rossi', 'Ferrari', 'Chen', 'Wang', 'Rodriguez', 'Martinez', 'Anderson', 'Johnson',
            'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson',
            'Moore', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
            'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
            'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
            'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
            'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
            'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
            'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward',
            'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray',
            'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel',
            'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry',
            'Russell', 'Sullivan', 'Bell', 'Coleman'
        ]
        
        # Customer first names
        customer_first_names = [
            'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica',
            'Robert', 'Ashley', 'William', 'Amanda', 'Richard', 'Stephanie', 'Joseph', 'Jennifer',
            'Charles', 'Elizabeth', 'Christopher', 'Heather', 'Daniel', 'Nicole', 'Matthew', 'Amy',
            'Anthony', 'Michelle', 'Mark', 'Kimberly', 'Donald', 'Angela', 'Steven', 'Lisa',
            'Paul', 'Brenda', 'Andrew', 'Emma', 'Joshua', 'Olivia', 'Kenneth', 'Sophia',
            'Kevin', 'Ava', 'Brian', 'Isabella', 'George', 'Mia', 'Timothy', 'Abigail',
            'Ronald', 'Emily', 'Jason', 'Charlotte', 'Edward', 'Harper', 'Jeffrey', 'Madison',
            'Ryan', 'Amelia', 'Jacob', 'Evelyn', 'Gary', 'Ella', 'Nicholas', 'Chloe',
            'Eric', 'Grace', 'Jonathan', 'Victoria', 'Stephen', 'Aubrey', 'Larry', 'Scarlett',
            'Justin', 'Zoey', 'Scott', 'Addison', 'Brandon', 'Layla', 'Benjamin', 'Natalie',
            'Samuel', 'Lillian', 'Gregory', 'Hannah', 'Alexander', 'Aria', 'Patrick', 'Zoe',
            'Frank', 'Nora', 'Raymond', 'Leah', 'Jack', 'Audrey', 'Dennis', 'Savannah',
            'Jerry', 'Brooklyn', 'Tyler', 'Bella'
        ]
        
        # Generate 100 Chef Users
        print("👨‍🍳 Creating 100 chef users...")
        chef_user_ids = []
        for i in range(1, 101):
            email = f"chef{i}@example.com"
            cursor.execute('''
                INSERT IGNORE INTO users (email, password, user_type) 
                VALUES (%s, %s, 'chef')
            ''', (email, hashed_password))
            
            # Get the user ID
            cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
            result = cursor.fetchone()
            if result:
                chef_user_ids.append(result[0])
        
        # Generate 100 Customer Users
        print("👤 Creating 100 customer users...")
        customer_user_ids = []
        for i in range(1, 101):
            email = f"user{i}@example.com"
            cursor.execute('''
                INSERT IGNORE INTO users (email, password, user_type) 
                VALUES (%s, %s, 'customer')
            ''', (email, hashed_password))
            
            # Get the user ID
            cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
            result = cursor.fetchone()
            if result:
                customer_user_ids.append(result[0])
        
        # Generate 100 Chef Profiles
        print("🍴 Creating 100 chef profiles...")
        chef_ids = []
        for i in range(1, 101):
            first_name = random.choice(chef_first_names)
            last_name = random.choice(chef_last_names)
            email = f"chef{i}@example.com"
            phone = f"555-{1000 + i:04d}"
            city, state = random.choice(cities_states)
            gender = random.choice(['male', 'female', 'nonbinary', 'prefer_not_say'])
            hourly_rate = round(random.uniform(45.0, 120.0), 2)
            average_rating = round(random.uniform(3.5, 5.0), 2)
            total_reviews = random.randint(10, 150)
            
            # Create diverse bios
            specialties = random.sample(cuisines, random.randint(2, 4))
            bio = f"Professional chef specializing in {', '.join(specialties)}. Passionate about creating memorable culinary experiences with fresh, local ingredients."
            
            cursor.execute('''
                INSERT IGNORE INTO chefs (
                    first_name, last_name, email, phone, bio, city, residency, 
                    gender, hourly_rate, average_rating, total_reviews,
                    facebook_link, instagram_link, twitter_link
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                first_name, last_name, email, phone, bio, city, state,
                gender, hourly_rate, average_rating, total_reviews,
                f"https://facebook.com/chef{first_name.lower()}{last_name.lower()}",
                f"https://instagram.com/chef_{first_name.lower()}_{last_name.lower()}",
                f"https://twitter.com/chef{first_name.lower()}{i}"
            ))
            
            # Get chef ID
            cursor.execute('SELECT id FROM chefs WHERE email = %s', (email,))
            result = cursor.fetchone()
            if result:
                chef_id = result[0]
                chef_ids.append(chef_id)
                
                # Add chef cuisines (2-4 random cuisines per chef)
                chef_cuisines = random.sample(list(cuisine_map.keys()), random.randint(2, 4))
                for cuisine_name in chef_cuisines:
                    cursor.execute('''
                        INSERT IGNORE INTO chef_cuisines (chef_id, cuisine_id) 
                        VALUES (%s, %s)
                    ''', (chef_id, cuisine_map[cuisine_name]))
        
        # Generate 100 Customer Profiles
        print("🛒 Creating 100 customer profiles...")
        customer_ids = []
        for i in range(1, 101):
            first_name = random.choice(customer_first_names)
            last_name = random.choice(chef_last_names)  # Reuse last names
            email = f"user{i}@example.com"
            phone = f"555-{2000 + i:04d}"
            city, state = random.choice(cities_states)
            gender = random.choice(['male', 'female', 'nonbinary', 'prefer_not_say'])
            
            # Generate dietary preferences and allergies
            dietary_prefs = random.choice([
                'No restrictions', 'Vegetarian', 'Vegan', 'Gluten-free', 
                'Keto', 'Paleo', 'Low-sodium', 'Dairy-free'
            ])
            
            allergy_notes = random.choice([
                'None', 'Nuts', 'Shellfish', 'Dairy', 'Eggs', 
                'Soy', 'Wheat/Gluten', 'Fish'
            ])
            
            preferred_cuisines = ', '.join(random.sample(cuisines, random.randint(2, 5)))
            
            cursor.execute('''
                INSERT IGNORE INTO customers (
                    first_name, last_name, email, phone, city, residency,
                    gender, allergy_notes, dietary_preferences, preferred_cuisine_types,
                    facebook_link, instagram_link, twitter_link
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                first_name, last_name, email, phone, city, state,
                gender, allergy_notes, dietary_prefs, preferred_cuisines,
                f"https://facebook.com/{first_name.lower()}.{last_name.lower()}",
                f"https://instagram.com/{first_name.lower()}_{last_name.lower()}{i}",
                f"https://twitter.com/{first_name.lower()}{last_name.lower()}{i}"
            ))
            
            # Get customer ID
            cursor.execute('SELECT id FROM customers WHERE email = %s', (email,))
            result = cursor.fetchone()
            if result:
                customer_id = result[0]
                customer_ids.append(customer_id)
                
                # Add customer address
                street_num = random.randint(100, 9999)
                street_names = ['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Second Ave', 'Elm St', 'Maple Ave']
                address = f"{street_num} {random.choice(street_names)}"
                zip_code = f"{random.randint(10000, 99999)}"
                
                cursor.execute('''
                    INSERT IGNORE INTO customer_addresses (
                        customer_id, address_line1, city, state, zip_code, is_default
                    ) VALUES (%s, %s, %s, %s, %s, TRUE)
                ''', (customer_id, address, city, state, zip_code))
        
        # Generate some sample reviews
        print("⭐ Creating sample reviews...")
        for _ in range(200):  # 200 random reviews
            if chef_ids and customer_ids:
                chef_id = random.choice(chef_ids)
                customer_id = random.choice(customer_ids)
                rating = round(random.uniform(3.0, 5.0), 1)
                
                review_texts = [
                    "Amazing chef! The food was absolutely delicious and beautifully presented.",
                    "Professional service and incredible flavors. Highly recommend!",
                    "Outstanding culinary skills. Made our event truly special.",
                    "Creative dishes and excellent execution. Will book again!",
                    "Fresh ingredients, perfect seasoning. A true culinary artist.",
                    "Exceeded all expectations. The meal was restaurant-quality.",
                    "Friendly personality and amazing cooking skills. Perfect combination!",
                    "Innovative menu and flawless preparation. Absolutely loved it!",
                ]
                
                review_text = random.choice(review_texts)
                
                # Create a dummy booking first (simplified)
                start_time = datetime.now() - timedelta(days=random.randint(1, 180))
                end_time = start_time + timedelta(hours=2)
                
                cursor.execute('''
                    INSERT INTO bookings (customer_id, chef_id, start_time, end_time, status, notes)
                    VALUES (%s, %s, %s, %s, 'completed', 'Sample booking for review')
                ''', (customer_id, chef_id, start_time, end_time))
                
                booking_id = cursor.lastrowid
                
                cursor.execute('''
                    INSERT IGNORE INTO chef_reviews (chef_id, customer_id, booking_id, rating, review_text)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, customer_id, booking_id, rating, review_text))
        
        conn.commit()
        
        # Print summary information
        print("\n" + "="*60)
        print("🎉 SAMPLE DATA GENERATION COMPLETE!")
        print("="*60)
        print(f"✅ Created 100 chefs with emails: chef1@example.com to chef100@example.com")
        print(f"✅ Created 100 customers with emails: user1@example.com to user100@example.com")
        print(f"🔑 Password for ALL users: {password}")
        print(f"🏙️  Users distributed across {len(cities_states)} major US cities")
        print(f"🍽️  {len(cuisines)} cuisine types available")
        print(f"⭐ ~200 sample reviews created")
        print("\n📊 SAMPLE USER DETAILS:")
        print("-" * 40)
        
        # Show first 5 chefs as examples
        cursor.execute('''
            SELECT c.first_name, c.last_name, c.email, c.city, c.residency, 
                   c.hourly_rate, c.average_rating, GROUP_CONCAT(ct.name) as cuisines
            FROM chefs c
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE c.email LIKE 'chef%@example.com'
            GROUP BY c.id
            ORDER BY c.email
            LIMIT 5
        ''')
        
        chefs_sample = cursor.fetchall()
        print("\n👨‍🍳 SAMPLE CHEFS (first 5):")
        for chef in chefs_sample:
            print(f"  • {chef[0]} {chef[1]} ({chef[2]})")
            print(f"    📍 {chef[3]}, {chef[4]} | 💰 ${chef[5]}/hr | ⭐ {chef[6]}")
            print(f"    🍽️  Cuisines: {chef[7] or 'None assigned'}")
            print()
        
        # Show first 5 customers as examples
        cursor.execute('''
            SELECT first_name, last_name, email, city, residency, 
                   dietary_preferences, preferred_cuisine_types
            FROM customers
            WHERE email LIKE 'user%@example.com'
            ORDER BY email
            LIMIT 5
        ''')
        
        customers_sample = cursor.fetchall()
        print("👤 SAMPLE CUSTOMERS (first 5):")
        for customer in customers_sample:
            print(f"  • {customer[0]} {customer[1]} ({customer[2]})")
            print(f"    📍 {customer[3]}, {customer[4]}")
            print(f"    🥗 Diet: {customer[5]} | 🍽️  Prefers: {customer[6]}")
            print()
        
        print("🔍 HOW TO USE:")
        print("- Login as chef: chef1@example.com to chef100@example.com")
        print("- Login as customer: user1@example.com to user100@example.com")
        print(f"- Password for all: {password}")
        print("\n🎯 Ready for comprehensive testing!")
        
    except Exception as e:
        print(f"❌ Error generating sample data: {e}")
        if conn:
            conn.rollback()
        raise e
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    generate_comprehensive_sample_data()