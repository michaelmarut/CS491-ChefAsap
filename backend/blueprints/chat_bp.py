from flask import Blueprint, request, jsonify
from database.config import db_config
from database.db_helper import get_db_connection, get_cursor, handle_db_error

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


# Send Chat Message
@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json() or {}
    required = ['customer_id', 'chef_id', 'sender_type', 'message']
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify(error=f"Missing required field(s): {', '.join(missing)}"), 400
    
    customer_id = data['customer_id'] #from "users" table
    chef_id = data['chef_id'] #from "users" table
    booking_id = data.get('booking_id')  # Optional
    sender_type = data['sender_type']  # 'customer' or 'chef'
    message = data['message']
    sender_id = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        #customer_id and chef_id are orginally sent in as "user_id"

        #finds customer_id based on user_id
        cursor.execute("""
            SELECT customer_id FROM users
            WHERE id=%s
        """, (customer_id,))

        query = cursor.fetchone()

        if query:
            customer_id = query[0]
        else:
            customer_id = None

        #finds chef_id based on user_id
        cursor.execute("""
            SELECT chef_id FROM users
            WHERE id=%s
        """, (chef_id,))
        
        query = cursor.fetchone()

        if query:
            chef_id = query[0]
        else:
            chef_id = None

        #saves the correct id from chef/customer table
        sender_id = customer_id if sender_type == 'customer' else chef_id

        if not booking_id or booking_id == 0 or booking_id == 'null':
            booking_id= None
        else:
            booking_id = booking_id

        # First, find or create a chat session
        cursor.execute("""
            SELECT id FROM chats 
            WHERE customer_id = %s AND chef_id = %s 
            AND (booking_id = %s OR (booking_id IS NULL AND %s IS NULL))
        """, (customer_id, chef_id, booking_id, booking_id))
        
        chat_result = cursor.fetchone()
        
        if chat_result:
            chat_id = chat_result[0]
        else:
            # Create new chat session (PostgreSQL with RETURNING)
            cursor.execute("""
                INSERT INTO chats (customer_id, chef_id, booking_id) 
                VALUES (%s, %s, %s) RETURNING id
            """, (customer_id, chef_id, booking_id))
            chat_id = cursor.fetchone()[0]
        
        # Insert the message
        cursor.execute("""
            INSERT INTO chat_messages 
            (chat_id, sender_type, sender_id, message_text) 
            VALUES (%s, %s, %s, %s)
        """, (chat_id, sender_type, sender_id, message))
        
        # Update last message time in chats table
        cursor.execute("""
            UPDATE chats SET last_message_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """, (chat_id,))
        
        conn.commit()
        return jsonify(message="Message sent", chat_id=chat_id), 201

    except Exception as e:
        print("Error inserting message:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        cursor.close()
        conn.close()


# Get Chat History For Customer-Chef Booking
@chat_bp.route('/history', methods=['GET'])
def get_chat_history():
    customer_id = request.args.get('customer_id')
    chef_id = request.args.get('chef_id')
    booking_id = request.args.get('booking_id')

    missing = [
        p for p in ('customer_id', 'chef_id')
        if not request.args.get(p)
    ]
    if missing:
        return jsonify(error=f"Missing query param(s): {', '.join(missing)}"), 400

    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
       
        #finds customer_id based on user_id
        cursor.execute("""
            SELECT customer_id FROM users
            WHERE id=%s
        """, (customer_id,))

        query = cursor.fetchone()

        if query:
            customer_id = query['customer_id']
        else:
            customer_id = None

        #finds chef_id based on user_id
        cursor.execute("""
            SELECT chef_id FROM users
            WHERE id=%s
        """, (chef_id,))
        
        query = cursor.fetchone()

        if query:
            chef_id = query['chef_id']
        else:
            chef_id = None

        # Find the chat session
        cursor.execute("""
            SELECT id FROM chats 
            WHERE customer_id = %s AND chef_id = %s 
            AND (booking_id = %s OR (booking_id IS NULL AND %s IS NULL))
        """, (customer_id, chef_id, booking_id, booking_id))
        
        chat_result = cursor.fetchone()
        if not chat_result:
            return jsonify([]), 200  # No chat found, return empty array
        
        chat_id = chat_result['id']
        
        # Get messages for this chat
        cursor.execute("""
            SELECT cm.id as message_id, c.customer_id, c.chef_id, c.booking_id,
                   cm.sender_type, cm.message_text as message, cm.sent_at, cm.is_read
            FROM chat_messages cm
            JOIN chats c ON cm.chat_id = c.id
            WHERE cm.chat_id = %s
            ORDER BY cm.sent_at ASC
        """, (chat_id,))
        
        messages = cursor.fetchall()
        return jsonify(messages), 200

    except Exception as e:
        print("Error loading messages:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        cursor.close()
        conn.close()


# Get Bookings for Chat (completed bookings between customer and chef)
@chat_bp.route('/bookings', methods=['GET'])
def list_bookings():
    chef_id = request.args.get('chef_id')
    customer_id = request.args.get('customer_id')

    missing = [p for p in ('chef_id', 'customer_id') if not request.args.get(p)]
    if missing:
        return jsonify(error=f"Missing query param(s): {', '.join(missing)}"), 400

    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        cursor.execute("""
            SELECT
                id as booking_id,
                booking_date,
                booking_time,
                status,
                cuisine_type,
                meal_type,
                event_type,
                number_of_people
            FROM bookings
            WHERE chef_id     = %s
              AND customer_id = %s
              AND status IN ('accepted', 'completed')
            ORDER BY booking_date DESC, booking_time DESC
        """, (chef_id, customer_id))
        bookings = cursor.fetchall()
        return jsonify(bookings), 200

    except Exception as e:
        print("Error listing bookings:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        cursor.close()
        conn.close()


@chat_bp.route('/contacts', methods=['GET'])
def list_contacts():
    """
    If is_chef, pass chef_id -> returns customers they've chatted with.
    If is_customer, pass customer_id -> returns chefs they've chatted with.
    """
    chef_id = request.args.get('chef_id')
    customer_id = request.args.get('customer_id')
    if bool(chef_id) == bool(customer_id):
        return jsonify(error="Provide exactly one of chef_id or customer_id"), 400

    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)

        if chef_id:
            # fetch distinct customer IDs + names for this chef
            cursor.execute("""
                SELECT DISTINCT c.id as customer_id, c.first_name, c.last_name, c.email
                FROM chats ch
                JOIN customers c ON ch.customer_id = c.id
                WHERE ch.chef_id = %s
            """, (chef_id,))
        else:
            # fetch distinct chef IDs + names for this customer
            cursor.execute("""
                SELECT DISTINCT c.id as chef_id, c.first_name, c.last_name, c.email
                FROM chats ch
                JOIN chefs c ON ch.chef_id = c.id
                WHERE ch.customer_id = %s
            """, (customer_id,))

        rows = cursor.fetchall()
        # normalize into { id, name, email }
        contacts = [
            {
                "id": row.get('customer_id') or row.get('chef_id'),
                "name": f"{row['first_name']} {row['last_name']}",
                "email": row['email']
            }
            for row in rows
        ]
        return jsonify(contacts), 200

    except Exception as e:
        print("Error listing contacts:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        cursor.close()
        conn.close()


# Get recent conversations for a user (chef or customer)
@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """
    Get recent conversations with the last message for each chef-customer pair
    """
    print("=== CONVERSATIONS ENDPOINT CALLED ===")
    print("Full URL:", request.url)
    print("Query string:", request.query_string)
    print("All args:", request.args)
    
    chef_id = request.args.get('chef_id')
    customer_id = request.args.get('customer_id')

    print(f"Received: chef_id={chef_id}, customer_id={customer_id}")
    if bool(chef_id) == bool(customer_id):
        return jsonify(error="Provide exactly one of chef_id or customer_id"), 400

    cursor = None
    conn = None

    try:
        conn = get_db_connection()
        
        if chef_id:
            print(f"Looking up chef with user_id={chef_id}")
            #finds chef_id based on user_id
            cursor = conn.cursor()
            cursor.execute("""
                SELECT chef_id FROM users
                WHERE id=%s
            """, (chef_id,))
            
            query = cursor.fetchone()
            print(f"Found actual_chef_id: {query}")

            if query:
                chef_id = query[0]
            else:
                cursor.close()
                conn.close()
                return jsonify(error="Chef not found"), 404
            print(f"Found actual_chef_id: {chef_id}")
            cursor.close()

            # Get conversations for a chef
            cursor = get_cursor(conn, dictionary=True)                    
            
            cursor.execute("""
                SELECT 
                    c.id as chat_id,
                    c.customer_id,
                    u.id as customer_user_id,
                    cu.first_name as customer_first_name,
                    cu.last_name as customer_last_name,
                    cu.email as customer_email,
                    c.booking_id,
                    c.last_message_at,
                    (
                        SELECT cm.message_text 
                        FROM chat_messages cm 
                        WHERE cm.chat_id = c.id 
                        ORDER BY cm.sent_at DESC 
                        LIMIT 1
                    ) as last_message,
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm 
                        WHERE cm.chat_id = c.id 
                          AND cm.sender_type = 'customer' 
                          AND cm.is_read = FALSE
                    ) as unread_count
                FROM chats c
                JOIN customers cu ON c.customer_id = cu.id
                JOIN users u ON u.customer_id = cu.id
                WHERE c.chef_id = %s AND c.status = 'active'
                ORDER BY c.last_message_at DESC
            """, (chef_id,))
        else:
            #finds customer_id based on user_id
            print("=== CUSTOMER BRANCH ===")
            print(f"Looking up customer with user_id={customer_id}")
            cursor = conn.cursor()
            cursor.execute("""
                SELECT customer_id FROM users
                WHERE id=%s
            """, (customer_id,))

            query = cursor.fetchone()
            print(f"Customer lookup resultqq: {query}")
            if query:
                customer_id = query[0]
            else:
                cursor.close()
                conn.close()
                return jsonify(error="Customer not found"), 404
            print(f"Found actual_customer_id: {customer_id}")
            cursor.close()

            # Get conversations for a customer
            cursor = get_cursor(conn, dictionary=True)
            cursor.execute("""
                SELECT 
                    c.id as chat_id,
                    c.chef_id,
                    u.id as chef_user_id, 
                    ch.first_name as chef_first_name,
                    ch.last_name as chef_last_name,
                    ch.email as chef_email,
                    c.booking_id,
                    c.last_message_at,
                    (
                        SELECT cm.message_text 
                        FROM chat_messages cm 
                        WHERE cm.chat_id = c.id 
                        ORDER BY cm.sent_at DESC 
                        LIMIT 1
                    ) as last_message,
                    (
                        SELECT COUNT(*) 
                        FROM chat_messages cm 
                        WHERE cm.chat_id = c.id 
                          AND cm.sender_type = 'chef' 
                          AND cm.is_read = FALSE
                    ) as unread_count
                FROM chats c
                JOIN chefs ch ON c.chef_id = ch.id
                JOIN users u ON u.chef_id = ch.id
                WHERE c.customer_id = %s AND c.status = 'active'
                ORDER BY c.last_message_at DESC
            """, (customer_id,))

        conversations = cursor.fetchall()
        print(f"Found {len(conversations)} conversations")
        return jsonify(conversations), 200

    except Exception as e:
        print("Error getting conversations:", e)
        import traceback
        traceback.print_exc()
        return jsonify(error="Internal server error"), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Mark messages as read
@chat_bp.route('/mark-read', methods=['POST'])
def mark_messages_read():
    data = request.get_json() or {}
    required = ['chat_id', 'user_type']
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify(error=f"Missing required field(s): {', '.join(missing)}"), 400

    chat_id = data['chat_id']
    user_type = data['user_type']  # 'customer' or 'chef'

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Mark all messages as read for this conversation where the user is NOT the sender
        if user_type == 'chef':
            # Chef is reading, so mark customer messages as read
            cursor.execute("""
                UPDATE chat_messages 
                SET is_read = TRUE 
                WHERE chat_id = %s 
                  AND sender_type = 'customer'
                  AND is_read = FALSE
            """, (chat_id,))
        else:
            # Customer is reading, so mark chef messages as read
            cursor.execute("""
                UPDATE chat_messages 
                SET is_read = TRUE 
                WHERE chat_id = %s 
                  AND sender_type = 'chef'
                  AND is_read = FALSE
            """, (chat_id,))

        conn.commit()
        return jsonify(message="Messages marked as read"), 200

    except Exception as e:
        print("Error marking messages as read:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        cursor.close()
        conn.close()