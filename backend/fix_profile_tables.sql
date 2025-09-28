-- SQL script to create missing profile-related tables
-- Run this in your MySQL database to fix profile API errors

-- Create customer_addresses table
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
);

-- Create payment_methods table for customers
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    payment_type ENUM('credit_card', 'debit_card', 'paypal', 'cash') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create chef_addresses table
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
);

-- Create chef_payment_methods table
CREATE TABLE IF NOT EXISTS chef_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chef_id INT NOT NULL,
    payment_type ENUM('bank_transfer', 'paypal', 'venmo', 'cash') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
);

-- Create chef_cuisines table if not exists
CREATE TABLE IF NOT EXISTS chef_cuisines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chef_id INT NOT NULL,
    cuisine_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
    FOREIGN KEY (cuisine_id) REFERENCES cuisine_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chef_cuisine (chef_id, cuisine_id)
);

-- Create cuisine_types table if not exists
CREATE TABLE IF NOT EXISTS cuisine_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample cuisine types
INSERT IGNORE INTO cuisine_types (name, description) VALUES
('Italian', 'Traditional Italian cuisine'),
('Chinese', 'Authentic Chinese dishes'),
('Mexican', 'Spicy and flavorful Mexican food'),
('Indian', 'Rich and aromatic Indian cuisine'),
('French', 'Classic French culinary techniques'),
('Japanese', 'Fresh and elegant Japanese dishes'),
('Thai', 'Sweet, sour, and spicy Thai flavors'),
('American', 'Classic American comfort food'),
('Mediterranean', 'Fresh and healthy Mediterranean dishes'),
('Korean', 'Bold and fermented Korean flavors');

-- Make sure chef_availability_days table exists (should already be created)
CREATE TABLE IF NOT EXISTS chef_availability_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chef_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chef_day (chef_id, day_of_week)
);

-- Check if required columns exist in chefs table, add if missing
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS residency VARCHAR(100);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other');
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS facebook_link VARCHAR(255);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS instagram_link VARCHAR(255);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS twitter_link VARCHAR(255);

-- Check if required columns exist in customers table, add if missing  
ALTER TABLE customers ADD COLUMN IF NOT EXISTS allergy_notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dietary_preferences TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_cuisine_types TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS facebook_link VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS instagram_link VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS twitter_link VARCHAR(255);