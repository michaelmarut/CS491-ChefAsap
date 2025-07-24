import mysql.connector
from database.config import db_config
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def add_sample_data():
    """Add sample data for testing the booking system"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Add cuisine types
        cuisines = [
            'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
            'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek'
        ]
        
        for cuisine in cuisines:
            cursor.execute('''
                INSERT IGNORE INTO cuisine_types (name) VALUES (%s)
            ''', (cuisine,))

        # Add sample users (chefs)
        sample_users = [
            ('chef1@example.com', 'password123', 'chef'),
            ('chef2@example.com', 'password123', 'chef'),
            ('chef3@example.com', 'password123', 'chef'),
            ('customer1@example.com', 'password123', 'customer'),
        ]

        for email, password, user_type in sample_users:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            cursor.execute('''
                INSERT IGNORE INTO users (email, password, user_type) VALUES (%s, %s, %s)
            ''', (email, hashed_password, user_type))

        # Add sample chefs
        sample_chefs = [
            ('Mario', 'Rossi', 'chef1@example.com', '555-0101'),
            ('Li', 'Chen', 'chef2@example.com', '555-0102'),
            ('Carlos', 'Rodriguez', 'chef3@example.com', '555-0103'),
        ]

        for first_name, last_name, email, phone in sample_chefs:
            cursor.execute('''
                INSERT IGNORE INTO chefs (first_name, last_name, email, phone) VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))

        # Add sample customer
        cursor.execute('''
            INSERT IGNORE INTO customers (first_name, last_name, email, phone) 
            VALUES (%s, %s, %s, %s)
        ''', ('John', 'Doe', 'customer1@example.com', '555-0201'))

        # Get chef IDs and cuisine IDs for relationships
        cursor.execute('SELECT id, email FROM chefs')
        chefs = {email: chef_id for chef_id, email in cursor.fetchall()}

        cursor.execute('SELECT id, name FROM cuisine_types')
        cuisine_ids = {name: cuisine_id for cuisine_id, name in cursor.fetchall()}

        # Add chef cuisines
        chef_cuisine_mappings = [
            ('chef1@example.com', ['Italian', 'Mediterranean']),
            ('chef2@example.com', ['Chinese', 'Japanese', 'Korean']),
            ('chef3@example.com', ['Mexican', 'American']),
        ]

        for chef_email, chef_cuisines in chef_cuisine_mappings:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                for cuisine_name in chef_cuisines:
                    if cuisine_name in cuisine_ids:
                        cursor.execute('''
                            INSERT IGNORE INTO chef_cuisines (chef_id, cuisine_id) VALUES (%s, %s)
                        ''', (chef_id, cuisine_ids[cuisine_name]))

        # Add chef service areas
        chef_areas = [
            ('chef1@example.com', 'Chicago', 'IL', '60601', 15),
            ('chef2@example.com', 'New York', 'NY', '10001', 20),
            ('chef3@example.com', 'Los Angeles', 'CA', '90210', 25),
        ]

        for chef_email, city, state, zip_code, radius in chef_areas:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                cursor.execute('''
                    INSERT IGNORE INTO chef_service_areas (chef_id, city, state, zip_code, service_radius_miles) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, city, state, zip_code, radius))

        # Add chef pricing
        chef_pricing = [
            ('chef1@example.com', 75.00, 25.00, 2, 20),  # Italian chef
            ('chef2@example.com', 65.00, 30.00, 1, 15),  # Asian chef
            ('chef3@example.com', 55.00, 20.00, 3, 25),  # Mexican/American chef
        ]

        for chef_email, base_rate, produce_cost, min_people, max_people in chef_pricing:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                cursor.execute('''
                    INSERT IGNORE INTO chef_pricing (chef_id, base_rate_per_person, produce_supply_extra_cost, minimum_people, maximum_people) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, base_rate, produce_cost, min_people, max_people))

        # Add customer address
        cursor.execute('SELECT id FROM customers WHERE email = %s', ('customer1@example.com',))
        customer_result = cursor.fetchone()
        if customer_result:
            customer_id = customer_result[0]
            cursor.execute('''
                INSERT IGNORE INTO customer_addresses (customer_id, address_line1, city, state, zip_code, is_default) 
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (customer_id, '123 Main St', 'Chicago', 'IL', '60601', True))

        conn.commit()
        print("Sample data added successfully!")
        print("\nSample Chefs:")
        print("1. Mario Rossi (Italian, Mediterranean) - Chicago, IL")
        print("2. Li Chen (Chinese, Japanese, Korean) - New York, NY") 
        print("3. Carlos Rodriguez (Mexican, American) - Los Angeles, CA")
        print("\nSample Customer: John Doe - Chicago, IL")
        print("\nYou can now test the booking system!")

    except Exception as e:
        print(f"Error adding sample data: {e}")
        if conn:
            conn.rollback()

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    add_sample_data()
