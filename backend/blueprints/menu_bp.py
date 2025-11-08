"""
Blueprint for chef menu management
"""
from flask import Blueprint, request, jsonify
import psycopg2
import os
from werkzeug.utils import secure_filename
from database.config import db_config
from database.db_helper import get_db_connection

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu')

@menu_bp.route('/chef/<int:chef_id>', methods=['GET'])
def get_chef_menu(chef_id):
    """Get all menu items for a specific chef"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Get only available items by default, unless show_all=true
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        
        if show_all:
            cursor.execute("""
                SELECT id, chef_id, dish_name, description, photo_url,
                       servings, cuisine_type, dietary_info,
                       spice_level, is_available, is_featured, display_order, created_at,
                       price, prep_time, category_id
                FROM chef_menu_items
                WHERE chef_id = %s
                ORDER BY display_order, dish_name
            """, (chef_id,))
        else:
            cursor.execute("""
                SELECT id, chef_id, dish_name, description, photo_url,
                       servings, cuisine_type, dietary_info,
                       spice_level, is_available, is_featured, display_order, created_at,
                       price, prep_time, category_id
                FROM chef_menu_items
                WHERE chef_id = %s AND is_available = TRUE
                ORDER BY display_order, dish_name
            """, (chef_id,))
        
        rows = cursor.fetchall()
        
        menu_items = []
        for row in rows:
            menu_items.append({
                'id': row[0],
                'chef_id': row[1],
                'dish_name': row[2],
                'description': row[3],
                'photo_url': row[4],
                'servings': row[5],
                'cuisine_type': row[6],
                'dietary_info': row[7],
                'spice_level': row[8],
                'is_available': row[9],
                'is_featured': row[10],
                'display_order': row[11],
                'created_at': row[12].isoformat() if row[12] else None,
                'price': float(row[13]) if row[13] is not None else None,
                'prep_time': row[14],
                'category_id': row[15] if len(row) > 15 else None
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'chef_id': chef_id,
            'total_items': len(menu_items),
            'menu_items': menu_items
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/item/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Get a specific menu item by ID"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, chef_id, dish_name, description, photo_url,
                   servings, cuisine_type, dietary_info,
                   spice_level, is_available, display_order, created_at, updated_at,
                   price, prep_time
            FROM chef_menu_items
            WHERE id = %s
        """, (item_id,))
        
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'success': False, 'error': 'Menu item not found'}), 404
        
        item = {
            'id': row[0],
            'chef_id': row[1],
            'dish_name': row[2],
            'description': row[3],
            'photo_url': row[4],
            'servings': row[5],
            'cuisine_type': row[6],
            'dietary_info': row[7],
            'spice_level': row[8],
            'is_available': row[9],
            'display_order': row[10],
            'created_at': row[11].isoformat() if row[11] else None,
            'updated_at': row[12].isoformat() if row[12] else None,
            'price': float(row[13]) if row[13] else None,
            'prep_time': row[14]
        }
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'item': item}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/chef/<int:chef_id>', methods=['POST'])
def add_menu_item(chef_id):
    """Add a new menu item for a chef"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('dish_name'):
            return jsonify({'success': False, 'error': 'dish_name is required'}), 400
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if chef already has 15 items
        cursor.execute("""
            SELECT COUNT(*) FROM chef_menu_items WHERE chef_id = %s
        """, (chef_id,))
        count = cursor.fetchone()[0]
        
        if count >= 15:
            return jsonify({
                'success': False, 
                'error': 'Maximum 15 menu items allowed per chef'
            }), 400
        
        # Insert new menu item
        cursor.execute("""
            INSERT INTO chef_menu_items 
            (chef_id, dish_name, description, photo_url,
             servings, cuisine_type, dietary_info, spice_level, display_order,
             price, prep_time, category_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            chef_id,
            data.get('dish_name'),
            data.get('description'),
            data.get('photo_url'),
            data.get('servings'),
            data.get('cuisine_type'),
            data.get('dietary_info'),
            data.get('spice_level'),
            data.get('display_order', 0),
            data.get('price'),
            data.get('prep_time'),
            data.get('category_id')
        ))
        
        new_id = cursor.fetchone()[0]
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Menu item added successfully',
            'item_id': new_id
        }), 201
        
    except psycopg2.IntegrityError as e:
        if 'unique_chef_dish' in str(e):
            return jsonify({
                'success': False,
                'error': 'A dish with this name already exists for this chef'
            }), 400
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/item/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    """Update a menu item"""
    try:
        data = request.get_json()
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Build dynamic update query
        update_fields = []
        values = []
        
        allowed_fields = [
            'dish_name', 'description', 'photo_url', 'servings',
            'cuisine_type', 'dietary_info', 'spice_level', 
            'is_available', 'is_featured', 'display_order',
            'price', 'prep_time', 'category_id'
        ]
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        values.append(item_id)
        
        cursor.execute(f"""
            UPDATE chef_menu_items
            SET {', '.join(update_fields)}
            WHERE id = %s
        """, values)
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Menu item not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Menu item updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/item/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    """Delete a menu item"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM chef_menu_items WHERE id = %s
        """, (item_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Menu item not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Menu item deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/chef/<int:chef_id>/featured', methods=['GET'])
def get_featured_dishes(chef_id):
    """Get featured dishes for a chef (max 3 for profile display)
    If chef hasn't set featured dishes, automatically select first 3 by display_order
    """
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # First, try to get manually featured dishes
        cursor.execute("""
            SELECT id, chef_id, dish_name, description, photo_url,
                   servings, cuisine_type, dietary_info,
                   spice_level, is_available, is_featured, display_order,
                   price, prep_time
            FROM chef_menu_items
            WHERE chef_id = %s AND is_featured = TRUE AND is_available = TRUE
            ORDER BY display_order, dish_name
            LIMIT 3
        """, (chef_id,))
        
        rows = cursor.fetchall()
        
        # If no featured dishes set, automatically select first 3
        if not rows:
            cursor.execute("""
                SELECT id, chef_id, dish_name, description, photo_url,
                       servings, cuisine_type, dietary_info,
                       spice_level, is_available, is_featured, display_order,
                       price, prep_time
                FROM chef_menu_items
                WHERE chef_id = %s AND is_available = TRUE
                ORDER BY display_order, created_at, dish_name
                LIMIT 3
            """, (chef_id,))
            rows = cursor.fetchall()
        
        featured_dishes = []
        for row in rows:
            featured_dishes.append({
                'id': row[0],
                'chef_id': row[1],
                'dish_name': row[2],
                'description': row[3],
                'photo_url': row[4],
                'servings': row[5],
                'cuisine_type': row[6],
                'dietary_info': row[7],
                'spice_level': row[8],
                'is_available': row[9],
                'is_featured': row[10],
                'display_order': row[11],
                'price': float(row[12]) if row[12] else None,
                'prep_time': row[13]
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'chef_id': chef_id,
            'featured_items': featured_dishes,  # Changed from 'featured_dishes' to 'featured_items'
            'auto_selected': len(rows) > 0 and not rows[0][10]  # is_featured = False means auto-selected
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/chef/<int:chef_id>/featured', methods=['POST'])
def set_featured_dishes(chef_id):
    """Set featured dishes for a chef (max 3)"""
    try:
        data = request.get_json()
        item_ids = data.get('item_ids', [])
        
        if len(item_ids) > 3:
            return jsonify({
                'success': False,
                'error': 'Maximum 3 featured dishes allowed'
            }), 400
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # First, unset all featured dishes for this chef
        cursor.execute("""
            UPDATE chef_menu_items
            SET is_featured = FALSE
            WHERE chef_id = %s
        """, (chef_id,))
        
        # Then set the new featured dishes
        if item_ids:
            cursor.execute("""
                UPDATE chef_menu_items
                SET is_featured = TRUE
                WHERE id = ANY(%s) AND chef_id = %s
            """, (item_ids, chef_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Featured dishes updated ({len(item_ids)} dishes)'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== Menu Categories Management ====================

@menu_bp.route('/chef/<int:chef_id>/categories', methods=['GET'])
def get_menu_categories(chef_id):
    """Get all menu categories for a chef"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, chef_id, category_name, display_order, created_at
            FROM menu_categories
            WHERE chef_id = %s
            ORDER BY display_order, category_name
        """, (chef_id,))
        
        rows = cursor.fetchall()
        categories = []
        for row in rows:
            categories.append({
                'id': row[0],
                'chef_id': row[1],
                'category_name': row[2],
                'display_order': row[3],
                'created_at': row[4].isoformat() if row[4] else None
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/chef/<int:chef_id>/categories', methods=['POST'])
def create_menu_category(chef_id):
    """Create a new menu category"""
    try:
        data = request.get_json()
        category_name = data.get('category_name', '').strip()
        
        if not category_name:
            return jsonify({
                'success': False,
                'error': 'Category name is required'
            }), 400
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if category already exists
        cursor.execute("""
            SELECT id FROM menu_categories
            WHERE chef_id = %s AND LOWER(category_name) = LOWER(%s)
        """, (chef_id, category_name))
        
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Category with this name already exists'
            }), 400
        
        # Get max display_order
        cursor.execute("""
            SELECT COALESCE(MAX(display_order), 0) FROM menu_categories
            WHERE chef_id = %s
        """, (chef_id,))
        max_order = cursor.fetchone()[0]
        
        # Insert new category
        cursor.execute("""
            INSERT INTO menu_categories (chef_id, category_name, display_order)
            VALUES (%s, %s, %s)
            RETURNING id, category_name, display_order, created_at
        """, (chef_id, category_name, max_order + 1))
        
        row = cursor.fetchone()
        new_category = {
            'id': row[0],
            'chef_id': chef_id,
            'category_name': row[1],
            'display_order': row[2],
            'created_at': row[3].isoformat() if row[3] else None
        }
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'category': new_category
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_menu_category(category_id):
    """Update a menu category name"""
    try:
        data = request.get_json()
        category_name = data.get('category_name', '').strip()
        
        if not category_name:
            return jsonify({
                'success': False,
                'error': 'Category name is required'
            }), 400
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE menu_categories
            SET category_name = %s
            WHERE id = %s
            RETURNING id, chef_id, category_name, display_order
        """, (category_name, category_id))
        
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Category not found'
            }), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Category updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_menu_category(category_id):
    """Delete a menu category (sets items to NULL category)"""
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Set category_id to NULL for all items in this category
        cursor.execute("""
            UPDATE chef_menu_items
            SET category_id = NULL
            WHERE category_id = %s
        """, (category_id,))
        
        # Delete the category
        cursor.execute("""
            DELETE FROM menu_categories WHERE id = %s
            RETURNING id
        """, (category_id,))
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Category not found'
            }), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Category deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/item/<int:item_id>/category', methods=['PUT'])
def update_item_category(item_id):
    """Update the category of a menu item"""
    try:
        data = request.get_json()
        category_id = data.get('category_id')  # Can be None to uncategorize
        
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE chef_menu_items
            SET category_id = %s
            WHERE id = %s
            RETURNING id
        """, (category_id, item_id))
        
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Menu item not found'
            }), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Item category updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@menu_bp.route('/upload-photo', methods=['POST'])
def upload_menu_item_photo():
    """Upload photo for menu item"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
        
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Ensure directory exists
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        photo_dir = os.path.join(base_dir, 'static', 'menu_photos')
        os.makedirs(photo_dir, exist_ok=True)
        
        # Generate unique filename
        import time
        timestamp = int(time.time())
        extension = photo.filename.rsplit('.', 1)[-1]
        filename = secure_filename(f"menu_{timestamp}.{extension}")
        filepath = os.path.join(photo_dir, filename)
        
        # Save photo
        photo.save(filepath)
        
        photo_url = f"/static/menu_photos/{filename}"
        
        return jsonify({'photo_url': photo_url}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@menu_bp.route('/item/<int:item_id>/photo', methods=['POST'])
def upload_item_photo(item_id):
    """Upload and update menu item photo"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo uploaded'}), 400
        photo = request.files['photo']
        if photo.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Ensure directory exists (use absolute path)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        photo_dir = os.path.join(base_dir, 'static', 'item_photos')
        os.makedirs(photo_dir, exist_ok=True)

        filename = secure_filename(f"item_{item_id}.{photo.filename.rsplit('.', 1)[-1]}")
        filepath = os.path.join(photo_dir, filename)
        photo.save(filepath)

        photo_url = f"/static/item_photos/{filename}"

        # Update photo_url in database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE chef_menu_items SET photo_url = %s WHERE id = %s', (photo_url, item_id))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'photo_url': photo_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500