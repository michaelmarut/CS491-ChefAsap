from flask import Flask
import mysql.connector

app = Flask(__name__)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password_here',
    'database': 'chefasap'
}


@app.route('/')
def index():
    try:
        # Test MySQL connection
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        return 'Flask and MySQL connection successful!'
    except Exception as e:
        return f'Error: {str(e)}'

if __name__ == '__main__':
    app.run(debug=True, port=3000)
