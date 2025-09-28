#!/usr/bin/env python3
"""
Test the exact profile API call that's failing
This will simulate the frontend request to see what's happening
"""

import requests
import json

def test_profile_api():
    """Test the profile API directly"""
    
    # The API URL from your config
    api_url = "http://192.168.1.181:3000"
    
    # Test with chef ID 70 (from your logs)
    chef_id = 70
    
    print("🧪 TESTING PROFILE API DIRECTLY")
    print("=" * 50)
    print(f"API URL: {api_url}")
    print(f"Chef ID: {chef_id}")
    print(f"Full URL: {api_url}/api/profile/chef/{chef_id}")
    
    try:
        # Make the same request as the frontend
        response = requests.get(f"{api_url}/api/profile/chef/{chef_id}")
        
        print(f"\n📡 Response Status: {response.status_code}")
        print(f"📋 Response Headers:")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
        
        print(f"\n📄 Response Body:")
        try:
            response_data = response.json()
            print(json.dumps(response_data, indent=2))
        except:
            print(response.text)
        
        if response.status_code == 200:
            print("\n✅ API call successful!")
        else:
            print(f"\n❌ API call failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error - Backend server not reachable")
        print("Make sure your backend is running on 192.168.1.181:3000")
    except Exception as e:
        print(f"\n❌ Request failed: {e}")
    
    # Also test OPTIONS request
    print("\n" + "=" * 30)
    print("🧪 TESTING OPTIONS REQUEST")
    
    try:
        options_response = requests.options(f"{api_url}/api/profile/chef/{chef_id}")
        print(f"📡 OPTIONS Response Status: {options_response.status_code}")
        print(f"📋 OPTIONS Response Headers:")
        for header, value in options_response.headers.items():
            print(f"  {header}: {value}")
            
        if options_response.status_code == 200:
            print("✅ OPTIONS request successful!")
        else:
            print(f"❌ OPTIONS request failed with status {options_response.status_code}")
            
    except Exception as e:
        print(f"❌ OPTIONS request failed: {e}")

if __name__ == '__main__':
    test_profile_api()