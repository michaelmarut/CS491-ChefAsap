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
        
        # Add 100 chefs (chef1@gmail.com to chef100@gmail.com)
        for i in range(1, 101):
            sample_users.append((f'chef{i}@gmail.com', 'QWEasd123!', 'chef'))
        
        # Add 100 customers (customer1@gmail.com to customer100@gmail.com) 
        for i in range(1, 101):
            sample_users.append((f'customer{i}@gmail.com', 'QWEasd123!', 'customer'))
        
        # Add 10 new users in New York (nyuser1@gmail.com to nyuser10@gmail.com)
        for i in range(1, 11):
            sample_users.append((f'nyuser{i}@gmail.com', 'QWEasd123!', 'customer'))

        for email, password, user_type in sample_users:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            cursor.execute('''
                INSERT IGNORE INTO users (email, password, user_type) VALUES (%s, %s, %s)
            ''', (email, hashed_password, user_type))

        # Add sample chefs (100 chefs)
        sample_chefs = []
        
        # Generate 100 chefs with varied names from different cultures
        first_names = ['Mario', 'Li', 'Carlos', 'Sarah', 'Ahmed', 'Julia', 'David', 'Maria', 'Jean', 'Raj', 
                      'Anna', 'Marco', 'Sofia', 'Hassan', 'Elena', 'James', 'Lucia', 'Omar', 'Grace', 'Luis',
                      'Emma', 'Ali', 'Rosa', 'Pierre', 'Yuki', 'Sam', 'Nina', 'Paolo', 'Aisha', 'Chen',
                      'Isabella', 'Diego', 'Fatima', 'Andre', 'Mei', 'Antonio', 'Zara', 'Jean-Luc', 'Priya', 'Miguel',
                      'Chloe', 'Karim', 'Valentina', 'Francois', 'Akiko', 'Roberto', 'Layla', 'Giuseppe', 'Amara', 'Hiroshi',
                      'Isabella', 'Viktor', 'Natasha', 'Dmitri', 'Olga', 'Ivan', 'Katya', 'Alexei', 'Anya', 'Pavel',
                      'Ingrid', 'Hans', 'Greta', 'Klaus', 'Heidi', 'Wolfgang', 'Ursula', 'Franz', 'Brigitte', 'Karl',
                      'Bjorn', 'Astrid', 'Lars', 'Sigrid', 'Erik', 'Maja', 'Nils', 'Inga', 'Sven', 'Liv',
                      'Kofi', 'Amina', 'Kwame', 'Fatou', 'Jomo', 'Asha', 'Tariq', 'Zara', 'Idris', 'Halima',
                      'Hiroshi', 'Yuki', 'Kenji', 'Sakura', 'Takeshi', 'Hana', 'Akira', 'Mika', 'Ryu', 'Emi',
                      'Carmen', 'Pablo', 'Esperanza', 'Fernando', 'Dolores', 'Ramon', 'Pilar', 'Javier', 'Mercedes', 'Alejandro']
        
        last_names = ['Rossi', 'Chen', 'Rodriguez', 'Johnson', 'Al-Rashid', 'Dubois', 'Smith', 'Garcia', 'Leblanc', 'Patel',
                     'Martinez', 'Wang', 'Brown', 'Hassan', 'Romano', 'Wilson', 'Lopez', 'Ahmed', 'Taylor', 'Gonzalez',
                     'Anderson', 'Ali', 'Ferrari', 'Moreau', 'Tanaka', 'Davis', 'Silva', 'Bianchi', 'Khan', 'Liu',
                     'Miller', 'Santos', 'Khalil', 'Martin', 'Yamamoto', 'Conti', 'Omar', 'Bernard', 'Singh', 'Herrera',
                     'Thomas', 'Ibrahim', 'Rosso', 'Petit', 'Sato', 'Russo', 'Mansour', 'Greco', 'Said', 'Suzuki',
                     'Petrov', 'Ivanov', 'Sokolov', 'Popov', 'Kozlov', 'Volkov', 'Novak', 'Fedorov', 'Morozov', 'Orlov',
                     'Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
                     'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson',
                     'Okonkwo', 'Nkomo', 'Banda', 'Mwangi', 'Kiprotich', 'Achebe', 'Mandela', 'Sankara', 'Kone', 'Traore',
                     'Yamamoto', 'Watanabe', 'Ito', 'Kobayashi', 'Kato', 'Yoshida', 'Nakamura', 'Hayashi', 'Matsumoto', 'Inoue',
                     'Fernandez', 'Gutierrez', 'Vargas', 'Castillo', 'Mendoza', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ruiz']
        
        # Create descriptions for chefs based on their specialties
        chef_descriptions = [
            "Authentic Italian cuisine specialist with 15 years of experience in traditional pasta and pizza making.",
            "Master of Chinese cuisine, trained in Beijing. Specializes in Szechuan and Cantonese dishes.",
            "Mexican chef expert in regional cuisines from Oaxaca to Yucatan. Famous for handmade tortillas.",
            "Indian cuisine master with expertise in North and South Indian flavors. Award-winning curry specialist.",
            "Japanese chef trained in Tokyo. Sushi master and expert in traditional kaiseki dining.",
            "Thai cuisine specialist with authentic recipes passed down through generations.",
            "French chef trained at Le Cordon Bleu. Expert in classical French techniques and modern fusion.",
            "Mediterranean diet expert focusing on healthy, fresh ingredients and olive oil-based dishes.",
            "American BBQ pit master with 20 years of smoking and grilling experience.",
            "Caribbean cuisine specialist bringing island flavors with fresh seafood and tropical spices.",
        ] * 10  # Repeat descriptions for 100 chefs
        
        for i in range(100):
            first_name = first_names[i]
            last_name = last_names[i]
            email = f'chef{i+1}@gmail.com'
            phone = f'555-{1000+i:04d}'
            description = chef_descriptions[i]
            sample_chefs.append((first_name, last_name, email, phone, description))

        for first_name, last_name, email, phone, description in sample_chefs:
            cursor.execute('''
                INSERT IGNORE INTO chefs (first_name, last_name, email, phone, description) VALUES (%s, %s, %s, %s, %s)
            ''', (first_name, last_name, email, phone, description))

        # Add sample customers (100 customers)
        sample_customers = []
        
        customer_first_names = ['John', 'Jane', 'Michael', 'Emily', 'Robert', 'Lisa', 'William', 'Sarah', 'David', 'Jessica',
                               'Richard', 'Ashley', 'Joseph', 'Amanda', 'Thomas', 'Melissa', 'Charles', 'Deborah', 'Christopher', 'Dorothy',
                               'Daniel', 'Amy', 'Matthew', 'Angela', 'Anthony', 'Helen', 'Mark', 'Brenda', 'Donald', 'Emma',
                               'Steven', 'Olivia', 'Paul', 'Cynthia', 'Andrew', 'Marie', 'Joshua', 'Janet', 'Kenneth', 'Catherine',
                               'Kevin', 'Frances', 'Brian', 'Samantha', 'George', 'Debra', 'Timothy', 'Rachel', 'Ronald', 'Carolyn',
                               'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Margaret', 'Carol', 'Ruth', 'Sharon',
                               'Michelle', 'Laura', 'Emily', 'Kimberly', 'Donna', 'Margaret', 'Carol', 'Sandra', 'Ashley', 'Kimberly',
                               'Donna', 'Emily', 'Michelle', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen', 'Sandra',
                               'Virginia', 'Maria', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Jessica',
                               'Shirley', 'Cynthia', 'Angela', 'Melissa', 'Brenda', 'Emma', 'Olivia', 'Amy', 'Anna', 'Rebecca']
        
        customer_last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                              'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                              'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                              'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
                              'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart',
                              'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
                              'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
                              'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price',
                              'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell']
        
        for i in range(100):
            first_name = customer_first_names[i]
            last_name = customer_last_names[i] 
            email = f'customer{i+1}@gmail.com'
            phone = f'555-{2000+i:04d}'
            sample_customers.append((first_name, last_name, email, phone))

        for first_name, last_name, email, phone in sample_customers:
            cursor.execute('''
                INSERT IGNORE INTO customers (first_name, last_name, email, phone) 
                VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))

        # Add 10 New York users
        ny_users = []
        ny_first_names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skyler', 'Cameron']
        ny_last_names = ['Chen', 'Rodriguez', 'Johnson', 'Williams', 'Martinez', 'Lee', 'Kim', 'Patel', 'Garcia', 'Anderson']
        
        for i in range(10):
            first_name = ny_first_names[i]
            last_name = ny_last_names[i]
            email = f'nyuser{i+1}@gmail.com'
            phone = f'212-{3000+i:04d}'
            ny_users.append((first_name, last_name, email, phone))

        for first_name, last_name, email, phone in ny_users:
            cursor.execute('''
                INSERT IGNORE INTO customers (first_name, last_name, email, phone) 
                VALUES (%s, %s, %s, %s)
            ''', (first_name, last_name, email, phone))

        # Update users table with chef_id and customer_id foreign keys
        print("Linking users with chef and customer profiles...")
        
        # Get chef IDs and link them to users
        cursor.execute('SELECT id, email FROM chefs')
        chefs = {email: chef_id for chef_id, email in cursor.fetchall()}
        
        for chef_email, chef_id in chefs.items():
            cursor.execute('''
                UPDATE users SET chef_id = %s WHERE email = %s AND user_type = 'chef'
            ''', (chef_id, chef_email))

        # Get customer IDs and link them to users
        cursor.execute('SELECT id, email FROM customers')
        customers = {email: customer_id for customer_id, email in cursor.fetchall()}
        
        for customer_email, customer_id in customers.items():
            cursor.execute('''
                UPDATE users SET customer_id = %s WHERE email = %s AND user_type = 'customer'
            ''', (customer_id, customer_email))

        # Get chef IDs and cuisine IDs for relationships

        cursor.execute('SELECT id, name FROM cuisine_types')
        cuisine_ids = {name: cuisine_id for cuisine_id, name in cursor.fetchall()}

        # Add chef cuisines (assign cuisines to all 50 chefs)
        cuisine_list = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
                       'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek']
        
        chef_cuisine_mappings = []
        
        # Assign cuisines to all 100 chefs (cycling through cuisines and adding 1-3 per chef)
        for i in range(1, 101):
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

        # Add chef service areas (for all 100 chefs) - Extended to 100 major US cities
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
            ('New Orleans', 'LA', '70112'), ('Wichita', 'KS', '67201'), ('Cleveland', 'OH', '44101'),
            ('Tampa', 'FL', '33601'), ('Bakersfield', 'CA', '93301'), ('Aurora', 'CO', '80010'),
            ('Anaheim', 'CA', '92801'), ('Honolulu', 'HI', '96801'), ('Santa Ana', 'CA', '92701'),
            ('Corpus Christi', 'TX', '78401'), ('Riverside', 'CA', '92501'), ('Lexington', 'KY', '40501'),
            ('Stockton', 'CA', '95201'), ('Henderson', 'NV', '89001'), ('Saint Paul', 'MN', '55101'),
            ('St. Louis', 'MO', '63101'), ('Cincinnati', 'OH', '45201'), ('Pittsburgh', 'PA', '15201'),
            ('Greensboro', 'NC', '27401'), ('Anchorage', 'AK', '99501'), ('Plano', 'TX', '75023'),
            ('Lincoln', 'NE', '68501'), ('Orlando', 'FL', '32801'), ('Irvine', 'CA', '92602'),
            ('Newark', 'NJ', '07101'), ('Durham', 'NC', '27701'), ('Chula Vista', 'CA', '91910'),
            ('Toledo', 'OH', '43601'), ('Fort Wayne', 'IN', '46801'), ('St. Petersburg', 'FL', '33701'),
            ('Laredo', 'TX', '78040'), ('Jersey City', 'NJ', '07302'), ('Chandler', 'AZ', '85224'),
            ('Madison', 'WI', '53701'), ('Lubbock', 'TX', '79401'), ('Scottsdale', 'AZ', '85251'),
            ('Reno', 'NV', '89501'), ('Buffalo', 'NY', '14201'), ('Gilbert', 'AZ', '85234'),
            ('Glendale', 'AZ', '85301'), ('North Las Vegas', 'NV', '89030'), ('Winston-Salem', 'NC', '27101'),
            ('Chesapeake', 'VA', '23320'), ('Norfolk', 'VA', '23501'), ('Fremont', 'CA', '94536'),
            ('Garland', 'TX', '75040'), ('Irving', 'TX', '75061'), ('Hialeah', 'FL', '33010'),
            ('Richmond', 'VA', '23218'), ('Boise', 'ID', '83702'), ('Spokane', 'WA', '99201'),
            ('Birmingham', 'AL', '35203'), ('Modesto', 'CA', '95354'), ('Des Moines', 'IA', '50309'),
            ('Fontana', 'CA', '92335'), ('Rochester', 'NY', '14604'), ('Oxnard', 'CA', '93030'),
            ('Moreno Valley', 'CA', '92553'), ('Fayetteville', 'NC', '28301'), ('Glendale', 'CA', '91205'),
            ('Huntington Beach', 'CA', '92648'), ('Akron', 'OH', '44308'), ('Aurora', 'IL', '60505'),
            ('Mobile', 'AL', '36601'), ('Little Rock', 'AR', '72201'), ('Amarillo', 'TX', '79101'),
            ('Yonkers', 'NY', '10701'), ('Montgomery', 'AL', '36104'), ('Grand Rapids', 'MI', '49503')
        ]
        
        chef_areas = []
        for i in range(100):
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

        # Add chef pricing (for all 100 chefs)
        chef_pricing = []
        
        for i in range(100):
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

        # Add chef availability days (for all 100 chefs)
        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        # Common time slots for different chef types
        time_slots = [
            ('09:00', '17:00'),  # Day shift chef
            ('17:00', '23:00'),  # Evening chef
            ('11:00', '22:00'),  # All-day chef
            ('18:00', '24:00'),  # Dinner specialist
            ('10:00', '16:00'),  # Lunch specialist
            ('16:00', '20:00'),  # Dinner only
            ('12:00', '21:00'),  # Lunch + Dinner
        ]
        
        chef_availability = []
        
        for i in range(100):
            chef_email = f'chef{i+1}@gmail.com'
            if chef_email in chefs:
                chef_id = chefs[chef_email]
                
                # Each chef gets 3-6 available days per week
                num_available_days = 3 + (i % 4)  # 3, 4, 5, or 6 days
                
                # Select random days for this chef
                import random
                random.seed(i)  # Consistent random for same chef
                available_days = random.sample(days_of_week, num_available_days)
                
                # Select time slot based on chef index
                start_time, end_time = time_slots[i % len(time_slots)]
                
                for day in available_days:
                    chef_availability.append((chef_id, day, start_time, end_time))

        for chef_id, day, start_time, end_time in chef_availability:
            cursor.execute('''
                INSERT IGNORE INTO chef_availability_days (chef_id, day_of_week, start_time, end_time) 
                VALUES (%s, %s, %s, %s)
            ''', (chef_id, day, start_time, end_time))

        # Add customer addresses (for all 100 customers)
        cursor.execute('SELECT id, email FROM customers')
        customers = {email: customer_id for customer_id, email in cursor.fetchall()}
        
        street_names = ['Main St', 'Oak Ave', 'Pine St', 'Cedar Ln', 'Elm Dr', 'Maple Way', 'Park Blvd', 'First St',
                       'Second Ave', 'Third St', 'Fourth Dr', 'Fifth Way', 'Broadway', 'Center St', 'Church St',
                       'College Ave', 'Court St', 'Franklin St', 'Highland Ave', 'Hill St', 'Jackson St', 'Jefferson Ave',
                       'King St', 'Lincoln Ave', 'Madison St', 'Market St', 'Mill St', 'North St', 'Park Ave', 'Ridge Rd',
                       'River St', 'School St', 'South St', 'Spring St', 'State St', 'Union St', 'View Dr', 'Wall St',
                       'Washington Ave', 'Water St', 'West St', 'Wilson Ave', 'Wood St', 'York St', 'Adams St',
                       'Baker St', 'Clark Ave', 'Davis Dr', 'Evans St', 'Forest Ave', 'Green St', 'Harbor Ave', 'Industrial Blvd',
                       'James St', 'Kennedy Dr', 'Lake View', 'Monument Ave', 'Noble St', 'Ocean Dr', 'Pleasant St',
                       'Queen St', 'Railroad Ave', 'Sunset Blvd', 'Tower St', 'University Ave', 'Valley Rd', 'Windsor Way',
                       'Xenia St', 'Yale Ave', 'Zion St', 'Ashford St', 'Beacon Hill', 'Cherry Lane', 'Diamond St',
                       'Evergreen Ave', 'Fairview Dr', 'Garden Way', 'Heritage St', 'Ivy Lane', 'Jasmine St', 'Kensington Ave',
                       'Liberty St', 'Magnolia Dr', 'Northern Ave', 'Orchard St', 'Peach Tree', 'Quiet Lane', 'Rosewood Dr',
                       'Sycamore St', 'Tulip Ave', 'Unity Dr', 'Victoria St', 'Willow Creek', 'Xavier Blvd', 'Yellowstone Ave',
                       'Zenith Way', 'Alpine St', 'Birch Ave', 'Crescent Dr', 'Dogwood Lane', 'Eagle St', 'Falcon Way']
        
        for i in range(1, 101):
            customer_email = f'customer{i}@gmail.com'
            if customer_email in customers:
                customer_id = customers[customer_email]
                street_num = 100 + (i % 900)
                street_name = street_names[(i-1) % len(street_names)]
                address = f'{street_num} {street_name}'
                
                # Use same cities as chefs, cycling through them
                city, state, zip_code = cities_data[(i-1) % len(cities_data)]
                
                cursor.execute('''
                    INSERT IGNORE INTO customer_addresses (customer_id, address_line1, city, state, zip_code, is_default) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (customer_id, address, city, state, zip_code, True))

        # Add addresses for 10 New York users
        print("Adding addresses for New York users...")
        ny_streets = ['Broadway', '5th Avenue', 'Park Avenue', 'Madison Avenue', 'Lexington Avenue', 
                     'Amsterdam Avenue', 'Columbus Avenue', 'West End Avenue', 'Riverside Drive', 'Central Park West']
        
        for i in range(1, 11):
            ny_email = f'nyuser{i}@gmail.com'
            if ny_email in customers:
                customer_id = customers[ny_email]
                street_num = 100 + (i * 50)
                street_name = ny_streets[i-1]
                address = f'{street_num} {street_name}'
                
                cursor.execute('''
                    INSERT IGNORE INTO customer_addresses (customer_id, address_line1, city, state, zip_code, is_default) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (customer_id, address, 'New York', 'NY', '10001', True))

        # Add sample favorite chefs relationships (each customer gets 2 favorite chefs)
        print("\nAdding user interface sample data...")
        
        # Get actual customer and chef IDs from database
        cursor.execute('SELECT id FROM customers ORDER BY id LIMIT 100')
        actual_customer_ids = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT id FROM chefs ORDER BY id LIMIT 100')
        actual_chef_ids = [row[0] for row in cursor.fetchall()]
        
        # Generate favorite relationships: each customer likes 2-3 different chefs
        sample_favorites = []
        
        import random
        for idx, customer_id in enumerate(actual_customer_ids):  # Use actual customer IDs
            random.seed(customer_id + 100)  # Consistent random for same customer
            # Each customer likes 2-3 random chefs
            num_favorites = 2 + (idx % 2)  # 2 or 3 favorites
            favorite_chef_ids = []
            
            while len(favorite_chef_ids) < num_favorites:
                chef_id = random.choice(actual_chef_ids)  # Use actual chef IDs
                # Avoid duplication
                if chef_id not in favorite_chef_ids:
                    favorite_chef_ids.append(chef_id)
            
            for chef_id in favorite_chef_ids:
                sample_favorites.append((customer_id, chef_id))
        
        for customer_id, chef_id in sample_favorites:
            cursor.execute('''
                INSERT IGNORE INTO customer_favorite_chefs (customer_id, chef_id)
                VALUES (%s, %s)
            ''', (customer_id, chef_id))
        print(f"Added {len(sample_favorites)} favorite chef relationships (2-3 per customer)")

        # Add sample booking history
        print("Adding sample booking history...")
        
        # Generate booking data for better testing
        from datetime import datetime, timedelta
        import random
        
        # Get actual customer IDs from database
        cursor.execute('SELECT id FROM customers ORDER BY id LIMIT 50')
        actual_customer_ids = [row[0] for row in cursor.fetchall()]
        
        # Get actual chef IDs from database
        cursor.execute('SELECT id FROM chefs ORDER BY id LIMIT 100')
        actual_chef_ids = [row[0] for row in cursor.fetchall()]
        
        sample_bookings = []
        meal_types = ['breakfast', 'lunch', 'dinner']
        event_types = ['birthday', 'wedding', 'party', 'dinner', 'brunch']
        cuisine_list = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French']
        statuses = ['completed', 'accepted', 'pending']
        
        # Add bookings for first 50 customers with various dates
        for idx, customer_id in enumerate(actual_customer_ids):  # Use actual customer IDs
            # Each customer gets 2-5 bookings
            num_bookings = random.randint(2, 5)
            
            for booking_num in range(num_bookings):
                random.seed(customer_id * 100 + booking_num)  # Consistent random
                
                # Random chef (use actual chef IDs)
                chef_id = random.choice(actual_chef_ids)
                
                # Random date (mix of past, today, and future)
                days_offset = random.randint(-30, 60)  # 30 days ago to 60 days future
                booking_date = (datetime.now() + timedelta(days=days_offset)).date()
                
                # Random time
                hours = random.choice([9, 11, 12, 17, 18, 19, 20])
                minutes = random.choice([0, 30])
                booking_time = f"{hours:02d}:{minutes:02d}"
                
                # Random booking details
                cuisine_type = random.choice(cuisine_list)
                meal_type = random.choice(meal_types)
                event_type = random.choice(event_types)
                number_of_people = random.randint(2, 8)
                
                # Status based on date
                if days_offset < -1:  # Past bookings
                    status = 'completed'
                elif days_offset < 0:  # Recent past
                    status = random.choice(['completed', 'accepted'])
                else:  # Future bookings
                    status = random.choice(['accepted', 'pending'])
                
                # Calculate total cost
                base_rate = 45.00 + (chef_id % 40) + (chef_id * 0.5)
                total_cost = base_rate * number_of_people
                
                sample_bookings.append((
                    customer_id, chef_id, cuisine_type, meal_type, event_type,
                    booking_date, booking_time, 'customer', number_of_people,
                    f'Special request for {event_type} event', status, total_cost
                ))
        
        # Insert all booking records
        for booking_data in sample_bookings:
            cursor.execute('''
                INSERT INTO bookings (
                    customer_id, chef_id, cuisine_type, meal_type, event_type,
                    booking_date, booking_time, produce_supply, number_of_people,
                    special_notes, status, total_cost
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', booking_data)
        
        print(f"Added {len(sample_bookings)} sample bookings for customers 1-50")
        print("Booking history includes past, present, and future bookings")

        # Add description column to chefs table first
        try:
            query = "ALTER TABLE chefs ADD COLUMN description VARCHAR(500)"
            cursor.execute(query)
            conn.commit()
            print("COLUMN 'description' ADDED TO TABLE 'chefs'")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("COLUMN 'description' ALREADY EXISTS IN TABLE 'chefs'")
            else:
                print(f"Error adding description column: {e}")

        conn.commit()
 

        # Add geographic coordinates for chef addresses
        print("\nAdding geographic coordinates for chefs...")
        
        # US city coordinates data (lat, lng for major cities)
        city_coordinates = {
            'Chicago': (41.8781, -87.6298), 'New York': (40.7831, -73.9712), 'Los Angeles': (34.0549, -118.2426),
            'Houston': (29.7604, -95.3698), 'Phoenix': (33.4484, -112.0740), 'Philadelphia': (39.9526, -75.1652),
            'San Antonio': (29.4241, -98.4936), 'San Diego': (32.7157, -117.1611), 'Dallas': (32.7767, -96.7970),
            'San Jose': (37.3382, -121.8863), 'Austin': (30.2672, -97.7431), 'Jacksonville': (30.3322, -81.6557),
            'Fort Worth': (32.7555, -97.3308), 'Columbus': (39.9612, -82.9988), 'Charlotte': (35.2271, -80.8431),
            'San Francisco': (37.7749, -122.4194), 'Indianapolis': (39.7684, -86.1581), 'Seattle': (47.6062, -122.3321),
            'Denver': (39.7392, -104.9903), 'Washington': (38.9072, -77.0369), 'Boston': (42.3601, -71.0589),
            'El Paso': (31.7619, -106.4850), 'Nashville': (36.1627, -86.7816), 'Detroit': (42.3314, -83.0458),
            'Oklahoma City': (35.4676, -97.5164), 'Portland': (45.5152, -122.6784), 'Las Vegas': (36.1699, -115.1398),
            'Memphis': (35.1495, -90.0490), 'Louisville': (38.2527, -85.7585), 'Baltimore': (39.2904, -76.6122),
            'Milwaukee': (43.0389, -87.9065), 'Albuquerque': (35.0844, -106.6504), 'Tucson': (32.2226, -110.9747),
            'Fresno': (36.7378, -119.7871), 'Sacramento': (38.5816, -121.4944), 'Mesa': (33.4152, -111.8315),
            'Kansas City': (39.0997, -94.5786), 'Atlanta': (33.7490, -84.3880), 'Long Beach': (33.7701, -118.1937),
            'Colorado Springs': (38.8339, -104.8214), 'Raleigh': (35.7796, -78.6382), 'Miami': (25.7617, -80.1918),
            'Virginia Beach': (36.8529, -75.9780), 'Omaha': (41.2565, -95.9345), 'Oakland': (37.8044, -122.2712),
            'Minneapolis': (44.9778, -93.2650), 'Tulsa': (36.1540, -95.9928), 'Arlington': (32.7357, -97.1081),
            'New Orleans': (29.9511, -90.0715), 'Wichita': (37.6872, -97.3301), 'Cleveland': (41.4993, -81.6944),
            'Tampa': (27.9506, -82.4572), 'Bakersfield': (35.3733, -119.0187), 'Aurora': (39.7294, -104.8319),
            'Anaheim': (33.8366, -117.9143), 'Honolulu': (21.3099, -157.8581), 'Santa Ana': (33.7455, -117.8677),
            'Corpus Christi': (27.8006, -97.3964), 'Riverside': (33.9533, -117.3961), 'Lexington': (38.0406, -84.5037),
            'Stockton': (37.9577, -121.2908), 'Henderson': (36.0397, -114.9817), 'Saint Paul': (44.9537, -93.0900),
            'St. Louis': (38.6270, -90.1994), 'Cincinnati': (39.1031, -84.5120), 'Pittsburgh': (40.4406, -79.9959),
            'Greensboro': (36.0726, -79.7920), 'Anchorage': (61.2181, -149.9003), 'Plano': (33.0198, -96.6989),
            'Lincoln': (40.8136, -96.7026), 'Orlando': (28.5383, -81.3792), 'Irvine': (33.6846, -117.8265),
            'Newark': (40.7357, -74.1724), 'Durham': (35.9940, -78.8986), 'Chula Vista': (32.6401, -117.0842),
            'Toledo': (41.6528, -83.5379), 'Fort Wayne': (41.0793, -85.1394), 'St. Petersburg': (27.7676, -82.6403),
            'Laredo': (27.5306, -99.4803), 'Jersey City': (40.7178, -74.0431), 'Chandler': (33.3062, -111.8413),
            'Madison': (43.0731, -89.4012), 'Lubbock': (33.5779, -101.8552), 'Scottsdale': (33.4942, -111.9261),
            'Reno': (39.5296, -119.8138), 'Buffalo': (42.8864, -78.8784), 'Gilbert': (33.3528, -111.7890),
            'Glendale': (33.5387, -112.1860), 'North Las Vegas': (36.1989, -115.1175), 'Winston-Salem': (36.0999, -80.2442),
            'Chesapeake': (36.7682, -76.2875), 'Norfolk': (36.8468, -76.2852), 'Fremont': (37.5483, -121.9886),
            'Garland': (32.9126, -96.6389), 'Irving': (32.8140, -96.9489), 'Hialeah': (25.8576, -80.2781),
            'Richmond': (37.5407, -77.4360), 'Boise': (43.6150, -116.2023), 'Spokane': (47.6587, -117.4260),
            'Birmingham': (33.5207, -86.8025), 'Modesto': (37.6391, -120.9969), 'Des Moines': (41.5868, -93.6250),
            'Fontana': (34.0922, -117.4350), 'Rochester': (43.1566, -77.6088), 'Oxnard': (34.1975, -119.1771),
            'Moreno Valley': (33.9425, -117.2297), 'Fayetteville': (35.0527, -78.8784), 'Huntington Beach': (33.6595, -117.9988),
            'Akron': (41.0814, -81.5190), 'Mobile': (30.6954, -88.0399), 'Little Rock': (34.7465, -92.2896),
            'Amarillo': (35.2220, -101.8313), 'Yonkers': (40.9312, -73.8988), 'Montgomery': (32.3668, -86.3000),
            'Grand Rapids': (42.9634, -85.6681)
        }
        
        # Get all chefs with their service areas
        cursor.execute('''
            SELECT c.id, c.email, sa.city, sa.state 
            FROM chefs c 
            JOIN chef_service_areas sa ON c.id = sa.chef_id
        ''')
        chef_service_areas = cursor.fetchall()
        
        # Insert chef addresses with coordinates
        for chef_id, chef_email, city, state in chef_service_areas:
            if city in city_coordinates:
                lat, lng = city_coordinates[city]
                
                # Add some variation to coordinates (within a few miles of city center)
                import random
                random.seed(chef_id)  # Consistent random for same chef
                lat_variation = random.uniform(-0.05, 0.05)  # About ±3 miles
                lng_variation = random.uniform(-0.05, 0.05)
                
                final_lat = lat + lat_variation
                final_lng = lng + lng_variation
                
                # Generate street address
                street_num = 100 + (chef_id % 900)
                street_names = ['Chef Way', 'Culinary Blvd', 'Kitchen St', 'Gourmet Ave', 'Recipe Rd', 
                              'Flavor St', 'Spice Lane', 'Taste Ave', 'Cook St', 'Food Dr']
                street_name = street_names[chef_id % len(street_names)]
                address = f'{street_num} {street_name}'
                
                cursor.execute('''
                    INSERT IGNORE INTO chef_addresses (chef_id, address_line1, city, state, latitude, longitude, is_default) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (chef_id, address, city, state, final_lat, final_lng, True))
        
        print(f"Added geographic coordinates for {len(chef_service_areas)} chefs")

        try:
            query = "ALTER TABLE chefs ADD COLUMN description VARCHAR(500)"
            cursor.execute(query)
            conn.commit()
            print("COLUMN 'description' ADDED TO TABLE 'chefs'")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("COLUMN 'description' ALREADY EXISTS IN TABLE 'chefs'")
            else:
                print(f"Error adding description column: {e}")

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
