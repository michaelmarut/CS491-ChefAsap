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

        # Add sample users (chefs and customers)
        sample_users = []
        
        # Add 50 chefs (chef1@gmail.com to chef50@gmail.com)
        for i in range(1, 51):
            sample_users.append((f'chef{i}@gmail.com', 'QWEasd123!', 'chef'))
        
        # Add 50 customers (customer101@gmail.com to customer150@gmail.com) 
        for i in range(101, 151):
            sample_users.append((f'customer{i}@gmail.com', 'QWEasd123!', 'customer'))

        for email, password, user_type in sample_users:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            cursor.execute('''
                INSERT IGNORE INTO users (email, password, user_type) VALUES (%s, %s, %s)
            ''', (email, hashed_password, user_type))

        # Add sample chefs (50 chefs)
        sample_chefs = []
        
        # Generate 50 chefs with varied names
        first_names = ['Mario', 'Li', 'Carlos', 'Sarah', 'Ahmed', 'Julia', 'David', 'Maria', 'Jean', 'Raj', 
                      'Anna', 'Marco', 'Sofia', 'Hassan', 'Elena', 'James', 'Lucia', 'Omar', 'Grace', 'Luis',
                      'Emma', 'Ali', 'Rosa', 'Pierre', 'Yuki', 'Sam', 'Nina', 'Paolo', 'Aisha', 'Chen',
                      'Isabella', 'Diego', 'Fatima', 'Andre', 'Mei', 'Antonio', 'Zara', 'Jean-Luc', 'Priya', 'Miguel',
                      'Chloe', 'Karim', 'Valentina', 'François', 'Akiko', 'Roberto', 'Layla', 'Giuseppe', 'Amara', 'Hiroshi']
        
        last_names = ['Rossi', 'Chen', 'Rodriguez', 'Johnson', 'Al-Rashid', 'Dubois', 'Smith', 'Garcia', 'Leblanc', 'Patel',
                     'Martinez', 'Wang', 'Brown', 'Hassan', 'Romano', 'Wilson', 'Lopez', 'Ahmed', 'Taylor', 'Gonzalez',
                     'Anderson', 'Ali', 'Ferrari', 'Moreau', 'Tanaka', 'Davis', 'Silva', 'Bianchi', 'Khan', 'Liu',
                     'Miller', 'Santos', 'Khalil', 'Martin', 'Yamamoto', 'Conti', 'Omar', 'Bernard', 'Singh', 'Herrera',
                     'Thomas', 'Ibrahim', 'Rosso', 'Petit', 'Sato', 'Russo', 'Mansour', 'Greco', 'Said', 'Suzuki']
        
        for i in range(50):
            first_name = first_names[i]
            last_name = last_names[i]
            email = f'chef{i+1}@gmail.com'
            phone = f'555-{1000+i:04d}'
            sample_chefs.append((first_name, last_name, email, phone))

        for first_name, last_name, email, phone in sample_chefs:
            cursor.execute('''
                INSERT IGNORE INTO chefs (first_name, last_name, email, phone) VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))

        # Add sample customers (50 customers)
        sample_customers = []
        
        customer_first_names = ['John', 'Jane', 'Michael', 'Emily', 'Robert', 'Lisa', 'William', 'Sarah', 'David', 'Jessica',
                               'Richard', 'Ashley', 'Joseph', 'Amanda', 'Thomas', 'Melissa', 'Charles', 'Deborah', 'Christopher', 'Dorothy',
                               'Daniel', 'Amy', 'Matthew', 'Angela', 'Anthony', 'Helen', 'Mark', 'Brenda', 'Donald', 'Emma',
                               'Steven', 'Olivia', 'Paul', 'Cynthia', 'Andrew', 'Marie', 'Joshua', 'Janet', 'Kenneth', 'Catherine',
                               'Kevin', 'Frances', 'Brian', 'Samantha', 'George', 'Debra', 'Timothy', 'Rachel', 'Ronald', 'Carolyn']
        
        customer_last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                              'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                              'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                              'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']
        
        for i in range(50):
            first_name = customer_first_names[i]
            last_name = customer_last_names[i] 
            email = f'customer{i+101}@gmail.com'
            phone = f'555-{2000+i:04d}'
            sample_customers.append((first_name, last_name, email, phone))

        for first_name, last_name, email, phone in sample_customers:
            cursor.execute('''
                INSERT IGNORE INTO customers (first_name, last_name, email, phone) 
                VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))

        # Get chef IDs and cuisine IDs for relationships
        cursor.execute('SELECT id, email FROM chefs')
        chefs = {email: chef_id for chef_id, email in cursor.fetchall()}

        cursor.execute('SELECT id, name FROM cuisine_types')
        cuisine_ids = {name: cuisine_id for cuisine_id, name in cursor.fetchall()}

        # Add chef cuisines (assign cuisines to all 50 chefs)
        cuisine_list = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
                       'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek']
        
        chef_cuisine_mappings = []
        
        # Assign cuisines to all 50 chefs (cycling through cuisines and adding 1-3 per chef)
        for i in range(1, 51):
            chef_email = f'chef{i}@gmail.com'
            # Each chef gets 1-3 cuisines based on their index
            num_cuisines = (i % 3) + 1  # 1, 2, or 3 cuisines
            chef_cuisines = []
            
            for j in range(num_cuisines):
                cuisine_index = (i + j) % len(cuisine_list)
                chef_cuisines.append(cuisine_list[cuisine_index])
            
            chef_cuisine_mappings.append((chef_email, chef_cuisines))

        for chef_email, chef_cuisines in chef_cuisine_mappings:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                for cuisine_name in chef_cuisines:
                    if cuisine_name in cuisine_ids:
                        cursor.execute('''
                            INSERT IGNORE INTO chef_cuisines (chef_id, cuisine_id) VALUES (%s, %s)
                        ''', (chef_id, cuisine_ids[cuisine_name]))

        # Add chef service areas (for all 50 chefs)
        cities_data = [
            ('Chicago', 'IL', '60601'), ('New York', 'NY', '10001'), ('Los Angeles', 'CA', '90210'),
            ('Houston', 'TX', '77001'), ('Phoenix', 'AZ', '85001'), ('Philadelphia', 'PA', '19101'),
            ('San Antonio', 'TX', '78201'), ('San Diego', 'CA', '92101'), ('Dallas', 'TX', '75201'),
            ('San Jose', 'CA', '95101'), ('Austin', 'TX', '78701'), ('Jacksonville', 'FL', '32099'),
            ('Fort Worth', 'TX', '76101'), ('Columbus', 'OH', '43085'), ('Charlotte', 'NC', '28201'),
            ('San Francisco', 'CA', '94101'), ('Indianapolis', 'IN', '46201'), ('Seattle', 'WA', '98101'),
            ('Denver', 'CO', '80201'), ('Washington', 'DC', '20001'), ('Boston', 'MA', '02101'),
            ('El Paso', 'TX', '79901'), ('Nashville', 'TN', '37201'), ('Detroit', 'MI', '48201'),
            ('Oklahoma City', 'OK', '73101'), ('Portland', 'OR', '97201'), ('Las Vegas', 'NV', '89101'),
            ('Memphis', 'TN', '38101'), ('Louisville', 'KY', '40201'), ('Baltimore', 'MD', '21201'),
            ('Milwaukee', 'WI', '53201'), ('Albuquerque', 'NM', '87101'), ('Tucson', 'AZ', '85701'),
            ('Fresno', 'CA', '93701'), ('Sacramento', 'CA', '95814'), ('Mesa', 'AZ', '85201'),
            ('Kansas City', 'MO', '64101'), ('Atlanta', 'GA', '30301'), ('Long Beach', 'CA', '90801'),
            ('Colorado Springs', 'CO', '80901'), ('Raleigh', 'NC', '27601'), ('Miami', 'FL', '33101'),
            ('Virginia Beach', 'VA', '23451'), ('Omaha', 'NE', '68101'), ('Oakland', 'CA', '94601'),
            ('Minneapolis', 'MN', '55401'), ('Tulsa', 'OK', '74101'), ('Arlington', 'TX', '76010'),
            ('New Orleans', 'LA', '70112'), ('Wichita', 'KS', '67201')
        ]
        
        chef_areas = []
        for i in range(50):
            chef_email = f'chef{i+1}@gmail.com'
            city, state, zip_code = cities_data[i % len(cities_data)]
            radius = 10 + (i % 20)  # Service radius between 10-29 miles
            chef_areas.append((chef_email, city, state, zip_code, radius))

        for chef_email, city, state, zip_code, radius in chef_areas:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                cursor.execute('''
                    INSERT IGNORE INTO chef_service_areas (chef_id, city, state, zip_code, service_radius_miles) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, city, state, zip_code, radius))

        # Add chef pricing (for all 50 chefs)
        chef_pricing = []
        
        for i in range(50):
            chef_email = f'chef{i+1}@gmail.com'
            # Vary pricing based on chef index
            base_rate = 45.00 + (i % 40) + (i * 0.5)  # Base rate between $45-85
            produce_cost = 15.00 + (i % 25)           # Produce cost between $15-40  
            min_people = 1 + (i % 4)                  # Min people between 1-4
            max_people = 10 + (i % 20)                # Max people between 10-29
            
            chef_pricing.append((chef_email, base_rate, produce_cost, min_people, max_people))

        for chef_email, base_rate, produce_cost, min_people, max_people in chef_pricing:
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                cursor.execute('''
                    INSERT IGNORE INTO chef_pricing (chef_id, base_rate_per_person, produce_supply_extra_cost, minimum_people, maximum_people) 
                    VALUES (%s, %s, %s, %s, %s)
                ''', (chef_id, base_rate, produce_cost, min_people, max_people))

        # Add customer addresses (for all 50 customers)
        cursor.execute('SELECT id, email FROM customers')
        customers = {email: customer_id for customer_id, email in cursor.fetchall()}
        
        street_names = ['Main St', 'Oak Ave', 'Pine St', 'Cedar Ln', 'Elm Dr', 'Maple Way', 'Park Blvd', 'First St',
                       'Second Ave', 'Third St', 'Fourth Dr', 'Fifth Way', 'Broadway', 'Center St', 'Church St',
                       'College Ave', 'Court St', 'Franklin St', 'Highland Ave', 'Hill St', 'Jackson St', 'Jefferson Ave',
                       'King St', 'Lincoln Ave', 'Madison St', 'Market St', 'Mill St', 'North St', 'Park Ave', 'Ridge Rd',
                       'River St', 'School St', 'South St', 'Spring St', 'State St', 'Union St', 'View Dr', 'Wall St',
                       'Washington Ave', 'Water St', 'West St', 'Wilson Ave', 'Wood St', 'York St', 'Adams St',
                       'Baker St', 'Clark Ave', 'Davis Dr', 'Evans St', 'Forest Ave']
        
        for i in range(101, 151):
            customer_email = f'customer{i}@gmail.com'
            if customer_email in customers:
                customer_id = customers[customer_email]
                street_num = 100 + (i % 900)
                street_name = street_names[(i-101) % len(street_names)]
                address = f'{street_num} {street_name}'
                
                # Use same cities as chefs, cycling through them
                city, state, zip_code = cities_data[(i-101) % len(cities_data)]
                
                cursor.execute('''
                    INSERT IGNORE INTO customer_addresses (customer_id, address_line1, city, state, zip_code, is_default) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (customer_id, address, city, state, zip_code, True))

        conn.commit()
        print("Sample data added successfully!")
        print("\n✅ Added 100 users total:")
        print("   • 50 chefs (chef1@gmail.com to chef50@gmail.com)")
        print("   • 50 customers (customer101@gmail.com to customer150@gmail.com)")
        print("   • All users have password: QWEasd123!")
        print("\n📍 Chefs are distributed across 50 major US cities")
        print("🍳 Each chef has 1-3 cuisine specialties")  
        print("💰 Pricing ranges from $45-85 per person")
        print("🏠 All customers have default addresses")
        print("\nYou can now test the booking system with 100 users!")

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
