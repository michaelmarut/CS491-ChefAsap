from flask import Blueprint, request, jsonify
import mysql.connector
from database.config import db_config

rating_bp = Blueprint('ratings', __name__)

@rating_bp.route('/ratings', methods=['POST'])
def add_chef_rating():
    data = request.get_json()
    chef_id = data.get('chef_id')
    customer_id = data.get('customer_id')
    #currently ratings will be done on chef profile so booking_id may be needed later on
    #booking_id = data.get('booking_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not all([chef_id, customer_id, rating]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO chef_rating(chef_id, customer_id, rating, comment)
            VALUES (%s, %s, %s, %s)''', (chef_id, customer_id, rating, comment))
        
        finally:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Rating successfully posted'}), 201
    
@rating_bp.route('/ratings', methods=['GET'])

def get_chef_ratings():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute('''
            SELECT COUNT(*) as total_ratings, SUM(r.rating) as avg_rating FROM chef_rating r
            where chef_id = %s''', (chef_id))
        ratings_data = cursor.fetchall()

        cursor.execute('''
            SELECT r.customer_id, r.rating, r.comment, r.created_at FROM chef_rating r
            where chef_id = %s
            ORDER_BY created_at DESC''', (chef_id))
        comments = curser.fetchall()


        return jsonify({
            'chef': chef_id,
            'rating' : ratings_data['avg_rating'] / ratings_data['total_ratings'],
            'total_reviews': ratings_data['total_ratings'],
            'reviews': comments
        }), 200
