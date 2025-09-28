import mysql.connector
from database.config import db_config

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Check first 5 chefs
    cursor.execute('SELECT id, email FROM chefs WHERE id <= 5')
    chefs = cursor.fetchall()
    print('First 5 chefs:')
    for chef in chefs:
        print(f'  Chef ID {chef[0]}: {chef[1]}')
    
    # Check first 5 chef users
    cursor.execute("SELECT email, user_type FROM users WHERE user_type = 'chef' LIMIT 5")
    users = cursor.fetchall()
    print('\nFirst 5 chef users:')
    for user in users:
        print(f'  User: {user[0]} ({user[1]})')
    
    # Check which chefs have matching users
    cursor.execute('''
        SELECT c.id, c.email as chef_email, u.email as user_email
        FROM chefs c
        LEFT JOIN users u ON c.email = u.email
        WHERE c.id <= 5
    ''')
    matches = cursor.fetchall()
    print('\nChef-User email matches:')
    for match in matches:
        print(f'  Chef ID {match[0]}: {match[1]} -> {match[2] or "NO USER MATCH"}')
    
    # Find chefs that DO have matching users
    cursor.execute('''
        SELECT c.id, c.email
        FROM chefs c
        JOIN users u ON c.email = u.email
        WHERE u.user_type = 'chef'
        LIMIT 10
    ''')
    working_chefs = cursor.fetchall()
    print('\nChefs WITH matching users:')
    for chef in working_chefs:
        print(f'  Chef ID {chef[0]}: {chef[1]}')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'Error: {e}')