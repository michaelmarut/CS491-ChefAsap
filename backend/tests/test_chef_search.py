import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import json
from database.config import db_config
import mysql.connector

def test_chef_search_api():
    """Test the chef search API endpoints"""
    
    # Base URL - adjust if your Flask app runs on different port
    BASE_URL = "http://localhost:3000/api/bookings"
    
    print("🧪 Testing Chef Search API")
    print("=" * 50)
    
    # Test 1: Get filter options
    print("\n1️⃣ Testing filter options endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/filter-options")
        if response.status_code == 200:
            options = response.json()
            print("✅ Filter options retrieved successfully!")
            print(f"   Available cuisine types: {len(options['cuisine_types'])}")
            print(f"   Available cities: {len(options['cities'])}")
            print(f"   Available states: {len(options['states'])}")
            print(f"   Rating range: {options['rating_range']['min']}-{options['rating_range']['max']}")
        else:
            print(f"❌ Failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 2: Basic chef search
    print("\n2️⃣ Testing basic chef search...")
    try:
        response = requests.get(f"{BASE_URL}/search-chefs")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total_found']} chefs")
            if data['chefs']:
                chef = data['chefs'][0]
                print(f"   First chef: {chef['first_name']} {chef['last_name']}")
                print(f"   Rating: {chef['average_rating']}")
                print(f"   Cuisines: {chef['cuisines']}")
        else:
            print(f"❌ Failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 3: Search with filters
    print("\n3️⃣ Testing filtered search...")
    filters = {
        'cuisine_type': 'Italian',
        'gender': 'male',
        'min_rating': '3.0',
        'sort_by': 'rating',
        'limit': '10'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/search-chefs", params=filters)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Filtered search: Found {data['total_found']} Italian male chefs with rating >= 3.0")
            print(f"   Filters applied: {data['filters_applied']}")
        else:
            print(f"❌ Failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 4: Search with location
    print("\n4️⃣ Testing location-based search...")
    location_filters = {
        'customer_lat': '41.8781',  # Chicago coordinates
        'customer_lon': '-87.6298',
        'max_distance': '50',
        'sort_by': 'distance',
        'limit': '5'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/search-chefs", params=location_filters)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Location search: Found {data['total_found']} chefs within 50 miles of Chicago")
            if data['chefs']:
                for chef in data['chefs'][:3]:
                    distance = chef.get('distance_miles', 'N/A')
                    print(f"   {chef['first_name']} {chef['last_name']} - {distance} miles")
        else:
            print(f"❌ Failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 5: Search with availability
    print("\n5️⃣ Testing availability search...")
    availability_filters = {
        'availability_date': '2025-10-15',
        'availability_time': '18:00',
        'sort_by': 'rating'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/search-chefs", params=availability_filters)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Availability search: Found {data['total_found']} chefs available on Oct 15, 2025 at 6:00 PM")
        else:
            print(f"❌ Failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def add_sample_chefs_for_testing():
    """Add some sample chefs to test the search functionality"""
    print("\n🎯 Adding sample chefs for testing...")
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Sample chefs data
        sample_chefs = [
            ("Mario", "Rossi", "mario@email.com", "555-0101", None, "Passionate Italian chef specializing in authentic pasta dishes", 4.8, 15, "male", "Chicago", "Illinois"),
            ("Sophie", "Chen", "sophie@email.com", "555-0102", None, "Creative Asian fusion chef with modern techniques", 4.6, 22, "female", "New York", "New York"),  
            ("James", "Wilson", "james@email.com", "555-0103", None, "BBQ master and grill specialist", 4.2, 8, "male", "Austin", "Texas"),
            ("Maria", "Garcia", "maria@email.com", "555-0104", None, "Traditional Mexican cuisine expert", 4.9, 31, "female", "Los Angeles", "California"),
            ("Alex", "Johnson", "alex@email.com", "555-0105", None, "Modern American cuisine with farm-to-table focus", 4.4, 12, "nonbinary", "Seattle", "Washington")
        ]
        
        for chef_data in sample_chefs:
            # Check if chef already exists
            cursor.execute("SELECT id FROM chefs WHERE email = %s", (chef_data[2],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO chefs (first_name, last_name, email, phone, photo_url, bio, average_rating, total_reviews, gender, city, residency)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, chef_data)
        
        conn.commit()
        print("✅ Sample chefs added successfully!")
        
    except Exception as e:
        print(f"❌ Error adding sample chefs: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🚀 Chef Search API Testing")
    print("Make sure your Flask app is running on http://localhost:3000")
    print("\nPress Enter to continue or Ctrl+C to exit...")
    
    try:
        input()
        add_sample_chefs_for_testing()
        test_chef_search_api()
    except KeyboardInterrupt:
        print("\n👋 Test cancelled by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")