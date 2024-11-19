from flask import Flask, request, jsonify
import pymysql
from flask_cors import CORS
import logging
from decimal import Decimal
import time


app = Flask(__name__)
CORS(app)  # Allow requests from localhost:3000
logging.basicConfig(level=logging.INFO)

def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='arni',
        password='password123',
        db='ofms',
        cursorclass=pymysql.cursors.DictCursor
    )

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    required_fields = ['username', 'email', 'password']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing fields'}), 400

    username, email, password = data['username'], data['email'], data['password']
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'message': 'User already exists!'}), 400
            cursor.execute(
                "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                (username, email, password)
            )
            connection.commit()
        return jsonify({'message': 'User registered successfully!', 'redirect': '/restaurants'}), 201
    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed. Please try again later.'}), 500
    finally:
        connection.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email, password = data.get('email'), data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id, email FROM users WHERE email = %s AND password = %s", (email, password))
            user = cursor.fetchone()
            if user:    
                user_id = user['user_id']
                email=user['email']  # Assuming the first column is user_id and the second is email
                print(user_id)
                return jsonify({'message': 'Login successful!', 'user_id': user_id, 'email': email}), 200
            else:
                return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed. Please try again later.'}), 500
    finally:
        connection.close()




@app.route('/restaurants', methods=['GET'])
def get_restaurants():
    min_rating = request.args.get('minRating', 'all')
    cuisine = request.args.get('cuisine', 'all')
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Base query with all necessary joins
            query = """
                SELECT 
                    r.restaurant_id,
                    r.name,
                    r.description,
                    r.cuisine_id,
                    c.name as cuisine_type,
                    rl.address,
                    rl.city,
                    COALESCE(ROUND(AVG(rv.rating), 1), 0) as rating
                FROM restaurants r
                LEFT JOIN cuisines c ON r.cuisine_id = c.cuisine_id
                LEFT JOIN restaurant_locations rl ON r.restaurant_id = rl.restaurant_id
                LEFT JOIN reviews rv ON r.restaurant_id = rv.restaurant_id
            """
            
            where_clauses = []
            params = []
            
            # Add cuisine filter
            if cuisine != 'all':
                where_clauses.append("r.cuisine_id = %s")
                params.append(int(cuisine))
            
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
            
            # Group by to handle the AVG aggregation
            query += """ 
                GROUP BY 
                    r.restaurant_id,
                    r.name,
                    r.description,
                    r.cuisine_id,
                    c.name,
                    rl.address,
                    rl.city
            """
            
            # Add rating filter after grouping
            if min_rating != 'all':
                query += " HAVING rating >= %s"
                params.append(float(min_rating))
            
            cursor.execute(query, params)
            restaurants = cursor.fetchall()
            
            return jsonify(restaurants)
            
    except Exception as e:
        logging.error(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if connection:
            connection.close()



@app.route('/restaurants/<int:restaurant_id>/menu', methods=['GET'])
def get_menu_items(restaurant_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
            SELECT mi.menu_item_id, mi.item_name, mi.description, 
                   o.price,
                   CASE WHEN o.is_available = 1 THEN 'Available' ELSE 'Not Available' END AS availability
            FROM menu_items mi
            JOIN offers o ON mi.menu_item_id = o.menu_item_id
            WHERE o.restaurant_id = %s
            """
            cursor.execute(sql, (restaurant_id,))
            return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.json
    user_id = data.get('user_id')
    menu_item_id = data.get('menu_item_id')
    restaurant_id = data.get('restaurant_id')  # Get restaurant_id from request
    quantity = data.get('quantity', 1)

    if not all([user_id, menu_item_id, restaurant_id, quantity > 0]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Verify the menu item belongs to the restaurant
            cursor.execute("""
                SELECT price, is_available 
                FROM offers 
                WHERE menu_item_id = %s AND restaurant_id = %s
            """, (menu_item_id, restaurant_id))
            
            offer = cursor.fetchone()
            if not offer:
                return jsonify({'error': 'Invalid menu item for this restaurant'}), 400
            
            if not offer['is_available']:
                return jsonify({'error': 'This item is currently unavailable'}), 400

            # Check if user has items from a different restaurant
            cursor.execute("""
                SELECT DISTINCT restaurant_id 
                FROM cart 
                WHERE user_id = %s AND restaurant_id != %s
            """, (user_id, restaurant_id))
            
            different_restaurant = cursor.fetchone()
            if different_restaurant:
                return jsonify({'error': 'You can only add items from one restaurant at a time. Please clear your cart first.'}), 400

            # Check if item already exists in cart
            cursor.execute("""
                SELECT cart_id, quantity 
                FROM cart 
                WHERE user_id = %s AND menu_item_id = %s AND restaurant_id = %s
            """, (user_id, menu_item_id, restaurant_id))
            
            existing_item = cursor.fetchone()

            if existing_item:
                # Update quantity if item exists
                new_quantity = existing_item['quantity'] + quantity
                cursor.execute("""
                    UPDATE cart 
                    SET quantity = %s 
                    WHERE cart_id = %s
                """, (new_quantity, existing_item['cart_id']))
            else:
                # Insert new item
                cursor.execute("""
                    INSERT INTO cart (user_id, menu_item_id, restaurant_id, quantity) 
                    VALUES (%s, %s, %s, %s)
                """, (user_id, menu_item_id, restaurant_id, quantity))

            connection.commit()

            # Get updated cart count
            cursor.execute("SELECT COUNT(*) as count FROM cart WHERE user_id = %s", (user_id,))
            cart_count = cursor.fetchone()['count']

            return jsonify({
                'message': 'Item added to cart successfully',
                'cartCount': cart_count
            }), 200

    except Exception as e:
        logging.error(f"Error adding to cart: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/cart/items', methods=['GET'])
def get_cart_items():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
            SELECT 
                c.cart_id,
                c.menu_item_id,
                c.restaurant_id,
                mi.item_name,
                mi.description,
                o.price,
                c.quantity
            FROM cart c
            JOIN menu_items mi ON c.menu_item_id = mi.menu_item_id
            JOIN offers o ON c.menu_item_id = o.menu_item_id 
                AND c.restaurant_id = o.restaurant_id
            WHERE c.user_id = %s
            ORDER BY c.cart_id
            """
            cursor.execute(sql, (user_id,))
            cart_items = cursor.fetchall()

            if not cart_items:
                return jsonify([]), 200

            # Convert decimal values to float for JSON serialization
            for item in cart_items:
                if 'price' in item:
                    item['price'] = float(item['price'])

            return jsonify(cart_items), 200
            
    except Exception as e:
        logging.error(f"Error fetching cart items: {e}")
        return jsonify({'error': 'Failed to fetch cart items. Please try again later.'}), 500
    finally:
        if connection:
            connection.close()

@app.route('/cart/update', methods=['PUT'])
def update_cart():
    data = request.json
    cart_id = data.get('cart_id')
    quantity = data.get('quantity')

    if not cart_id or quantity < 1:
        return jsonify({'error': 'cart_id is required and quantity must be positive'}), 400
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Verify cart item exists and get its details
            cursor.execute("""
                SELECT cart_id, user_id, menu_item_id, restaurant_id 
                FROM cart 
                WHERE cart_id = %s
            """, (cart_id,))
            cart_item = cursor.fetchone()
            
            if not cart_item:
                return jsonify({'error': 'Cart item not found'}), 404

            # Update the quantity
            cursor.execute("""
                UPDATE cart 
                SET quantity = %s 
                WHERE cart_id = %s
            """, (quantity, cart_id))
            
            connection.commit()
            return jsonify({'message': 'Cart updated successfully'}), 200

    except Exception as e:
        logging.error(f"Error updating cart: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/cart/remove', methods=['DELETE'])
def remove_from_cart():
    data = request.json
    menu_item_id = data.get('menu_item_id')
    user_id = data.get('user_id')

    if not menu_item_id or not user_id:
        logging.error(f"Missing data in request: menu_item_id={menu_item_id}, user_id={user_id}")
        return jsonify({'error': 'menu_item_id and user_id are required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM cart WHERE menu_item_id = %s AND user_id = %s", (menu_item_id, user_id))
            connection.commit()

            # Check if the cart is now empty
            cursor.execute("SELECT COUNT(*) as item_count FROM cart WHERE user_id = %s", (user_id,))
            cart_count = cursor.fetchone()['item_count']

            if cart_count == 0:
                # If cart is empty, we can optionally clear any associated data or flags
                # For example, if you have a user_restaurant table:
                # cursor.execute("DELETE FROM user_restaurant WHERE user_id = %s", (user_id,))
                # connection.commit()
                pass

        return jsonify({'message': 'Item removed from cart'}), 200
    except Exception as e:
        logging.error(f"Error removing from cart: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/cart/total', methods=['GET'])
def get_cart_total():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Use the calculate_cart_total function in MySQL to get the total
            cursor.execute("SELECT calculate_cart_total(%s) AS total", (user_id,))
            result = cursor.fetchone()
            total = result['total'] if result and result['total'] is not None else 0.00

        return jsonify({'total': total}), 200
    except Exception as e:
        logging.error(f"Error fetching cart total: {e}")
        return jsonify({'error': 'Failed to fetch cart total. Please try again later.'}), 500
    finally:
        connection.close()



@app.route('/user/addresses', methods=['GET'])
def get_addresses():
    user_id = request.args.get('user_id', type=int)  # Retrieve user_id from query parameter

    if not user_id:
        return jsonify({'error': 'Missing user ID'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM user_addresses WHERE user_id = %s", (user_id,))
            addresses = cursor.fetchall()
            return jsonify(addresses), 200
    except Exception as e:
        logging.error(f"Error fetching addresses: {e}")
        return jsonify({'error': 'Failed to fetch addresses. Please try again later.'}), 500
    finally:
        connection.close()

@app.route('/user/address', methods=['POST'])
def add_user_address():
    data = request.json
    required_fields = ['user_id', 'address', 'city', 'state', 'postal_code', 'country']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing fields'}), 400

    user_id, address, city, state, postal_code, country = (
        data['user_id'], data['address'], data['city'], data['state'],
        data['postal_code'], data['country']
    )
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO user_addresses (user_id, address, city, state, postal_code, country) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, address, city, state, postal_code, country)
            )
            connection.commit()
            new_id = cursor.lastrowid

            cursor.execute("SELECT * FROM user_addresses WHERE address_id = %s", (new_id,))
            new_address = cursor.fetchone()
        return jsonify(new_address), 201
    except Exception as e:
        logging.error(f"Error adding address: {e}")
        return jsonify({'error': 'Failed to add address. Please try again later.'}), 500
    finally:
        connection.close()

@app.route('/order/create', methods=['POST'])
def create_order():
    data = request.get_json()
    print(data)
    logging.debug(f"Received order data: {data}")

    required_fields = ['user_id', 'address_id']
    if not all(field in data for field in required_fields):
        logging.error("Missing required fields in order data.")
        return jsonify({'error': 'Missing required fields'}), 400

    user_id = data['user_id']
    address_id = data['address_id']
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Get available delivery person
            cursor.execute("""
                SELECT delivery_person_id 
                FROM delivery_person 
                WHERE status = 'available' 
                ORDER BY RAND() 
                LIMIT 1
            """)
            delivery_person = cursor.fetchone()
            logging.debug(f"Queried delivery_person: {delivery_person}")
            print(delivery_person)
            
            if not delivery_person:
                logging.error("No delivery persons available")
                return jsonify({'error': 'No delivery persons available'}), 503
            
            # Use the function to calculate the total cost for the cart
            cursor.execute(f"SELECT calculate_cart_total({user_id}) as Total")
            total_cost = round(float(cursor.fetchone()['Total']),2)
            print(total_cost)
            
            if total_cost is None or total_cost == 0:
                return jsonify({'error': 'Cart is empty'}), 400

            logging.debug(f"Total cost for the order: {total_cost}")

            # Get the restaurant_id from the cart (assuming all items are from the same restaurant)
            cursor.execute("""
                SELECT restaurant_id as r_id
                FROM cart 
                WHERE user_id = %s
                LIMIT 1
            """, (user_id,))
            restaurant_id = int(cursor.fetchone()['r_id'])
            print(restaurant_id)

            # Create the order
            cursor.execute(f"""
                INSERT INTO orders (
                    user_id, restaurant_id, address_id, delivery_person_id, 
                    total, order_status
                ) VALUES ({user_id}, {restaurant_id}, {address_id}, {delivery_person['delivery_person_id']}, {total_cost}, 'pending')
            """)
            order_id = cursor.lastrowid

            # Insert each item into order_items
            cursor.execute("""
                SELECT c.menu_item_id, quantity, price 
                FROM cart c
                JOIN offers o ON c.menu_item_id = o.menu_item_id AND c.restaurant_id = o.restaurant_id
                WHERE c.user_id = %s
            """%(user_id,))
            cart_items = cursor.fetchall()
            print(cart_items)


            for item in cart_items:
                cursor.execute("""
                    INSERT INTO order_items (order_id, menu_item_id, restaurant_id, quantity, price) 
                    VALUES (%s, %s, %s, %s, %s)
                """%(
                    order_id,
                    item['menu_item_id'],
                    restaurant_id,
                    item['quantity'],
                    item['price']
                ))

            # Clear the cart after order is placed
            cursor.execute("DELETE FROM cart WHERE user_id = %s"%(user_id,))

            # Update delivery person status
            cursor.execute("""
                UPDATE delivery_person 
                SET status = 'assigned' 
                WHERE delivery_person_id = %s
            """%(delivery_person['delivery_person_id'],))

            connection.commit()
            
            return jsonify({
                'message': 'Order created successfully',
                'order_id': order_id,
                'total_cost': total_cost,
                'payment_required': True
            }), 201

    except Exception as e:
        logging.error(f"Error creating order: {e}")
        if connection:
            connection.rollback()
        return jsonify({'error': 'Failed to create order'}), 500
    finally:
        if connection:
            connection.close()


@app.route('/order/<int:order_id>/pay', methods=['POST'])
def update_order_payment(order_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE orders SET payment_status= 'paid' WHERE order_id = %s",
                (order_id,)
            )
            connection.commit()
        return jsonify({'message': 'Payment successful'}), 200
    except Exception as e:
        logging.error(f"Error updating payment status: {e}")
        return jsonify({'error': 'Failed to update payment status'}), 500
    finally:
        connection.close()

@app.route('/order/<int:order_id>/status', methods=['GET'])
def get_order_status(order_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT order_status FROM orders WHERE order_id = %s", (order_id,))
            order = cursor.fetchone()
            if not order:
                return jsonify({'error': 'Order not found'}), 404
            return jsonify({'status': order['order_status']}), 200
    except Exception as e:
        logging.error(f"Error fetching order status: {e}")
        return jsonify({'error': 'Failed to fetch order status'}), 500
    finally:
        if connection:
            connection.close()

@app.route('/order/<int:order_id>/track', methods=['GET'])
def track_order(order_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Fetch the current order status
            cursor.execute("SELECT order_status FROM orders WHERE order_id = %s", (order_id,))
            order = cursor.fetchone()

            if not order:
                return jsonify({'error': 'Order not found'}), 404

            current_status = order['order_status']

            # Call the stored procedure only if the order is not yet delivered
            if current_status != 'delivered':
                cursor.callproc('update_order_status_procedure', [order_id])
                connection.commit()

                # Fetch the updated status after the procedure execution
                cursor.execute("SELECT order_status FROM orders WHERE order_id = %s", (order_id,))
                order = cursor.fetchone()

            # Return the status
            return jsonify({'status': order['order_status']}), 200
    except Exception as e:
        logging.error(f"Error tracking order: {e}")
        return jsonify({'error': 'Failed to track order'}), 500
    finally:
        if connection:
            connection.close()

