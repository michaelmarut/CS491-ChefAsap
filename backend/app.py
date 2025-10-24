from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database.config import db_config
from database.setup import init_db
from database.db_helper import get_db_connection, get_cursor
from blueprints.auth_bp import auth_bp
from blueprints.booking_bp import booking_bp
from blueprints.profile_bp import profile_bp
from blueprints.chat_bp import chat_bp
from blueprints.search_bp import search_bp
from blueprints.geocoding_bp import geocoding_bp
from blueprints.search_location_bp import search_location_bp
from blueprints.menu_bp import menu_bp
import socket
import os

app = Flask(__name__)


def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

app.after_request(add_cors_headers)


bcrypt = Bcrypt(app)


app.register_blueprint(auth_bp, url_prefix='/auth')


app.register_blueprint(booking_bp, url_prefix='/booking')


app.register_blueprint(profile_bp, url_prefix='/profile')

app.register_blueprint(chat_bp)

app.register_blueprint(search_bp, url_prefix='/search')

app.register_blueprint(geocoding_bp, url_prefix='/geocoding')

app.register_blueprint(search_location_bp, url_prefix='/api')

app.register_blueprint(menu_bp)

@app.route('/')
def index():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.close()
        conn.close()
        return 'Flask and PostgreSQL connection successful!'
    except Exception as e:
        return f'Error: {str(e)}'

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

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
