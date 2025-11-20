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
    deletion_type = data.get('delete_type') #soft_delete/hard_delete/anonymize 
    request_reason= data.get('reason', '')

    if user_type not in ['chef', 'customer']:
        return jsonify({'error': 'Invalid user type'}), 400
    
    if deletion_type not in ['soft_delete', 'hard_delete', 'anonymize']:
        return jsonify({'error': 'Invalid deletion type'}), 400
    
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

    if deletion_type == 'hard_delete':
        cursor.execute('''
        INSERT INTO user_deletion_requests
        (user_id, user_type, user_email, request_reason, status, deletion_type, 
        deletion_confirmation_code, requested_at)
        VALUES(%s, %s, %s, %s, 'completed', %s, %s, now())
        RETURNING id
    ''', (user_id, user_type, user_email, request_reason, deletion_type, confirmation_code))
        
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

@account_deletion_bp.route('/confirm_deletion', methods=['POST'])
def confirm_account_deletion():
    try:
        data = request.get_json()
        
        if not data or 'request_id' not in data or 'confirmation_code' not in data:
            return jsonify({'error': 'request_id and confirmation_code are required'}), 400
        
        request_id = data['request_id']
        confirmation_code = data['confirmation_code'].upper()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get deletion request
        cursor.execute('''
            SELECT user_type, user_id, user_email, status, deletion_type, deletion_confirmation_code
            FROM user_deletion_requests 
            WHERE id = %s
        ''', (request_id,))
        
        deletion_request = cursor.fetchone()
        
        if not deletion_request:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Deletion request not found'}), 404
        
        user_type, user_id, user_email, status, deletion_type, stored_code = deletion_request
        
        # Validate confirmation code
        if stored_code != confirmation_code:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid confirmation code'}), 403
        
        # Check if already processed
        if status != 'pending':
            cursor.close()
            conn.close()
            return jsonify({'error': f'Deletion request already {status}'}), 409
        
        # Update request status to in_progress
        cursor.execute('''
            UPDATE user_deletion_requests 
            SET status = 'in_progress', started_at = NOW()
            WHERE id = %s
        ''', (request_id,))
        
        try:
            # Perform deletion based on deletion_type
            if deletion_type == 'anonymize':
                # Anonymize user data in preserved tables
                anonymize_user_data(cursor, user_type, user_id)
                
                # Delete from main user tables (cascades will handle related tables)
                if user_type == 'chef':
                    cursor.execute('DELETE FROM chefs WHERE id = %s', (user_id,))
                else:
                    cursor.execute('DELETE FROM customers WHERE id = %s', (user_id,))
                
            elif deletion_type == 'hard_delete':
                # First anonymize preserved data
                anonymize_user_data(cursor, user_type, user_id)
                
                # Then hard delete the user (cascades handle most tables)
                if user_type == 'chef':
                    cursor.execute('DELETE FROM chefs WHERE id = %s', (user_id,))
                else:
                    cursor.execute('DELETE FROM customers WHERE id = %s', (user_id,))
                
            else:  # soft_delete (default)
                # Anonymize preserved data
                anonymize_user_data(cursor, user_type, user_id)
                
                # Mark user as deleted but keep record
                if user_type == 'chef':
                    cursor.execute('''
                        UPDATE chefs 
                        SET email = %s, 
                            first_name = 'Deleted',
                            last_name = 'User',
                            phone = NULL,
                            description = '[Account deleted]',
                            photo_url = NULL,
                            updated_at = NOW()
                        WHERE id = %s
                    ''', (f'deleted_chef_{user_id}@anonymized.local', user_id))
                else:
                    cursor.execute('''
                        UPDATE customers 
                        SET email = %s,
                            first_name = 'Deleted',
                            last_name = 'User',
                            phone = NULL,
                            allergy_notes = NULL,
                            photo_url = NULL,
                            updated_at = NOW()
                        WHERE id = %s
                    ''', (f'deleted_customer_{user_id}@anonymized.local', user_id))
            
            # Delete from users authentication table
            cursor.execute('''
                DELETE FROM users 
                WHERE user_type = %s AND 
                      (chef_id = %s OR customer_id = %s)
            ''', (user_type, user_id, user_id))
            
            # Update deletion request status
            cursor.execute('''
                UPDATE user_deletion_requests 
                SET status = 'completed', 
                    actual_deletion_date = CURRENT_DATE,
                    completed_at = NOW()
                WHERE id = %s
            ''', (request_id,))
            
            conn.commit()
            
            return jsonify({
                'message': 'Account deleted successfully',
                'request_id': request_id,
                'user_type': user_type,
                'deletion_type': deletion_type,
                'deleted_at': datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            # Update request status to failed
            cursor.execute('''
                UPDATE user_deletion_requests 
                SET status = 'failed', 
                    admin_notes = %s
                WHERE id = %s
            ''', (str(e), request_id))
            conn.commit()
            raise e
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@account_deletion_bp.route('/cancel_deletion', methods=['POST'])
def cancel_deletion_request():
    try:
        data = request.get_json()
        
        if not data or 'request_id' not in data or 'confirmation_code' not in data:
            return jsonify({'error': 'request_id and confirmation_code are required'}), 400
        
        request_id = data['request_id']
        confirmation_code = data['confirmation_code'].upper()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get deletion request
        cursor.execute('''
            SELECT status, deletion_confirmation_code
            FROM user_deletion_requests 
            WHERE id = %s
        ''', (request_id,))
        
        deletion_request = cursor.fetchone()
        
        if not deletion_request:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Deletion request not found'}), 404
        
        status, stored_code = deletion_request
        
        # Validate confirmation code
        if stored_code != confirmation_code:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid confirmation code'}), 403
        
        # Check if request can be cancelled
        if status != 'pending':
            cursor.close()
            conn.close()
            return jsonify({'error': f'Cannot cancel request with status: {status}'}), 409
        
        # Cancel the request
        cursor.execute('''
            UPDATE user_deletion_requests 
            SET status = 'cancelled', completed_at = NOW()
            WHERE id = %s
        ''', (request_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Deletion request cancelled successfully',
            'request_id': request_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#==================================
#DELETION STATUS
#==================================
@account_deletion_bp.route('/deletion_status/<int:request_id>', methods=['GET'])
def get_deletion_status(request_id):
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        cursor.execute('''
            SELECT 
                id,
                user_type,
                user_email,
                request_reason,
                status,
                deletion_type,
                scheduled_deletion_date,
                actual_deletion_date,
                requested_at,
                started_at,
                completed_at,
                admin_notes
            FROM user_deletion_requests 
            WHERE id = %s
        ''', (request_id,))
        
        request_data = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not request_data:
            return jsonify({'error': 'Deletion request not found'}), 404
        
        # Format dates
        response_data = {
            'request_id': request_data['id'],
            'user_type': request_data['user_type'],
            'user_email': request_data['user_email'],
            'request_reason': request_data['request_reason'],
            'status': request_data['status'],
            'deletion_type': request_data['deletion_type'],
            'scheduled_deletion_date': request_data['scheduled_deletion_date'].isoformat() if request_data['scheduled_deletion_date'] else None,
            'actual_deletion_date': request_data['actual_deletion_date'].isoformat() if request_data['actual_deletion_date'] else None,
            'requested_at': request_data['requested_at'].isoformat() if request_data['requested_at'] else None,
            'started_at': request_data['started_at'].isoformat() if request_data['started_at'] else None,
            'completed_at': request_data['completed_at'].isoformat() if request_data['completed_at'] else None,
            'admin_notes': request_data['admin_notes']
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
                deletion_type,
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
                'deletion_type': req['deletion_type'],
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
