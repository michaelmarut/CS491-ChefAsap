import mysql.connector
from mysql.connector import Error
from .config import db_config

def init_db():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Users table for authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                user_type ENUM('chef', 'customer') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ''')

        # Cuisine  
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cuisine_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            )
        ''')

        # Chef 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chefs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                photo_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ''')

        # Chef documents
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                document_type VARCHAR(50) NOT NULL,  -- e.g., 'certificate', 'license'
                document_url VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef cuisines (many-to-many relationship)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cuisines (
                chef_id INT NOT NULL,
                cuisine_id INT NOT NULL,
                PRIMARY KEY (chef_id, cuisine_id),
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (cuisine_id) REFERENCES cuisine_types(id) ON DELETE CASCADE
            )
        ''')

        # Chef addresses
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef payment methods
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_payment_methods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                payment_type ENUM('direct_deposit', 'paypal', 'check') NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef bank accounts for direct deposit
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method_id INT NOT NULL,
                bank_name VARCHAR(100) NOT NULL,
                routing_number VARCHAR(9) NOT NULL,    -- Will be encrypted
                account_number VARCHAR(17) NOT NULL,   -- Will be encrypted
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef PayPal accounts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_paypal_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method_id INT NOT NULL,
                paypal_email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef check payment
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_check_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method_id INT NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef payment history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'deposited') NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef schedule 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_availability_days (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_chef_day (chef_id, day_of_week)
            )
        ''')

        # Customers
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                photo_url VARCHAR(255),
                allergy_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ''')

        # Customers Addresses 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')

        # Customers Payment Methods 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payment_methods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                payment_type ENUM('card', 'paypal', 'check') NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')

        # Customers Credit Card Info
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credit_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method_id INT NOT NULL,
                card_holder_first_name VARCHAR(50) NOT NULL,
                card_holder_last_name VARCHAR(50) NOT NULL,
                card_number VARCHAR(16) NOT NULL,        -- Will be encrypted 
                expiration_date VARCHAR(5) NOT NULL,     -- Format: MM/YY
                cvv VARCHAR(4) NOT NULL,                -- 3 or 4 digits, will be encrypted
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Customers PayPal Info
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS paypal_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method_id INT NOT NULL,
                paypal_email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Bookings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT,
                cuisine_type VARCHAR(50) NOT NULL,
                meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
                event_type ENUM('birthday', 'wedding', 'party', 'dinner', 'brunch') NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                produce_supply ENUM('customer', 'chef') NOT NULL DEFAULT 'customer',
                number_of_people INT NOT NULL,
                special_notes TEXT,
                status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
                total_cost DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE SET NULL
            )
        ''')

        # Chef service areas (for location-based search)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_service_areas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                service_radius_miles INT DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef pricing (base rates and produce supply extra cost)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_pricing (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                base_rate_per_person DECIMAL(10,2) NOT NULL,
                produce_supply_extra_cost DECIMAL(10,2) DEFAULT 0.00,
                minimum_people INT DEFAULT 1,
                maximum_people INT DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        conn.commit()
        print("Database tables created successfully")

    except Error as e:
        print(f"Error creating tables: {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    init_db()



# CREATE DATABASE chefasap   -on the database for first time
#  CHARACTER SET utf8mb4
#  COLLATE utf8mb4_unicode_ci;

#python -m database.init_db ||| run at terminal to create the database