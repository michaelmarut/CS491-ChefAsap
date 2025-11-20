DB_UPDATES.py allows you to add queries that modify the database.

In terminal:
go to --> backend/database

```bash
cd backend/database
```

Run file to apply updates
```bash
python migrations.py
```

**To add an update:**
In migrations.py, add a new function of format:

```bash
def update_name():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute('''
            SOME QUERY
        ''')

        conn.commit()
        except Exception as e:
        conn.rollback()
        raise
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
```
**then in run_db_updates() function, add new function name to array 'updates'**
