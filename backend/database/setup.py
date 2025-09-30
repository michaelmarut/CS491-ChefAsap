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

        # Booking status history table to track all status changes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS booking_status_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                previous_status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled'),
                new_status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') NOT NULL,
                changed_by_type ENUM('customer', 'chef', 'system') NOT NULL,
                changed_by_id INT,
                reason TEXT,
                notes TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                INDEX idx_booking_changed_at (booking_id, changed_at)
            )
        ''')

        # User deletion requests table for handling account deletion and data removal
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_deletion_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_type ENUM('customer', 'chef') NOT NULL,
                user_id INT NOT NULL,
                user_email VARCHAR(100) NOT NULL,
                request_reason TEXT,
                status ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                deletion_type ENUM('soft_delete', 'hard_delete', 'anonymize') DEFAULT 'soft_delete',
                scheduled_deletion_date DATE,
                actual_deletion_date DATE,
                data_backup_location VARCHAR(255),
                deletion_confirmation_code VARCHAR(50),
                admin_notes TEXT,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                processed_by_admin_id INT,
                INDEX idx_user_deletion (user_type, user_id),
                INDEX idx_deletion_status (status),
                INDEX idx_scheduled_deletion (scheduled_deletion_date)
            )
        ''')

        # Agreements table for storing all app policies and terms
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agreements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                agreement_type ENUM('terms_of_service', 'privacy_policy', 'chef_agreement', 'customer_agreement', 'cancellation_policy', 'payment_terms', 'data_usage_policy') NOT NULL,
                title VARCHAR(200) NOT NULL,
                content LONGTEXT NOT NULL,
                version VARCHAR(20) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_required BOOLEAN DEFAULT TRUE,
                applicable_to ENUM('all', 'customers', 'chefs') DEFAULT 'all',
                effective_date DATE NOT NULL,
                expiry_date DATE,
                created_by_admin_id INT,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_agreement_active (agreement_type, is_active),
                INDEX idx_effective_date (effective_date),
                INDEX idx_applicable_to (applicable_to)
            )
        ''')

        # User agreement acceptances table to track which users accepted which agreements
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_agreement_acceptances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                agreement_id INT NOT NULL,
                user_type ENUM('customer', 'chef') NOT NULL,
                user_id INT NOT NULL,
                user_email VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                acceptance_method ENUM('signup', 'update_prompt', 'forced_update') NOT NULL,
                accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
                INDEX idx_user_agreements (user_type, user_id),
                INDEX idx_agreement_acceptances (agreement_id),
                UNIQUE KEY unique_user_agreement (agreement_id, user_type, user_id)
            )
        ''')

        # Chef ratings table - customers rate chefs after completed appointments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                chef_id INT NOT NULL,
                customer_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                food_quality_rating INT CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
                service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
                punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
                professionalism_rating INT CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
                would_recommend BOOLEAN DEFAULT TRUE,
                is_anonymous BOOLEAN DEFAULT FALSE,
                admin_flagged BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_customer_chef_booking_rating (booking_id, customer_id),
                INDEX idx_chef_ratings (chef_id, rating),
                INDEX idx_booking_rating (booking_id)
            )
        ''')

        # Customer ratings table - chefs rate customers after completed appointments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
                payment_promptness_rating INT CHECK (payment_promptness_rating >= 1 AND payment_promptness_rating <= 5),
                respect_rating INT CHECK (respect_rating >= 1 AND respect_rating <= 5),
                kitchen_cleanliness_rating INT CHECK (kitchen_cleanliness_rating >= 1 AND kitchen_cleanliness_rating <= 5),
                would_work_again BOOLEAN DEFAULT TRUE,
                is_anonymous BOOLEAN DEFAULT FALSE,
                admin_flagged BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_chef_customer_booking_rating (booking_id, chef_id),
                INDEX idx_customer_ratings (customer_id, rating),
                INDEX idx_booking_customer_rating (booking_id)
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

        # Chats table for managing chat sessions between customers and chefs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                booking_id INT,
                status ENUM('active', 'closed', 'archived') DEFAULT 'active',
                closed_by_type ENUM('customer', 'chef'),
                closed_by_id INT,
                closed_at TIMESTAMP NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                UNIQUE KEY unique_customer_chef_booking (customer_id, chef_id, booking_id)
            )
        ''')

        # Chat messages table for storing chat history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chat_id INT NOT NULL,
                sender_type ENUM('customer', 'chef') NOT NULL,
                sender_id INT NOT NULL,
                message_text TEXT NOT NULL,
                message_type ENUM('text', 'image', 'file') DEFAULT 'text',
                file_url VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                INDEX idx_chat_sent_at (chat_id, sent_at),
                INDEX idx_sender (sender_type, sender_id)
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
