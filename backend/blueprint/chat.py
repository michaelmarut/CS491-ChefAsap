# chat.py
from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

ALLOWED_ROLES = {"chef", "customer"}

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def bad_request(msg):
    return jsonify(error=msg), 400

# Send Chat Message
@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json(silent=True) or {}

    required = ['booking_id', 'sender_user_id', 'sender_role', 'message']
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        return bad_request(f"Missing required field(s): {', '.join(missing)}")

    booking_id = data['booking_id']
    sender_user_id = data['sender_user_id']
    sender_role = data['sender_role'].lower().strip()
    message = data['message']

    if sender_role not in ALLOWED_ROLES:
        return bad_request("sender_role must be 'chef' or 'customer'")

    try:
        conn = get_conn()
        cursor = conn.cursor()

        # Optional: ensure booking exists and sender belongs to booking
        cursor.execute("""
            SELECT b.booking_id, b.customer_id, b.chef_id
              FROM bookings b
             WHERE b.booking_id = %s
            """, (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            return bad_request("Invalid booking_id")

        _, customer_id, chef_id = booking
        # Sender must be either the chef or the customer on this booking
        if sender_role == "chef" and sender_user_id != chef_id:
            return bad_request("sender_user_id does not match the booking's chef")
        if sender_role == "customer" and sender_user_id != customer_id:
            return bad_request("sender_user_id does not match the booking's customer")

        cursor.execute(
            """
            INSERT INTO chat_messages
                (booking_id, sender_user_id, sender_role, message)
            VALUES (%s, %s, %s, %s)
            """,
            (booking_id, sender_user_id, sender_role, message)
        )
        conn.commit()
        return jsonify(message="Message sent"), 201

    except Error as e:
        print("Error inserting message:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


# Get Chat History for a booking
@chat_bp.route('/history', methods=['GET'])
def get_chat_history():
    booking_id = request.args.get('booking_id')

    if not booking_id:
        return bad_request("Missing query param: booking_id")

    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                m.message_id,
                m.booking_id,
                m.sender_user_id,
                m.sender_role,
                u.full_name AS sender_name,
                m.message,
                m.sent_at
            FROM chat_messages m
            JOIN users u ON u.id = m.sender_user_id
            WHERE m.booking_id = %s
            ORDER BY m.sent_at ASC, m.message_id ASC
            """,
            (booking_id,)
        )
        messages = cursor.fetchall()
        return jsonify(messages), 200

    except Error as e:
        print("Error loading messages:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


# List bookings for a chef+customer pair (optionally filter status)
@chat_bp.route('/bookings', methods=['GET'])
def list_bookings():
    chef_id = request.args.get('chef_id')
    customer_id = request.args.get('customer_id')
    status = request.args.get('status')  # optional: pending|confirmed|completed|canceled

    missing = [p for p in ('chef_id', 'customer_id') if not request.args.get(p)]
    if missing:
        return bad_request(f"Missing query param(s): {', '.join(missing)}")

    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)

        sql = """
            SELECT
                booking_id,
                scheduled_at,
                status
            FROM bookings
            WHERE chef_id = %s
              AND customer_id = %s
        """
        params = [chef_id, customer_id]
        if status:
            sql += " AND status = %s"
            params.append(status)

        sql += " ORDER BY scheduled_at DESC"

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return jsonify(rows), 200

    except Error as e:
        print("Error listing bookings:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


# Contacts list for a given user (returns the people they've chatted with)
@chat_bp.route('/contacts', methods=['GET'])
def list_contacts():
    """
    Provide exactly one: user_id and role (chef|customer).
    Returns distinct counterpart contacts the user has chatted with, with names.
    """
    user_id = request.args.get('user_id')
    role = (request.args.get('role') or "").lower().strip()

    if not user_id or role not in ALLOWED_ROLES:
        return bad_request("Provide user_id and role ('chef' or 'customer')")

    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)

        if role == "chef":
            # find customers this chef has chatted with
            cursor.execute("""
                SELECT DISTINCT
                    b.customer_id AS id,
                    u.full_name   AS name
                FROM chat_messages m
                JOIN bookings b ON b.booking_id = m.booking_id
                JOIN users u    ON u.id = b.customer_id
                WHERE b.chef_id = %s
                ORDER BY name ASC
            """, (user_id,))
        else:
            # find chefs this customer has chatted with
            cursor.execute("""
                SELECT DISTINCT
                    b.chef_id  AS id,
                    u.full_name AS name
                FROM chat_messages m
                JOIN bookings b ON b.booking_id = m.booking_id
                JOIN users u    ON u.id = b.chef_id
                WHERE b.customer_id = %s
                ORDER BY name ASC
            """, (user_id,))

        contacts = cursor.fetchall()
        return jsonify(contacts), 200

    except Error as e:
        print("Error listing contacts:", e)
        return jsonify(error="Internal server error"), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
