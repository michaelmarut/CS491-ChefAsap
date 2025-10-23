"""
PostgreSQL setup script for ChefAsap database
Uses psycopg2 to connect to PostgreSQL database and create all necessary tables
"""

import psycopg2
from psycopg2 import sql, Error
from config import db_config

def init_postgres_db():
    """Initialize PostgreSQL database and create all tables"""
    conn = None
    cursor = None
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        print("Connected to PostgreSQL successfully!")
        print("Creating tables...")

        # Users table for authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('chef', 'customer')),
                chef_id INTEGER NULL,
                customer_id INTEGER NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chef_id ON users(chef_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customer_id ON users(customer_id)')

        # Cuisine types
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cuisine_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            )
        ''')

        # Chefs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chefs (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                gender VARCHAR(30) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                description VARCHAR(500),
                photo_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Chef documents
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_documents (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                document_type VARCHAR(50) NOT NULL,
                document_url VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef cuisines (many-to-many)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cuisines (
                chef_id INTEGER NOT NULL,
                cuisine_id INTEGER NOT NULL,
                PRIMARY KEY (chef_id, cuisine_id),
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (cuisine_id) REFERENCES cuisine_types(id) ON DELETE CASCADE
            )
        ''')

        # Chef addresses
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_addresses (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chef_location ON chef_addresses(latitude, longitude)')

        # Chef payment methods
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_payment_methods (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('direct_deposit', 'paypal', 'check')),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef bank accounts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_bank_accounts (
                id SERIAL PRIMARY KEY,
                payment_method_id INTEGER NOT NULL,
                bank_name VARCHAR(100) NOT NULL,
                routing_number VARCHAR(9) NOT NULL,
                account_number VARCHAR(17) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef PayPal accounts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_paypal_accounts (
                id SERIAL PRIMARY KEY,
                payment_method_id INTEGER NOT NULL,
                paypal_email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef check addresses
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_check_addresses (
                id SERIAL PRIMARY KEY,
                payment_method_id INTEGER NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES chef_payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Chef payments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_payments (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'deposited')),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef availability days
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_availability_days (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE (chef_id, day_of_week)
            )
        ''')

        # Chef meal availability
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_meal_availability (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE (chef_id, meal_type)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chef_meal ON chef_meal_availability(chef_id, meal_type, is_available)')

        # Customers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20),
                photo_url VARCHAR(255),
                allergy_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Customer addresses
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                address_line1 VARCHAR(100) NOT NULL,
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customer_location ON customer_addresses(latitude, longitude)')

        # Payment methods
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payment_methods (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('card', 'paypal', 'check')),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')

        # Credit cards
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credit_cards (
                id SERIAL PRIMARY KEY,
                payment_method_id INTEGER NOT NULL,
                card_holder_first_name VARCHAR(50) NOT NULL,
                card_holder_last_name VARCHAR(50) NOT NULL,
                card_number VARCHAR(16) NOT NULL,
                expiration_date VARCHAR(5) NOT NULL,
                cvv VARCHAR(4) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # PayPal accounts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS paypal_accounts (
                id SERIAL PRIMARY KEY,
                payment_method_id INTEGER NOT NULL,
                paypal_email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE
            )
        ''')

        # Bookings
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER,
                cuisine_type VARCHAR(50) NOT NULL,
                meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
                event_type VARCHAR(20) DEFAULT 'dinner' CHECK (event_type IN ('birthday', 'wedding', 'party', 'dinner', 'brunch')),
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                produce_supply VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (produce_supply IN ('customer', 'chef')),
                number_of_people INTEGER NOT NULL,
                special_notes TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
                total_cost DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE SET NULL
            )
        ''')

        # Booking status history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS booking_status_history (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL,
                previous_status VARCHAR(20) CHECK (previous_status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
                new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
                changed_by_type VARCHAR(20) NOT NULL CHECK (changed_by_type IN ('customer', 'chef', 'system')),
                changed_by_id INTEGER,
                reason TEXT,
                notes TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_booking_changed_at ON booking_status_history(booking_id, changed_at)')

        # User deletion requests
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_deletion_requests (
                id SERIAL PRIMARY KEY,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'chef')),
                user_id INTEGER NOT NULL,
                user_email VARCHAR(100) NOT NULL,
                request_reason TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
                deletion_type VARCHAR(20) DEFAULT 'soft_delete' CHECK (deletion_type IN ('soft_delete', 'hard_delete', 'anonymize')),
                scheduled_deletion_date DATE,
                actual_deletion_date DATE,
                data_backup_location VARCHAR(255),
                deletion_confirmation_code VARCHAR(50),
                admin_notes TEXT,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                processed_by_admin_id INTEGER
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_deletion ON user_deletion_requests(user_type, user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_deletion_status ON user_deletion_requests(status)')

        # Agreements
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agreements (
                id SERIAL PRIMARY KEY,
                agreement_type VARCHAR(50) NOT NULL CHECK (agreement_type IN ('terms_of_service', 'privacy_policy', 'chef_agreement', 'customer_agreement', 'cancellation_policy', 'payment_terms', 'data_usage_policy')),
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                version VARCHAR(20) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_required BOOLEAN DEFAULT TRUE,
                applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'customers', 'chefs')),
                effective_date DATE NOT NULL,
                expiry_date DATE,
                created_by_admin_id INTEGER,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # User agreement acceptances
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_agreement_acceptances (
                id SERIAL PRIMARY KEY,
                agreement_id INTEGER NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'chef')),
                user_id INTEGER NOT NULL,
                user_email VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                acceptance_method VARCHAR(30) NOT NULL CHECK (acceptance_method IN ('signup', 'update_prompt', 'forced_update')),
                accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
                UNIQUE (agreement_id, user_type, user_id)
            )
        ''')

        # Chef ratings
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_ratings (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
                service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
                punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
                professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
                would_recommend BOOLEAN DEFAULT TRUE,
                is_anonymous BOOLEAN DEFAULT FALSE,
                admin_flagged BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                UNIQUE (booking_id, customer_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chef_ratings ON chef_ratings(chef_id, rating)')

        # Chef rating summary
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_rating_summary (
                chef_id INTEGER PRIMARY KEY,
                average_rating DECIMAL(3,2),
                total_reviews INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_average_rating ON chef_rating_summary(average_rating DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_total_reviews ON chef_rating_summary(total_reviews DESC)')

        # Customer ratings
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_ratings (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
                payment_promptness_rating INTEGER CHECK (payment_promptness_rating >= 1 AND payment_promptness_rating <= 5),
                respect_rating INTEGER CHECK (respect_rating >= 1 AND respect_rating <= 5),
                kitchen_cleanliness_rating INTEGER CHECK (kitchen_cleanliness_rating >= 1 AND kitchen_cleanliness_rating <= 5),
                would_work_again BOOLEAN DEFAULT TRUE,
                is_anonymous BOOLEAN DEFAULT FALSE,
                admin_flagged BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE (booking_id, chef_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_customer_ratings ON customer_ratings(customer_id, rating)')

        # Chef service areas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_service_areas (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                service_radius_miles INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chef pricing
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_pricing (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                base_rate_per_person DECIMAL(10,2) NOT NULL,
                produce_supply_extra_cost DECIMAL(10,2) DEFAULT 0.00,
                minimum_people INTEGER DEFAULT 1,
                maximum_people INTEGER DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Chats
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                booking_id INTEGER,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
                closed_by_type VARCHAR(20) CHECK (closed_by_type IN ('customer', 'chef')),
                closed_by_id INTEGER,
                closed_at TIMESTAMP,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                UNIQUE (customer_id, chef_id, booking_id)
            )
        ''')

        # Chat messages
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                chat_id INTEGER NOT NULL,
                sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'chef')),
                sender_id INTEGER NOT NULL,
                message_text TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
                file_url VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chat_sent_at ON chat_messages(chat_id, sent_at)')

        # Online meetings
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS online_meetings (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                booking_id INTEGER,
                meeting_date DATE NOT NULL,
                meeting_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 15,
                meeting_url VARCHAR(255),
                meeting_platform VARCHAR(20) DEFAULT 'zoom' CHECK (meeting_platform IN ('zoom', 'google_meet', 'teams', 'webex', 'other')),
                status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
                cancelled_by_type VARCHAR(20) CHECK (cancelled_by_type IN ('customer', 'chef', 'system')),
                cancelled_by_id INTEGER,
                cancelled_at TIMESTAMP,
                cancellation_reason TEXT,
                customer_wants_to_end BOOLEAN DEFAULT FALSE,
                customer_end_requested_at TIMESTAMP,
                chef_wants_to_end BOOLEAN DEFAULT FALSE,
                chef_end_requested_at TIMESTAMP,
                early_end_agreed BOOLEAN DEFAULT FALSE,
                early_end_reason TEXT,
                actual_duration_minutes INTEGER,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_meeting_status ON online_meetings(status)')

        # Meeting feedback
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS meeting_feedback (
                id SERIAL PRIMARY KEY,
                meeting_id INTEGER NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'chef')),
                user_id INTEGER NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                feedback_text TEXT,
                meeting_quality_rating INTEGER CHECK (meeting_quality_rating >= 1 AND meeting_quality_rating <= 5),
                communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
                technical_issues BOOLEAN DEFAULT FALSE,
                would_meet_again BOOLEAN DEFAULT TRUE,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (meeting_id) REFERENCES online_meetings(id) ON DELETE CASCADE,
                UNIQUE (meeting_id, user_type, user_id)
            )
        ''')

        # Customer meeting usage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_meeting_usage (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                meetings_used INTEGER DEFAULT 0,
                meetings_limit INTEGER DEFAULT 3,
                period_start DATE NOT NULL,
                period_end DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE (customer_id, chef_id, period_start)
            )
        ''')

        # Chef cancellation records
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cancellation_records (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                record_type VARCHAR(30) NOT NULL CHECK (record_type IN ('booking_cancellations', 'meeting_cancellations')),
                cancellation_count INTEGER NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE,
                threshold_reached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                penalty_applied BOOLEAN DEFAULT FALSE,
                penalty_type VARCHAR(20) DEFAULT 'warning' CHECK (penalty_type IN ('warning', 'suspension', 'fee', 'profile_flag')),
                notes TEXT,
                admin_reviewed BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Notifications
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'chef')),
                user_id INTEGER NOT NULL,
                notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('booking_update', 'meeting_reminder', 'payment_alert', 'new_message', 'rating_request', 'promotional', 'system_alert')),
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                send_push BOOLEAN DEFAULT TRUE,
                send_email BOOLEAN DEFAULT FALSE,
                send_sms BOOLEAN DEFAULT FALSE,
                is_read BOOLEAN DEFAULT FALSE,
                is_sent BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP,
                read_at TIMESTAMP,
                action_type VARCHAR(50),
                action_data JSONB,
                priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_notifications ON notifications(user_type, user_id, is_read)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_notification_type ON notifications(notification_type)')

        # Customer cancellation fees
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_cancellation_fees (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                cancellation_time TIMESTAMP NOT NULL,
                booking_scheduled_time TIMESTAMP NOT NULL,
                hours_before_booking DECIMAL(4,1) NOT NULL,
                fee_amount DECIMAL(10,2) NOT NULL,
                fee_percentage DECIMAL(5,2),
                booking_total_cost DECIMAL(10,2),
                fee_reason TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'charged', 'waived', 'disputed')),
                charged_at TIMESTAMP,
                waived_at TIMESTAMP,
                waived_reason TEXT,
                payment_transaction_id VARCHAR(100),
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')

        # Customer favorite chefs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_favorite_chefs (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                chef_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                UNIQUE (customer_id, chef_id)
            )
        ''')

        # Chef cuisine photos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_cuisine_photos (
                id SERIAL PRIMARY KEY,
                chef_id INTEGER NOT NULL,
                cuisine_type VARCHAR(100) NOT NULL,
                photo_url VARCHAR(255) NOT NULL,
                photo_title VARCHAR(200),
                photo_description TEXT,
                is_featured BOOLEAN DEFAULT FALSE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
            )
        ''')

        # Customer search locations
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customer_search_locations (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                location_name VARCHAR(200),
                address_line1 VARCHAR(100),
                address_line2 VARCHAR(100),
                city VARCHAR(50) NOT NULL,
                state VARCHAR(2) NOT NULL,
                zip_code VARCHAR(10),
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usage_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_search_location ON customer_search_locations(latitude, longitude)')

        # Add foreign key constraints for users table
        # Check if constraint exists before adding
        try:
            cursor.execute('''
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_chef_id'
                    ) THEN
                        ALTER TABLE users 
                        ADD CONSTRAINT fk_users_chef_id 
                        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            ''')
        except Exception as e:
            print(f"Note: chef_id constraint - {e}")
        
        try:
            cursor.execute('''
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_customer_id'
                    ) THEN
                        ALTER TABLE users 
                        ADD CONSTRAINT fk_users_customer_id 
                        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
                    END IF;
                END $$;
            ''')
        except Exception as e:
            print(f"Note: customer_id constraint - {e}")

        conn.commit()
        print("\n✅ All tables created successfully in PostgreSQL!")
        print(f"\nDatabase: {db_config['database']}")
        print(f"Total tables created: 42")
        
    except Error as e:
        print(f"\n❌ Error creating tables: {e}")
        if conn:
            conn.rollback()
            
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("="*60)
    print("ChefAsap PostgreSQL Database Setup")
    print("="*60)
    init_postgres_db()
