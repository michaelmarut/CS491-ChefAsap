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
                bio TEXT,
                average_rating DECIMAL(3,2) DEFAULT 0.00,
                total_reviews INT DEFAULT 0,
                facebook_link VARCHAR(255),
                instagram_link VARCHAR(255),
                twitter_link VARCHAR(255),
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
                dietary_preferences TEXT,
                preferred_cuisine_types TEXT,
                facebook_link VARCHAR(255),
                instagram_link VARCHAR(255),
                twitter_link VARCHAR(255),
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

        # ------------------------------
        # NEW Bookings schema (single source of truth)
        # ------------------------------
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                status ENUM(
                    'pending',
                    'accepted',
                    'rejected',
                    'cancelled_by_customer',
                    'cancelled_by_chef',
                    'completed'
                ) NOT NULL DEFAULT 'pending',
                notes TEXT NULL,
                accepted_at DATETIME NULL,
                accepted_by INT NULL,
                cancelled_at DATETIME NULL,
                cancelled_by INT NULL,
                cancel_reason VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_book_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                CONSTRAINT fk_book_chef     FOREIGN KEY (chef_id)     REFERENCES chefs(id)     ON DELETE CASCADE,
                CONSTRAINT fk_book_acceptor FOREIGN KEY (accepted_by) REFERENCES users(id)     ON DELETE SET NULL,
                CONSTRAINT fk_book_cancelor FOREIGN KEY (cancelled_by) REFERENCES users(id)    ON DELETE SET NULL,
                CHECK (end_time > start_time)
            )
        ''')

        # Create indexes for bookings table
        cursor.execute("""
            SELECT COUNT(1) IndexIsThere 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE table_schema=DATABASE() 
            AND table_name='bookings' 
            AND index_name='idx_book_customer_time'
        """)
        if cursor.fetchone()[0] == 0:
            cursor.execute("CREATE INDEX idx_book_customer_time ON bookings (customer_id, start_time, end_time)")

        cursor.execute("""
            SELECT COUNT(1) IndexIsThere 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE table_schema=DATABASE() 
            AND table_name='bookings' 
            AND index_name='idx_book_chef_time'
        """)
        if cursor.fetchone()[0] == 0:
            cursor.execute("CREATE INDEX idx_book_chef_time ON bookings (chef_id, start_time, end_time)")

        cursor.execute("""
            SELECT COUNT(1) IndexIsThere 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE table_schema=DATABASE() 
            AND table_name='bookings' 
            AND index_name='idx_book_status'
        """)
        if cursor.fetchone()[0] == 0:
            cursor.execute("CREATE INDEX idx_book_status ON bookings (status)")

        # ------------------------------
        # Chef Ratings and Reviews
        # ------------------------------
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_reviews (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                customer_id INT NOT NULL,
                booking_id INT UNSIGNED NOT NULL,
                rating DECIMAL(3,2) NOT NULL,
                review_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                UNIQUE KEY unique_booking_review (booking_id),
                CHECK (rating >= 0 AND rating <= 5)
            )
        ''')

        # Add trigger to update chef's average rating
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS after_review_insert 
            AFTER INSERT ON chef_reviews
            FOR EACH ROW
            BEGIN
                UPDATE chefs 
                SET average_rating = (
                    SELECT AVG(rating) 
                    FROM chef_reviews 
                    WHERE chef_id = NEW.chef_id
                ),
                total_reviews = total_reviews + 1
                WHERE id = NEW.chef_id;
            END
        ''')

        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS after_review_update
            AFTER UPDATE ON chef_reviews
            FOR EACH ROW
            BEGIN
                UPDATE chefs 
                SET average_rating = (
                    SELECT AVG(rating) 
                    FROM chef_reviews 
                    WHERE chef_id = NEW.chef_id
                )
                WHERE id = NEW.chef_id;
            END
        ''')

        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS after_review_delete
            AFTER DELETE ON chef_reviews
            FOR EACH ROW
            BEGIN
                UPDATE chefs 
                SET average_rating = COALESCE(
                    (SELECT AVG(rating) FROM chef_reviews WHERE chef_id = OLD.chef_id),
                    0
                ),
                total_reviews = total_reviews - 1
                WHERE id = OLD.chef_id;
            END
        ''')

        # ------------------------------
        # Chat: conversations & messages
        # ------------------------------
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                chef_id INT NOT NULL,
                booking_id INT UNSIGNED NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_pair (customer_id, chef_id),
                CONSTRAINT fk_conv_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                CONSTRAINT fk_conv_chef     FOREIGN KEY (chef_id)     REFERENCES chefs(id)     ON DELETE CASCADE,
                CONSTRAINT fk_conv_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE SET NULL,
                INDEX idx_conv_created (created_at)
            )
        ''')
        #history 
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                conversation_id BIGINT UNSIGNED NOT NULL,
                sender_user_id INT NOT NULL,
                sender_role ENUM('chef','customer') NOT NULL,
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                read_at DATETIME NULL,
                CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
                CONSTRAINT fk_msg_sender FOREIGN KEY (sender_user_id)  REFERENCES users(id)                      ON DELETE CASCADE,
                INDEX idx_msg_conv (conversation_id),
                INDEX idx_msg_sender (sender_user_id),
                INDEX idx_msg_sent_at (sent_at)
            )
        ''')

        # ------------------------------
        # Chef portfolio photos
        # ------------------------------
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chef_portfolio_photos (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                chef_id INT NOT NULL,
                image_url VARCHAR(512) NOT NULL,
                caption VARCHAR(140) NULL,
                tags VARCHAR(255) NULL,
                is_featured TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
                INDEX (chef_id),
                INDEX (created_at)
            ) ENGINE=InnoDB
        ''')

        # ------------------------------
        # User preferences (theme etc.)
        # ------------------------------
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INT NOT NULL PRIMARY KEY,
                theme ENUM('light','dark') NOT NULL DEFAULT 'light',
                language VARCHAR(10) NULL,
                notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        ''')

        # Removing duplicate bookings table creation as it's already defined above

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS booking_status_history (
                history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_id INT UNSIGNED NOT NULL,
                actor_user_id INT NULL,
                action ENUM(
                    'create', 'accept', 'reject',
                    'cancel_by_customer', 'cancel_by_chef',
                    'complete', 'reschedule'
                ) NOT NULL,
                detail VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id)    REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (actor_user_id) REFERENCES users(id)    ON DELETE SET NULL,
                INDEX (booking_id),
                INDEX (created_at)
            )
        ''')

        # ------------------------------
        # Safe column adds (profile extensions & soft delete)
        # ------------------------------
        def add_column_if_not_exists(cursor, table, column, coldef):
            cursor.execute("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = %s
            """, (table, column))
            exists = cursor.fetchone()[0] > 0
            if not exists:
                cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {coldef}")

        # users: soft delete
        add_column_if_not_exists(cursor, 'users',     'is_active', 'TINYINT(1) NOT NULL DEFAULT 1')

        # chefs: profile extras
        add_column_if_not_exists(cursor, 'chefs',     'residency', 'VARCHAR(100) NULL')
        add_column_if_not_exists(cursor, 'chefs',     'city',      'VARCHAR(50)  NULL')
        add_column_if_not_exists(cursor, 'chefs',     'gender',    "ENUM('male','female','nonbinary','prefer_not_say') NULL")

        # customers: profile extras
        add_column_if_not_exists(cursor, 'customers', 'residency', 'VARCHAR(100) NULL')
        add_column_if_not_exists(cursor, 'customers', 'city',      'VARCHAR(50)  NULL')
        add_column_if_not_exists(cursor, 'customers', 'gender',    "ENUM('male','female','nonbinary','prefer_not_say') NULL")

        # ------------------------------
        # 注意：触发器不要在这里用 DELIMITER 执行
        # 请改为在 MySQL 客户端/Workbench 单独执行下面这段（一次即可）：
        #
        # DELIMITER $$
        # CREATE TRIGGER bookings_no_overlap_bi ... END$$
        # CREATE TRIGGER bookings_no_overlap_bu ... END$$
        # DELIMITER ;
        # ------------------------------

        conn.commit()
        print("Database tables created successfully")

    except Error as e:
        print(f"Error creating tables: {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()