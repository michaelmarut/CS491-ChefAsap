from flask import Blueprint, request, jsonify
from database.config import db_config
from database.db_helper import get_db_connection, get_cursor, handle_db_error
from datetime import datetime, timedelta
import secrets
import json

account_deletion_bp = Blueprint('account_deletion_bp', __name__)

def generate_deletion_code():
    return secrets.token_hex(3)

def anonymize_user_data(cursor, user_type, user_id):
    #format for anonymized email
    anonymized_email = f"deleted_user_{user_id}@anonymized.local"
    
    #anonymize in chefs or customers table
    if user_type == 'chef':
        # Anonymize chef in bookings by adding in special notes 'account deleted'
        cursor.execute('''
            UPDATE bookings 
            SET special_notes = CONCAT('[Chef account deleted] ', COALESCE(special_notes, ''))
            WHERE chef_id = %s
        ''', (user_id,))
        
        # Anonymize chef, sets status to archived
        cursor.execute('''
            UPDATE chats 
            SET status = 'archived'
            WHERE chef_id = %s AND status = 'active'
        ''', (user_id,))
        
        # Anonymize chef ratings (keep ratings but mark as deleted user)
        cursor.execute('''
            UPDATE chef_ratings 
            SET admin_notes = CONCAT('[Chef account deleted] ', COALESCE(admin_notes, ''))
            WHERE chef_id = %s
        ''', (user_id,))
        
    elif user_type == 'customer':
        # Anonymize customer in bookings by adding in special notes 'account deleted'
        cursor.execute('''
            UPDATE bookings 
            SET special_notes = CONCAT('[Customer account deleted] ', COALESCE(special_notes, ''))
            WHERE customer_id = %s
        ''', (user_id,))
        
        # Anonymize customer in chats
        cursor.execute('''
            UPDATE chats 
            SET status = 'archived'
            WHERE customer_id = %s AND status = 'active'
        ''', (user_id,))
        
        # Anonymize chefs ratings given by this customer
        cursor.execute('''
            UPDATE chef_ratings 
            SET review_text = '[Customer account deleted]',
                is_anonymous = TRUE,
                admin_notes = CONCAT('[Customer account deleted] ', COALESCE(admin_notes, ''))
            WHERE customer_id = %s
        ''', (user_id,))
        

@account_deletion_bp.route('/deletion_request', methods=['POST'])
def request_account_deletion():
    data = request.get_json()
    user_id= data.get('user_id')
    user_type = data.get('user_type') #chef/customer
    user_email = data.get('user_email')
    request_reason= data.get('reason', 'User requested account deletion')

    if user_type not in ['chef', 'customer']:
        return jsonify({'error': 'Invalid user type'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()

    if user_type == 'chef':
        cursor.execute('''
            SELECT email FROM chefs WHERE id = %s
        ''',(user_id,))
    else:
        cursor.execute('''
            SELECT email FROM customers WHERE id = %s
        ''',(user_id,))
    
    user = cursor.fetchone()
    if not user:
        cursor.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    #make sure no existing pending deletion request exists
    cursor.execute('''
        SELECT id, status, deletion_confirmation_code
        FROM user_deletion_requests
        WHERE user_id = %s AND user_type = %s AND status = 'pending'
    ''',(user_id,user_type))
    existing_request = cursor.fetchone()

    if existing_request:
        cursor.close()
        conn.close()
        return jsonify({'error': 'A deletion request is already pending for this account',
                'request_id': existing_request[0],
                'confirmation_code': existing_request[2]
        }), 409
    
    confirmation_code = generate_deletion_code()
    
    cursor.execute('''
        INSERT INTO user_deletion_requests
        (user_id, user_type, user_email, request_reason, status, 
        deletion_confirmation_code, requested_at)
        VALUES(%s, %s, %s, %s, 'completed', %s, now())
        RETURNING id
    ''', (user_id, user_type, user_email, request_reason, confirmation_code))
    
    request_id = cursor.fetchone()[0]
    
    
    anonymize_user_data(cursor, user_type, user_id)
    if user_type == 'chef':
        cursor.execute('DELETE FROM chefs WHERE id = %s', (user_id,))
    else:
        cursor.execute('DELETE FROM customers WHERE id = %s', (user_id,))

    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({
        'message': 'Account deletion submitted successfully',
        'request_id': request_id,
        'confirmation_code': confirmation_code,
    }), 201

    request_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'message': 'Account deletion request submitted successfully',
        'request_id': request_id,
        'confirmation_code': confirmation_code,
        'scheduled_deletion_date': scheduled_deletion_date.strftime('%Y-%m-%d'),
        'grace_period_days': 30,
        'note': 'You can cancel this request within 30 days using the confirmation code'
    }), 201


#==================================
#DELETION STATUS
#==================================

@account_deletion_bp.route('/user_deletion_requests', methods=['GET'])
def get_user_deletion_requests():
    try:
        user_type = request.args.get('user_type', '').lower()
        user_id = request.args.get('user_id', type=int)
        
        if not user_type or not user_id:
            return jsonify({'error': 'user_type and user_id are required'}), 400
        
        if user_type not in ['chef', 'customer']:
            return jsonify({'error': 'user_type must be "chef" or "customer"'}), 400
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        cursor.execute('''
            SELECT 
                id,
                user_type,
                user_email,
                request_reason,
                status,
                scheduled_deletion_date,
                actual_deletion_date,
                requested_at,
                completed_at
            FROM user_deletion_requests 
            WHERE user_type = %s AND user_id = %s
            ORDER BY requested_at DESC
        ''', (user_type, user_id))
        
        requests = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Format dates
        formatted_requests = []
        for req in requests:
            formatted_requests.append({
                'request_id': req['id'],
                'user_type': req['user_type'],
                'user_email': req['user_email'],
                'request_reason': req['request_reason'],
                'status': req['status'],
                'scheduled_deletion_date': req['scheduled_deletion_date'].isoformat() if req['scheduled_deletion_date'] else None,
                'actual_deletion_date': req['actual_deletion_date'].isoformat() if req['actual_deletion_date'] else None,
                'requested_at': req['requested_at'].isoformat() if req['requested_at'] else None,
                'completed_at': req['completed_at'].isoformat() if req['completed_at'] else None
            })
        
        return jsonify({
            'user_type': user_type,
            'user_id': user_id,
            'requests': formatted_requests,
            'total_requests': len(formatted_requests)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
