#!/usr/bin/env python3
"""
User Account Mapping Script
Shows the exact name-to-email connections for all generated users
"""

import mysql.connector
from database.config import db_config
import csv

def show_user_mappings():
    """Display and save user account mappings"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("🔍 CHEFASAP USER ACCOUNT MAPPINGS")
        print("="*70)
        print("🔑 Password for ALL accounts: QWEasd123!")
        print("="*70)
        
        # Get all chefs with their details
        print("\n👨‍🍳 CHEF ACCOUNTS (100 total)")
        print("-"*70)
        cursor.execute('''
            SELECT c.id, c.first_name, c.last_name, c.email, c.city, c.residency, 
                   c.hourly_rate, c.average_rating, c.phone,
                   GROUP_CONCAT(ct.name ORDER BY ct.name SEPARATOR ', ') as cuisines
            FROM chefs c
            LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
            LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
            WHERE c.email LIKE 'chef%@example.com'
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.city, c.residency, 
                     c.hourly_rate, c.average_rating, c.phone
            ORDER BY c.email
        ''')
        
        chefs_data = cursor.fetchall()
        
        # Save chef data to CSV
        chef_csv_data = []
        chef_csv_data.append(['ID', 'First Name', 'Last Name', 'Email', 'Password', 'City', 'State', 'Phone', 'Hourly Rate', 'Rating', 'Cuisines'])
        
        print(f"{'ID':<4} {'Name':<25} {'Email':<25} {'Location':<20} {'Rate':<8} {'Rating':<6} {'Cuisines'}")
        print("-"*120)
        
        for chef in chefs_data:
            chef_id, first_name, last_name, email, city, state, rate, rating, phone, cuisines = chef
            full_name = f"{first_name} {last_name}"
            location = f"{city or 'N/A'}, {state or 'N/A'}"
            
            print(f"{chef_id:<4} {full_name:<25} {email:<25} {location:<20} ${rate:<7.2f} {rating:<6.2f} {cuisines or 'None'}")
            
            # Add to CSV data
            chef_csv_data.append([
                chef_id, first_name, last_name, email, 'QWEasd123!', 
                city or 'N/A', state or 'N/A', phone, f"${rate:.2f}", f"{rating:.2f}", cuisines or 'None'
            ])
        
        # Get all customers with their details
        print(f"\n👤 CUSTOMER ACCOUNTS (100 total)")
        print("-"*70)
        cursor.execute('''
            SELECT c.id, c.first_name, c.last_name, c.email, c.city, c.residency, 
                   c.phone, c.dietary_preferences, c.preferred_cuisine_types,
                   ca.address_line1, ca.zip_code
            FROM customers c
            LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = TRUE
            WHERE c.email LIKE 'user%@example.com'
            ORDER BY c.email
        ''')
        
        customers_data = cursor.fetchall()
        
        # Save customer data to CSV
        customer_csv_data = []
        customer_csv_data.append(['ID', 'First Name', 'Last Name', 'Email', 'Password', 'City', 'State', 'Phone', 'Address', 'Zip', 'Diet', 'Preferred Cuisines'])
        
        print(f"{'ID':<4} {'Name':<25} {'Email':<22} {'Location':<20} {'Phone':<12} {'Diet':<12}")
        print("-"*120)
        
        for customer in customers_data:
            cust_id, first_name, last_name, email, city, state, phone, diet, cuisines, address, zip_code = customer
            full_name = f"{first_name} {last_name}"
            location = f"{city or 'N/A'}, {state or 'N/A'}"
            
            print(f"{cust_id:<4} {full_name:<25} {email:<22} {location:<20} {phone:<12} {diet or 'None'}")
            
            # Add to CSV data
            customer_csv_data.append([
                cust_id, first_name, last_name, email, 'QWEasd123!', 
                city or 'N/A', state or 'N/A', phone, address or 'N/A', 
                zip_code or 'N/A', diet or 'None', cuisines or 'None'
            ])
        
        # Save CSV files
        with open('chef_accounts.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(chef_csv_data)
        
        with open('customer_accounts.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(customer_csv_data)
        
        print(f"\n📊 SUMMARY:")
        print(f"✅ {len(chefs_data)} chef accounts generated")
        print(f"✅ {len(customers_data)} customer accounts generated")
        print(f"💾 Data saved to: chef_accounts.csv & customer_accounts.csv")
        
        # Show some quick examples for testing
        print(f"\n🧪 QUICK TEST EXAMPLES:")
        print("-"*40)
        if chefs_data:
            chef = chefs_data[0]
            print(f"👨‍🍳 Chef Test Login:")
            print(f"   Name: {chef[1]} {chef[2]}")
            print(f"   Email: {chef[3]}")
            print(f"   Password: QWEasd123!")
            print(f"   Location: {chef[4] or 'N/A'}, {chef[5] or 'N/A'}")
        
        if customers_data:
            customer = customers_data[0]
            print(f"\n👤 Customer Test Login:")
            print(f"   Name: {customer[1]} {customer[2]}")
            print(f"   Email: {customer[3]}")
            print(f"   Password: QWEasd123!")
            print(f"   Location: {customer[4] or 'N/A'}, {customer[5] or 'N/A'}")
        
        print(f"\n🔍 TO FIND SPECIFIC USERS:")
        print("- Open chef_accounts.csv or customer_accounts.csv")
        print("- Search by name, email, or location")
        print("- All passwords are: QWEasd123!")
        
    except Exception as e:
        print(f"❌ Error retrieving user mappings: {e}")
        raise e
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def search_user_by_name(search_name):
    """Search for users by name"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print(f"\n🔎 SEARCHING FOR: '{search_name}'")
        print("="*50)
        
        # Search chefs
        cursor.execute('''
            SELECT c.id, c.first_name, c.last_name, c.email, c.city, c.residency
            FROM chefs c
            WHERE (c.first_name LIKE %s OR c.last_name LIKE %s) 
            AND c.email LIKE 'chef%@example.com'
            ORDER BY c.email
        ''', (f'%{search_name}%', f'%{search_name}%'))
        
        chef_results = cursor.fetchall()
        
        if chef_results:
            print("👨‍🍳 CHEF MATCHES:")
            for chef in chef_results:
                print(f"   {chef[1]} {chef[2]} → {chef[3]} (ID: {chef[0]})")
                print(f"   Location: {chef[4] or 'N/A'}, {chef[5] or 'N/A'}")
        
        # Search customers
        cursor.execute('''
            SELECT c.id, c.first_name, c.last_name, c.email, c.city, c.residency
            FROM customers c
            WHERE (c.first_name LIKE %s OR c.last_name LIKE %s) 
            AND c.email LIKE 'user%@example.com'
            ORDER BY c.email
        ''', (f'%{search_name}%', f'%{search_name}%'))
        
        customer_results = cursor.fetchall()
        
        if customer_results:
            print("\n👤 CUSTOMER MATCHES:")
            for customer in customer_results:
                print(f"   {customer[1]} {customer[2]} → {customer[3]} (ID: {customer[0]})")
                print(f"   Location: {customer[4] or 'N/A'}, {customer[5] or 'N/A'}")
        
        if not chef_results and not customer_results:
            print("❌ No users found with that name")
        
        print(f"\n🔑 Password for all accounts: QWEasd123!")
        
    except Exception as e:
        print(f"❌ Error searching users: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Search for specific name
        search_name = ' '.join(sys.argv[1:])
        search_user_by_name(search_name)
    else:
        # Show all mappings
        show_user_mappings()