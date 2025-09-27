# bookings.py
from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import datetime

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def bad_request(msg, code=400):
    return jsonify(error=msg), code

def write_history(cur, booking_id, actor_user_id, action, detail=None):
    cur.execute(
        """
        INSERT INTO booking_status_history (booking_id, actor_user_id, action, detail)
        VALUES (%s, %s, %s, %s)
        """,
        (booking_id, actor_user_id, action, detail)
    )

def fetch_one(cur, sql, params):
    cur.execute(sql, params)
    return cur.fetchone()

def fetch_all(cur, sql, params):
    cur.execute(sql, params)
    return cur.fetchall()

def to_dt(val):
    if isinstance(val, datetime):
        return val
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(val, fmt)
        except Exception:
            pass
    raise ValueError("Invalid datetime format, expected 'YYYY-MM-DD HH:MM'")

# -----------------------------
# POST /api/bookings  (pending)
# body: {customer_id, chef_id, start_time, end_time, notes?, actor_user_id}
# -----------------------------
@bookings_bp.route("", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    required = ["customer_id", "chef_id", "start_time", "end_time", "actor_user_id"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return bad_request(f"Missing field(s): {', '.join(missing)}")

    try:
        start_time = to_dt(data["start_time"])
        end_time   = to_dt(data["end_time"])
    except ValueError as e:
        return bad_request(str(e))

    if end_time <= start_time:
        return bad_request("end_time must be greater than start_time")

    customer_id   = int(data["customer_id"])
    chef_id       = int(data["chef_id"])
    notes         = data.get("notes")
    actor_user_id = int(data["actor_user_id"])  

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        # customer/chef exit
        if not fetch_one(cur, "SELECT id FROM customers WHERE id=%s", (customer_id,)):
            return bad_request("Invalid customer_id")
        if not fetch_one(cur, "SELECT id FROM chefs WHERE id=%s", (chef_id,)):
            return bad_request("Invalid chef_id")

        cur.execute("""
            SELECT 1 FROM bookings
             WHERE customer_id=%s
               AND status IN ('pending','accepted')
               AND start_time < %s AND end_time > %s
            LIMIT 1
        """, (customer_id, end_time, start_time))
        if cur.fetchone():
            return bad_request("Customer already has a booking in this time window")


        cur2 = conn.cursor()
        cur2.execute(
            """
            INSERT INTO bookings
              (customer_id, chef_id, start_time, end_time, status, notes)
            VALUES (%s, %s, %s, %s, 'pending', %s)
            """,
            (customer_id, chef_id, start_time, end_time, notes)
        )
        booking_id = cur2.lastrowid

        write_history(cur2, booking_id, actor_user_id, "create", "pending")
        conn.commit()

        return jsonify({"booking_id": booking_id, "status": "pending"}), 201

    except Error as e:
        print(" create_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# GET /api/bookings/<id>  
# -----------------------------
@bookings_bp.route("/<int:booking_id>", methods=["GET"])
def get_booking(booking_id):
    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT b.*, c.first_name AS customer_first_name, c.last_name AS customer_last_name,
                   ch.first_name AS chef_first_name, ch.last_name AS chef_last_name
              FROM bookings b
              JOIN customers c ON c.id=b.customer_id
              JOIN chefs ch     ON ch.id=b.chef_id
             WHERE b.id=%s
        """, (booking_id,))
        row = cur.fetchone()
        if not row:
            return bad_request("Booking not found", 404)
        return jsonify(row), 200
    except Error as e:
        print("get_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass


@bookings_bp.route("", methods=["GET"])
def list_bookings():
    role    = (request.args.get("role") or "").strip().lower()
    user_id = request.args.get("user_id")
    if role not in ("customer", "chef") or not user_id:
        return bad_request("Provide role=customer|chef and user_id")

    status = request.args.get("status")
    from_d = request.args.get("from")
    to_d   = request.args.get("to")
    order  = (request.args.get("order") or "desc").lower()
    order  = "ASC" if order == "asc" else "DESC"

    filters, params = [], []
    if role == "customer":
        filters.append("b.customer_id = %s")
    else:
        filters.append("b.chef_id = %s")
    params.append(int(user_id))

    if status:
        s = [s.strip() for s in status.split(",") if s.strip()]
        placeholders = ", ".join(["%s"]*len(s))
        filters.append(f"b.status IN ({placeholders})")
        params.extend(s)

    if from_d:
        filters.append("b.start_time >= %s")
        params.append(from_d + " 00:00:00")
    if to_d:
        filters.append("b.end_time <= %s")
        params.append(to_d + " 23:59:59")

    where = "WHERE " + " AND ".join(filters) if filters else ""
    sql = f"""
        SELECT b.*, c.first_name AS customer_first_name, c.last_name AS customer_last_name,
               ch.first_name AS chef_first_name, ch.last_name AS chef_last_name
          FROM bookings b
          JOIN customers c ON c.id=b.customer_id
          JOIN chefs ch     ON ch.id=b.chef_id
        {where}
        ORDER BY b.start_time {order}, b.id {order}
        LIMIT 500
    """

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)
        cur.execute(sql, tuple(params))
        return jsonify(cur.fetchall()), 200
    except Error as e:
        print("list_bookings:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/accept
# body: {actor_user_id}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/accept", methods=["POST"])
def accept_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    if not actor_user_id:
        return bad_request("Missing actor_user_id")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] not in ("pending",):
            return bad_request("Only pending bookings can be accepted")

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status='accepted', accepted_at=NOW(), accepted_by=%s
             WHERE id=%s
        """, (actor_user_id, booking_id))
        write_history(cur2, booking_id, actor_user_id, "accept", "accepted")
        conn.commit()
        return jsonify(message="accepted"), 200

    except Error as e:
        print("accept_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/reject
# body: {actor_user_id, reason?}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/reject", methods=["POST"])
def reject_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    reason        = data.get("reason")
    if not actor_user_id:
        return bad_request("Missing actor_user_id")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] not in ("pending",):
            return bad_request("Only pending bookings can be rejected")

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status='rejected'
             WHERE id=%s
        """, (booking_id,))
        write_history(cur2, booking_id, actor_user_id, "reject", reason or "rejected")
        conn.commit()
        return jsonify(message="rejected"), 200

    except Error as e:
        print("reject_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass

# -----------------------------
# POST /api/bookings/<id>/cancel
# body: {actor_user_id, reason?, actor_role: 'customer'|'chef'}
# -----------------------------
@bookings_bp.route("/<int:booking_id>/cancel", methods=["POST"])
def cancel_booking(booking_id):
    data = request.get_json(silent=True) or {}
    actor_user_id = data.get("actor_user_id")
    actor_role    = (data.get("actor_role") or "").strip().lower()
    reason        = data.get("reason")

    if not actor_user_id or actor_role not in ("customer", "chef"):
        return bad_request("Provide actor_user_id and actor_role = 'customer'|'chef'")

    try:
        conn = get_conn()
        cur  = conn.cursor(dictionary=True)

        row = fetch_one(cur, "SELECT id, status FROM bookings WHERE id=%s", (booking_id,))
        if not row:
            return bad_request("Booking not found", 404)
        if row["status"] in ("rejected","cancelled_by_customer","cancelled_by_chef","completed"):
            return bad_request("Booking already finalized; cannot cancel")

        new_status = "cancelled_by_customer" if actor_role == "customer" else "cancelled_by_chef"

        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE bookings
               SET status=%s, cancelled_at=NOW(), cancelled_by=%s, cancel_reason=%s
             WHERE id=%s
        """, (new_status, actor_user_id, reason, booking_id))
        action = "cancel_by_customer" if actor_role == "customer" else "cancel_by_chef"
        write_history(cur2, booking_id, actor_user_id, action, reason)
        conn.commit()
        return jsonify(message=new_status), 200

    except Error as e:
        print(" cancel_booking:", e)
        return bad_request("Internal server error", 500)
    finally:
        try:
            cur.close(); conn.close()
        except Exception:
            pass
