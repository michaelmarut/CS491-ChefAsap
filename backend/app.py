from flask import Flask, jsonify
from database.config import db_config
from database.setup import init_db
import mysql.connector

app = Flask(__name__)

@app.route('/')
def index():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        return 'Flask and MySQL connection successful!'
    except Exception as e:
        return f'Error: {str(e)}'

if __name__ == '__main__':
    init_db()  # Initialize database tables
    app.run(debug=True, port=3000)
