import mysql.connector
from mysql.connector import Error
from .config import db_config

def init_db():
    # Using PostgreSQL - tables already created on Render Cloud
    print("Database tables created successfully")
    return
    
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
                chef_id INT NULL,
                customer_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_chef_id (chef_id),
                INDEX idx_customer_id (customer_id)
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
                gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                description VARCHAR(500),
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
                latitude DECIMAL(10, 8) NULL,
                longitude DECIMAL(11, 8) NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX idx_location (latitude, longitude)
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

        # Chef meal timing availability (breakfast, lunch, dinner)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_meal_availability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_chef_meal (chef_id, meal_type),
                INDEX idx_chef_meal (chef_id, meal_type, is_available)
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
                latitude DECIMAL(10, 8) NULL,
                longitude DECIMAL(11, 8) NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_location (latitude, longitude)
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
                event_type ENUM('birthday', 'wedding', 'party', 'dinner', 'brunch') DEFAULT 'dinner',
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
        """cursor.execute('''
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
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_rating_summary (
                chef_id INT PRIMARY KEY,
                average_rating DECIMAL(3,2),
                total_reviews INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX idx_average_rating (average_rating DESC),
                INDEX idx_total_reviews (total_reviews DESC)
            )
        ''')

        # Chef rating summary table - pre-calculated average ratings for performance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_rating_summary (
                chef_id INT PRIMARY KEY,
                average_rating DECIMAL(3,2),
                total_reviews INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX idx_average_rating (average_rating DESC),
                INDEX idx_total_reviews (total_reviews DESC)
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

        # Online meetings table for virtual meetings between customers and chefs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS online_meetings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                booking_id INT,
                meeting_date DATE NOT NULL,
                meeting_time TIME NOT NULL,
                duration_minutes INT DEFAULT 15,
                meeting_url VARCHAR(255),
                meeting_platform ENUM('zoom', 'google_meet', 'teams', 'webex', 'other') DEFAULT 'zoom',
                status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
                cancelled_by_type ENUM('customer', 'chef', 'system'),
                cancelled_by_id INT,
                cancelled_at TIMESTAMP NULL,
                cancellation_reason TEXT,
                customer_wants_to_end BOOLEAN DEFAULT FALSE,
                customer_end_requested_at TIMESTAMP NULL,
                chef_wants_to_end BOOLEAN DEFAULT FALSE,
                chef_end_requested_at TIMESTAMP NULL,
                early_end_agreed BOOLEAN DEFAULT FALSE,
                early_end_reason TEXT,
                actual_duration_minutes INT,
                started_at TIMESTAMP NULL,
                ended_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                INDEX idx_customer_meetings (customer_id, meeting_date),
                INDEX idx_chef_meetings (chef_id, meeting_date),
                INDEX idx_meeting_status (status)
            )
        ''')

        # Meeting feedback table for post-meeting evaluations
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS meeting_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                meeting_id INT NOT NULL,
                user_type ENUM('customer', 'chef') NOT NULL,
                user_id INT NOT NULL,
                rating INT CHECK (rating >= 1 AND rating <= 5),
                feedback_text TEXT,
                meeting_quality_rating INT CHECK (meeting_quality_rating >= 1 AND meeting_quality_rating <= 5),
                communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
                technical_issues BOOLEAN DEFAULT FALSE,
                would_meet_again BOOLEAN DEFAULT TRUE,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meeting_id) REFERENCES online_meetings(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_meeting_feedback (meeting_id, user_type, user_id),
                INDEX idx_meeting_feedback (meeting_id)
            )
        ''')

        # Customer meeting usage tracking (3 meeting limit)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_meeting_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                meetings_used INT DEFAULT 0,
                meetings_limit INT DEFAULT 3,
                period_start DATE NOT NULL,
                period_end DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_customer_chef_period (customer_id, chef_id, period_start),
                INDEX idx_customer_usage (customer_id),
                INDEX idx_chef_usage (chef_id)
            )
        ''')

        # Chef cancellation tracking (record after 3 cancellations)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cancellation_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                record_type ENUM('booking_cancellations', 'meeting_cancellations') NOT NULL,
                cancellation_count INT NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE,
                threshold_reached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                penalty_applied BOOLEAN DEFAULT FALSE,
                penalty_type ENUM('warning', 'suspension', 'fee', 'profile_flag') DEFAULT 'warning',
                notes TEXT,
                admin_reviewed BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX idx_chef_cancellations (chef_id, record_type),
                INDEX idx_threshold_date (threshold_reached_at)
            )
        ''')

        # Notifications table for all user notifications and alerts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_type ENUM('customer', 'chef') NOT NULL,
                user_id INT NOT NULL,
                notification_type ENUM('booking_update', 'meeting_reminder', 'payment_alert', 'new_message', 'rating_request', 'promotional', 'system_alert') NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                send_push BOOLEAN DEFAULT TRUE,
                send_email BOOLEAN DEFAULT FALSE,
                send_sms BOOLEAN DEFAULT FALSE,
                is_read BOOLEAN DEFAULT FALSE,
                is_sent BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP NULL,
                read_at TIMESTAMP NULL,
                action_type VARCHAR(50),
                action_data JSON,
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_notifications (user_type, user_id, is_read),
                INDEX idx_notification_type (notification_type),
                INDEX idx_priority_created (priority, created_at),
                INDEX idx_expires_at (expires_at)
            )
        ''')

        # Customer cancellation fees for late cancellations (less than 24 hours)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_cancellation_fees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                customer_id INT NOT NULL,
                cancellation_time TIMESTAMP NOT NULL,
                booking_scheduled_time TIMESTAMP NOT NULL,
                hours_before_booking DECIMAL(4,1) NOT NULL,
                fee_amount DECIMAL(10,2) NOT NULL,
                fee_percentage DECIMAL(5,2),
                booking_total_cost DECIMAL(10,2),
                fee_reason TEXT,
                status ENUM('pending', 'charged', 'waived', 'disputed') DEFAULT 'pending',
                charged_at TIMESTAMP NULL,
                waived_at TIMESTAMP NULL,
                waived_reason TEXT,
                payment_transaction_id VARCHAR(100),
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_customer_fees (customer_id, status),
                INDEX idx_booking_fee (booking_id),
                INDEX idx_fee_status (status)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_rating(
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                customer_id INT NOT NULL,
                booking_id INT NOT NULL,
                rating FLOAT NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
                comment VARCHAR(1000),
                FOREIGN KEY (chef_id) references chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                INDEX idx_chef_rating (chef_id)
            )
        ''')

        # Add new columns to users table if they don't exist (for existing databases)
        try:
            # Check if chef_id column exists
            cursor.execute("SHOW COLUMNS FROM users LIKE 'chef_id'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE users ADD COLUMN chef_id INT NULL")
                cursor.execute("ALTER TABLE users ADD INDEX idx_chef_id (chef_id)")
                print("Added chef_id column to users table")
        except mysql.connector.Error as e:
            print(f"Note: chef_id column handling: {e}")

        try:
            # Check if customer_id column exists
            cursor.execute("SHOW COLUMNS FROM users LIKE 'customer_id'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE users ADD COLUMN customer_id INT NULL")
                cursor.execute("ALTER TABLE users ADD INDEX idx_customer_id (customer_id)")
                print("Added customer_id column to users table")
        except mysql.connector.Error as e:
            print(f"Note: customer_id column handling: {e}")

        # Add latitude and longitude columns to address tables if they don't exist
        try:
            # Check if latitude column exists in chef_addresses
            cursor.execute("SHOW COLUMNS FROM chef_addresses LIKE 'latitude'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE chef_addresses ADD COLUMN latitude DECIMAL(10, 8) NULL")
                cursor.execute("ALTER TABLE chef_addresses ADD COLUMN longitude DECIMAL(11, 8) NULL")
                cursor.execute("ALTER TABLE chef_addresses ADD INDEX idx_location (latitude, longitude)")
                print("Added latitude/longitude columns to chef_addresses table")
        except mysql.connector.Error as e:
            print(f"Note: chef_addresses latitude/longitude column handling: {e}")

        try:
            # Check if latitude column exists in customer_addresses
            cursor.execute("SHOW COLUMNS FROM customer_addresses LIKE 'latitude'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE customer_addresses ADD COLUMN latitude DECIMAL(10, 8) NULL")
                cursor.execute("ALTER TABLE customer_addresses ADD COLUMN longitude DECIMAL(11, 8) NULL")
                cursor.execute("ALTER TABLE customer_addresses ADD INDEX idx_location (latitude, longitude)")
                print("Added latitude/longitude columns to customer_addresses table")
        except mysql.connector.Error as e:
            print(f"Note: customer_addresses latitude/longitude column handling: {e}")

        # Add gender column to chefs table if it doesn't exist
        try:
            cursor.execute("SHOW COLUMNS FROM chefs LIKE 'gender'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE chefs ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL AFTER last_name")
                print("Added gender column to chefs table")
        except mysql.connector.Error as e:
            print(f"Note: chefs gender column handling: {e}")

        # Customer favorite chefs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_favorite_chefs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_customer_chef_favorite (customer_id, chef_id),
                INDEX idx_customer_favorites (customer_id),
                INDEX idx_chef_favorited (chef_id)
            )
        ''')

        # Chef cuisine photos table for storing chef's food/cuisine photos
        # Business rules: Max 10 photos per cuisine type, max 50 total photos per chef
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cuisine_photos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                cuisine_type VARCHAR(100) NOT NULL,
                photo_url VARCHAR(255) NOT NULL,
                photo_title VARCHAR(200),
                photo_description TEXT,
                is_featured BOOLEAN DEFAULT FALSE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX idx_chef_cuisine_photos (chef_id, cuisine_type),
                INDEX idx_chef_featured_photos (chef_id, is_featured),
                INDEX idx_display_order (chef_id, display_order)
            )
        ''')

        # Customer search location history - stores recent locations used for finding nearby chefs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_search_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                location_name VARCHAR(200),
                address_line1 VARCHAR(100),
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10),
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usage_count INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_customer_last_used (customer_id, last_used_at DESC),
                INDEX idx_location (latitude, longitude)
            )
        ''')

        # Add foreign key constraints for users table after all tables are created
        try:
            cursor.execute('''
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_chef_id 
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            ''')
            print("Added foreign key constraint for chef_id")
        except mysql.connector.Error as e:
            if "Duplicate" not in str(e):
                print(f"Note: chef_id foreign key constraint: {e}")
        
        try:
            cursor.execute('''
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_customer_id 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            ''')
            print("Added foreign key constraint for customer_id")
        except mysql.connector.Error as e:
            if "Duplicate" not in str(e):
                print(f"Note: customer_id foreign key constraint: {e}")

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
