from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database.config import db_config
from database.setup import init_db
from auth import auth
from booking import booking
import mysql.connector
import socket

app = Flask(__name__)


def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

app.after_request(add_cors_headers)


bcrypt = Bcrypt(app)


app.register_blueprint(auth, url_prefix='/auth')


app.register_blueprint(booking, url_prefix='/booking')

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

# API endpoint to get user profile information
@app.route('/api/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, email, phone, address FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user:
            return jsonify(user)
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db() 
    

    hostname = socket.gethostname()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()

    print(f'Server starting on {local_ip}:3000')
    app.run(debug=True, host='0.0.0.0', port=3000, threaded=True)
