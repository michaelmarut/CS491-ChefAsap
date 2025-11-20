import psycopg2
from psycopg2 import sql, Error
from config import db_config
from datetime import datetime
import os

def migrations_table_init():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                applied_by VARCHAR(100),
                description TEXT,
                rollback_script TEXT
            )
        ''')
        conn.commit()
        print("✅ Migrations table initialized successfully.")

    except Error as e:
        print(f"❌ Error initializing migrations table: {e}")
        if conn:
            conn.rollback()
            print("Changes rolled back")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def record_migration(migration_name: str, description: str, rollback_script: str):
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT into migrations (migration_name, description, rollback_script)
            VALUES (%s, %s, %s)
        ''',(migration_name, description, rollback_script))
        conn.commit()
        print(f"Migration recorded : {migration_name}")
    finally:
        cursor.close()
        conn.close()

def has_migration_run(migration_name: str) -> bool:
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT COUNT(*) FROM migrations WHERE migration_name = %s
        ''', (migration_name,))
        #get first value from tuple (contains the # of appearances of migration_name)
        count = cursor.fetchone()[0]
        #if 0 false, if 1 true
        return bool(count)
    finally:
        cursor.close()
        conn.close()

#============================= 
#Migration Functions 
#=============================

def preserve_bookings_chats():

    migration_name = "preserve_bookings_chats"
    description = "Modified foreign key constraints on bookings and chats to preserve data on user deletion."
    rollback_script = """
        ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
            ADD CONSTRAINT bookings_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

        ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS bookings_chef_id_fkey;
            ADD CONSTRAINT bookings_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        ALTER TABLE chats
            DROP CONSTRAINT IF EXISTS chats_customer_id_fkey;
            ADD CONSTRAINT chats_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        ALTER TABLE chats
            DROP CONSTRAINT IF EXISTS chats_chef_id_fkey;
            ADD CONSTRAINT chats_chef_id_fkey
            FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE;
        """

    if has_migration_run(migration_name): 
        return

    print(f"{'='*70}")
    print(f"\nRunning migration: {migration_name}")
    print(f"{'='*70}")

    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        print("Modifying foreign key constraints to preserve bookings on user deletion...")
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

        print("\nModifying foreign key constraints to preserve chat history on user deletion...")
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

        record_migration(migration_name, description, rollback_script)

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

    migration_name = "add_chef_kitchen_tools_table"
    description = "Addedd table to track the kitchen tools that customers own for chef's reference"
    rollback_script = ""

    if has_migration_run(migration_name): 
        return

    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()



        print("\nAdding table chef_kitchen_tools...")

        cursor.execute('''
            DROP TABLE IF EXISTS chef_kitchen_tools;
        ''')

        cursor.execute('''
                CREATE TABLE IF NOT EXISTS chef_kitchen_tools ( 
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER NOT NULL,
                    tool_name VARCHAR(100) NOT NULL,
                    tool_description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES chefs(id) ON DELETE CASCADE
                )
        ''')

        conn.commit()
        record_migration(migration_name, description, rollback_script)

        print("Kitchen_tools table added successfully.")
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
    
    migrations_table_init()

    updates = [
        preserve_bookings_chats,
        add_chef_kitchen_tools_table,
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
