import psycopg2
from psycopg2 import sql, Error
from config import db_config
from datetime import datetime
import os

def preserve_bookings_chats():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        print("Step 1: Modifying foreign key constraints to preserve bookings on user deletion...")
        cursor.execute('''
            ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
        ''')

        cursor.execute('''
            ALTER TABLE bookings
            ADD CONSTRAINT bookings_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        ''')

        cursor.execute('''
            ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS bookings_chef_id_fkey;
        ''')

        cursor.execute('''
            ALTER TABLE bookings
            ADD CONSTRAINT bookings_chef_id_fkey
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE SET NULL;
        ''')

        print("New bookings constraints applied successfully.")

        print("\nStep 2: Modifying foreign key constraints to preserve chat history on user deletion...")
        cursor.execute('''
            ALTER TABLE chats
            DROP CONSTRAINT IF EXISTS chats_customer_id_fkey;
        ''')
        cursor.execute('''
            ALTER TABLE chats
            ADD CONSTRAINT chats_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL; 
        ''')
        cursor.execute('''
            ALTER TABLE chats
            DROP CONSTRAINT IF EXISTS chats_chef_id_fkey;
        ''')
        cursor.execute('''
            ALTER TABLE chats
            ADD CONSTRAINT chats_chef_id_fkey
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE SET NULL; 
        ''')

        conn.commit()
        print("New constraints applied successfully.")
    except Exception as e:
        print(f"Error modifying constraints: {e}")
        if conn:
            conn.rollback()
            print("Changes rolled back")
        raise
    

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def add_chef_kitchen_tools_table():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        print("\nAdding table chef_kitchen_tools...")
        cursor.execute('''
                CREATE TABLE IF NOT EXISTS chef_kitchen_tools ( 
                    id SERIAL PRIMARY KEY,
                    chef_id INTEGER NOT NULL,
                    tool_name VARCHAR(100) NOT NULL,
                    tool_description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
                )
        ''')

        conn.commit()
        print("Table added successfully.")
    except Exception as e:
        print(f"Error adding table: {e}")
        if conn:
            conn.rollback()
            print("Changes rolled back")
        raise
    

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def run_db_updates():
    print("="*70)
    print("Running database updates:")
    print("="*70)
    
    updates = [
        preserve_bookings_chats,
        add_chef_kitchen_tools_table,
        #add more migration functions here
    ]

    print(f"Total updates to run: {len(updates)}\n")
    for update_name in updates:
        try:
            update_name()
        except Exception as e:
            print(f"Error running: {e}")
            print("Stopping updates")
            break
    
    print("\n"+"="*70)
    print("Updates done :)")
    print("="*70)

if __name__ == "__main__":
    run_db_updates()
