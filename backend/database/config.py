"""
Database configuration for ChefAsap backend
PostgreSQL (Render Cloud)
"""

import os

# PostgreSQL configuration (Render Cloud)
db_config = {
    'host': os.getenv('RENDER_DB_HOST', 'dpg-d3s29ihr0fns73e69pp0-a.oregon-postgres.render.com'),
    'port': int(os.getenv('RENDER_DB_PORT', '5432')),
    'user': os.getenv('RENDER_DB_USER', 'chefasap_user'),
    'password': os.getenv('RENDER_DB_PASSWORD', '5YVNDyhzIl93LOvG7RyPfaAVx46LdFW2'),
    'database': os.getenv('RENDER_DB_NAME', 'chefasap')
}

# SSL mode for Render (use connection string instead)
connection_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}?sslmode=require"
