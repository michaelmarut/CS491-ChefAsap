from flask import Blueprint, request, jsonify
from database.db_helper import get_db_connection, get_cursor

# Create the blueprint
agreement_bp = Blueprint('agreement', __name__)

@agreement_bp.route('/active', methods=['GET'])
def get_active_agreement():
    """Get the currently active Terms of Service agreement"""
    conn = None
    cursor = None
    try:
        user_type = request.args.get('user_type', 'all')
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        cursor.execute('''
            SELECT id, title, content, version, effective_date, applicable_to
            FROM agreements 
            WHERE agreement_type = 'terms_of_service'
            AND is_active = TRUE 
            AND is_required = TRUE 
            AND (applicable_to = %s OR applicable_to = 'all')
            AND effective_date <= CURRENT_DATE 
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (user_type,))
        
        agreement = cursor.fetchone()
        
        if not agreement:
            return jsonify({'error': 'No active agreement found'}), 404
        
        return jsonify(agreement), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@agreement_bp.route('/check-acceptance', methods=['GET'])
def check_agreement_acceptance():
    """Check if a user has accepted the current agreement"""
    conn = None
    cursor = None
    try:
        user_id = request.args.get('user_id')
        user_type = request.args.get('user_type')
        
        if not user_id or not user_type:
            return jsonify({'error': 'user_id and user_type are required'}), 400
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Get active agreement
        cursor.execute('''
            SELECT id FROM agreements 
            WHERE agreement_type = 'terms_of_service'
            AND is_active = TRUE 
            AND is_required = TRUE 
            AND (applicable_to = %s OR applicable_to = 'all')
            AND effective_date <= CURRENT_DATE 
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (user_type,))
        
        agreement = cursor.fetchone()
        if not agreement:
            return jsonify({'has_accepted': True, 'message': 'No active agreement'}), 200
        
        # Check if user has accepted this agreement
        cursor.execute('''
            SELECT id, accepted_at 
            FROM user_agreement_acceptances 
            WHERE agreement_id = %s 
            AND user_type = %s 
            AND user_id = %s
        ''', (agreement['id'], user_type, user_id))
        
        acceptance = cursor.fetchone()
        
        if acceptance:
            return jsonify({
                'has_accepted': True,
                'accepted_at': acceptance['accepted_at']
            }), 200
        else:
            return jsonify({
                'has_accepted': False,
                'agreement_id': agreement['id']
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@agreement_bp.route('/accept', methods=['POST'])
def accept_agreement():
    """Record user's acceptance of an agreement"""
    conn = None
    cursor = None
    try:
        data = request.get_json()
        agreement_id = data.get('agreement_id')
        user_type = data.get('user_type')
        user_id = data.get('user_id')
        user_email = data.get('user_email')
        
        if not all([agreement_id, user_type, user_id, user_email]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Get IP address and user agent
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        # Insert acceptance record
        cursor.execute('''
            INSERT INTO user_agreement_acceptances 
            (agreement_id, user_type, user_id, user_email, ip_address, user_agent, acceptance_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (agreement_id, user_type, user_id) 
            DO NOTHING
        ''', (agreement_id, user_type, user_id, user_email, ip_address, user_agent, 'update_prompt'))
        
        conn.commit()
        
        return jsonify({'message': 'Agreement accepted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
