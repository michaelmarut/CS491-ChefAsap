import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from database.config import db_config
from database.init_db import init_db

def recreate_database():
    # Connect without database selected
    config = db_config.copy()
    del config['database']
    
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # Drop and recreate the database
        cursor.execute(f"DROP DATABASE IF EXISTS {db_config['database']}")
        cursor.execute(f"CREATE DATABASE {db_config['database']}")
        print(f"Database {db_config['database']} recreated successfully")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Recreating database...")
    recreate_database()
    print("\nInitializing tables...")
    init_db()
    print("\nDatabase setup completed!")