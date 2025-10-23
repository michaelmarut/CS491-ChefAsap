"""
Database helper module for ChefAsap
PostgreSQL database connection interface
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from database.config import db_config

def get_db_connection():
    """
    Get PostgreSQL database connection
    Returns a psycopg2 connection object
    """
    conn = psycopg2.connect(**db_config)
    return conn

def get_cursor(conn, dictionary=True, buffered=False):
    """
    Get cursor from PostgreSQL connection
    Returns RealDictCursor if dictionary=True (buffered parameter is ignored in PostgreSQL)
    """
    if dictionary:
        return conn.cursor(cursor_factory=RealDictCursor)
    else:
        return conn.cursor()

def handle_db_error(e):
    """
    Handle database errors
    """
    return str(e)
