#!/usr/bin/env python3
"""
Database Import and Management Script for ChefAsap
Handles importing, verifying, and managing sample data
"""

import mysql.connector
from database.config import db_config
import csv

def check_database_status():
    """Check current database status"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("🔍 CHECKING DATABASE STATUS")
        print("="*50)
        
        # Check users table
        cursor.execute("SELECT COUNT(*) FROM users WHERE email LIKE 'chef%@example.com'")
        chef_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE email LIKE 'user%@example.com'")
        customer_users = cursor.fetchone()[0]
        
        # Check profiles
        cursor.execute("SELECT COUNT(*) FROM chefs WHERE email LIKE 'chef%@example.com'")
        chef_profiles = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM customers WHERE email LIKE 'user%@example.com'")
        customer_profiles = cursor.fetchone()[0]
        
        # Check relationships
        cursor.execute("SELECT COUNT(*) FROM chef_cuisines")
        chef_cuisine_relations = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM chef_reviews")
        reviews = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM bookings")
        bookings = cursor.fetchone()[0]
        
        print(f"👥 Users in database:")
        print(f"   - Chef users: {chef_users}")
        print(f"   - Customer users: {customer_users}")
        print(f"\n👤 Profiles in database:")
        print(f"   - Chef profiles: {chef_profiles}")
        print(f"   - Customer profiles: {customer_profiles}")
        print(f"\n🔗 Relationships:")
        print(f"   - Chef-cuisine links: {chef_cuisine_relations}")
        print(f"   - Reviews: {reviews}")
        print(f"   - Bookings: {bookings}")
        
        if chef_users == 100 and customer_users == 100:
            print(f"\n✅ SUCCESS: All sample data is already in your database!")
            print(f"🎯 You can start testing immediately with:")
            print(f"   - Any chef: chef1@example.com to chef100@example.com")
            print(f"   - Any customer: user1@example.com to user100@example.com")
            print(f"   - Password: QWEasd123!")
        else:
            print(f"\n⚠️  WARNING: Sample data appears incomplete")
            print(f"Expected: 100 chefs, 100 customers")
            print(f"Found: {chef_users} chefs, {customer_users} customers")
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print(f"💡 Make sure your MySQL server is running and config is correct")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def reimport_data():
    """Re-import data from CSV files or regenerate"""
    print("🔄 RE-IMPORTING SAMPLE DATA")
    print("="*40)
    
    choice = input("Choose import method:\n1. Re-run generator script\n2. Import from CSV files\n3. Cancel\nEnter choice (1-3): ")
    
    if choice == '1':
        print("🚀 Re-running sample data generator...")
        try:
            from generate_sample_users import generate_comprehensive_sample_data
            generate_comprehensive_sample_data()
        except Exception as e:
            print(f"❌ Error running generator: {e}")
            
    elif choice == '2':
        import_from_csv()
    else:
        print("❌ Operation cancelled")

def import_from_csv():
    """Import data from CSV files"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("📥 Importing from CSV files...")
        
        # Note: CSV import would require more complex logic to handle
        # password hashing, foreign keys, etc. 
        # For now, recommend using the generator script
        
        print("⚠️  CSV import requires additional setup for:")
        print("   - Password hashing")
        print("   - Foreign key relationships") 
        print("   - Data validation")
        print("\n💡 Recommendation: Use option 1 (Re-run generator) instead")
        
    except Exception as e:
        print(f"❌ Error importing from CSV: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def clear_sample_data():
    """Clear all sample data from database"""
    conn = None
    cursor = None
    
    print("⚠️  CLEAR SAMPLE DATA")
    print("="*30)
    confirmation = input("This will DELETE all sample users! Type 'DELETE' to confirm: ")
    
    if confirmation != 'DELETE':
        print("❌ Operation cancelled")
        return
        
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("🗑️  Deleting sample data...")
        
        # Delete in proper order to handle foreign keys
        cursor.execute("DELETE FROM chef_reviews WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com')")
        deleted_reviews = cursor.rowcount
        
        cursor.execute("DELETE FROM bookings WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com') OR customer_id IN (SELECT id FROM customers WHERE email LIKE 'user%@example.com')")
        deleted_bookings = cursor.rowcount
        
        cursor.execute("DELETE FROM chef_cuisines WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com')")
        deleted_cuisines = cursor.rowcount
        
        cursor.execute("DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM customers WHERE email LIKE 'user%@example.com')")
        deleted_addresses = cursor.rowcount
        
        cursor.execute("DELETE FROM chefs WHERE email LIKE 'chef%@example.com'")
        deleted_chefs = cursor.rowcount
        
        cursor.execute("DELETE FROM customers WHERE email LIKE 'user%@example.com'")
        deleted_customers = cursor.rowcount
        
        cursor.execute("DELETE FROM users WHERE email LIKE 'chef%@example.com' OR email LIKE 'user%@example.com'")
        deleted_users = cursor.rowcount
        
        conn.commit()
        
        print(f"✅ Sample data cleared successfully!")
        print(f"   - Users: {deleted_users}")
        print(f"   - Chefs: {deleted_chefs}")
        print(f"   - Customers: {deleted_customers}")
        print(f"   - Reviews: {deleted_reviews}")
        print(f"   - Bookings: {deleted_bookings}")
        print(f"   - Addresses: {deleted_addresses}")
        print(f"   - Chef-Cuisines: {deleted_cuisines}")
        
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        conn.rollback()
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def export_database_to_sql():
    """Export current database to SQL file"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("📤 Exporting database to SQL file...")
        
        # Get all sample data
        tables_to_export = [
            ('users', "WHERE email LIKE 'chef%@example.com' OR email LIKE 'user%@example.com'"),
            ('chefs', "WHERE email LIKE 'chef%@example.com'"),
            ('customers', "WHERE email LIKE 'user%@example.com'"),
            ('chef_cuisines', "WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com')"),
            ('customer_addresses', "WHERE customer_id IN (SELECT id FROM customers WHERE email LIKE 'user%@example.com')"),
            ('chef_reviews', "WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com')"),
            ('bookings', "WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com') OR customer_id IN (SELECT id FROM customers WHERE email LIKE 'user%@example.com')")
        ]
        
        with open('sample_data_export.sql', 'w', encoding='utf-8') as f:
            f.write("-- ChefAsap Sample Data Export\n")
            f.write("-- Generated automatically\n\n")
            
            for table_name, where_clause in tables_to_export:
                cursor.execute(f"SELECT * FROM {table_name} {where_clause}")
                rows = cursor.fetchall()
                
                if rows:
                    # Get column names
                    cursor.execute(f"DESCRIBE {table_name}")
                    columns = [col[0] for col in cursor.fetchall()]
                    
                    f.write(f"-- Data for table {table_name}\n")
                    for row in rows:
                        # Create INSERT statement
                        values = []
                        for value in row:
                            if value is None:
                                values.append('NULL')
                            elif isinstance(value, str):
                                values.append(f"'{value.replace(chr(39), chr(39)+chr(39))}'")
                            else:
                                values.append(str(value))
                        
                        f.write(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(values)});\n")
                    f.write("\n")
        
        print("✅ Database exported to: sample_data_export.sql")
        
    except Exception as e:
        print(f"❌ Error exporting database: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def main_menu():
    """Main menu for database management"""
    while True:
        print("\n🗄️  CHEFASAP DATABASE MANAGEMENT")
        print("="*40)
        print("1. Check database status")
        print("2. Re-import sample data")
        print("3. Clear all sample data")
        print("4. Export database to SQL")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == '1':
            check_database_status()
        elif choice == '2':
            reimport_data()
        elif choice == '3':
            clear_sample_data()
        elif choice == '4':
            export_database_to_sql()
        elif choice == '5':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    # Quick status check first
    check_database_status()
    
    # Ask if user wants to see full menu
    show_menu = input("\n📋 Show full management menu? (y/n): ").lower()
    if show_menu == 'y':
        main_menu()