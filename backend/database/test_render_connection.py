"""
Test connection to Render PostgreSQL database
"""

import psycopg2
import os
from urllib.parse import urlparse

def parse_database_url(url):
    """Parse PostgreSQL URL into connection parameters"""
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],  # Remove leading /
        'user': parsed.username,
        'password': parsed.password
    }

def test_render_connection():
    """Test connection to Render Cloud PostgreSQL"""
    
    print("="*60)
    print("Testing Render PostgreSQL Connection")
    print("="*60)
    
    # Get Render connection info
    print("\nYou can provide either:")
    print("  1. External Database URL (postgres://user:pass@host/db)")
    print("  2. Individual connection details\n")
    
    url_input = input("External Database URL (or press Enter to input details separately): ").strip()
    
    if url_input and url_input.startswith('postgres'):
        # Parse the URL
        try:
            params = parse_database_url(url_input)
            host = params['host']
            port = params['port']
            database = params['database']
            user = params['user']
            password = params['password']
            print(f"\n Parsed URL successfully!")
            print(f"  Host: {host}")
            print(f"  Database: {database}")
            print(f"  User: {user}")
        except Exception as e:
            print(f" Failed to parse URL: {e}")
            return
    else:
        # Manual input
        host = input("Host (e.g., dpg-xxxxx.oregon-postgres.render.com): ").strip()
        if not host:
            print(" Host is required!")
            return
        
        database = input("Database name: ").strip() or "chefasap"
        user = input("Username: ").strip() or "chefasap_user"
        password = input("Password: ").strip()
        
        if not password:
            print(" Password is required!")
            return
        
        port = input("Port (default 5432): ").strip() or "5432"
    
    # Try to connect
    print("\n" + "="*60)
    print("Attempting to connect to Render PostgreSQL...")
    print("="*60)
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=password,
            sslmode='require'  # Render requires SSL
        )
        
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print("\n Connection successful!")
        print(f"\nPostgreSQL version: {version[0]}")
        
        # Check if tables exist
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        print(f"Tables in database: {table_count}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("Connection test completed successfully!")
        print("="*60)
        
        # Save configuration
        save = input("\nSave these settings to config_postgres.py? (yes/no): ").lower()
        if save in ['yes', 'y']:
            print("\nTo use these settings, update config_postgres.py:")
            print(f"  render_config['host'] = '{host}'")
            print(f"  render_config['database'] = '{database}'")
            print(f"  render_config['user'] = '{user}'")
            print(f"  render_config['password'] = '{password}'")
            print(f"\nThen set: DB_MODE = 'render'")
        
    except Exception as e:
        print(f"\n Connection failed: {e}")
        print("\nPlease check:")
        print("  1. Your Render database is active")
        print("  2. Connection details are correct")
        print("  3. Your IP is allowed (Render may have firewall rules)")
        print("  4. SSL is enabled (Render requires it)")

if __name__ == "__main__":
    test_render_connection()
