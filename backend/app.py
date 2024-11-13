from flask import Flask, request, jsonify
import pymysql
from flask_cors import CORS
import logging
from decimal import Decimal


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
@app.route('/cart/items', methods=['GET'])
def get_cart_items():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = """
            SELECT c.cart_id, c.menu_item_id,mi.item_name, mi.description, o.price, c.quantity
            FROM cart c
            JOIN menu_items mi ON c.menu_item_id = mi.menu_item_id
            JOIN offers o ON c.menu_item_id = o.menu_item_id AND c.restaurant_id = o.restaurant_id
            WHERE c.user_id = %s
            """
            cursor.execute(sql, (user_id,))
            cart_items = cursor.fetchall()

            if not cart_items:
                return jsonify({'message': 'Cart is empty'}), 200

            return jsonify(cart_items), 200
    except Exception as e:
        logging.error(f"Error fetching cart items: {e}")
        return jsonify({'error': 'Failed to fetch cart items. Please try again later.'}), 500
    finally:
        connection.close()


@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.json
    user_id = data.get('user_id')
    menu_item_id = data.get('menu_item_id')
    quantity = data.get('quantity', 1)

    if not user_id or not menu_item_id or quantity < 1:
        return jsonify({'error': 'user_id, menu_item_id are required and quantity must be positive'}), 400

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Fetch the restaurant_id for the given menu_item_id
            cursor.execute("SELECT restaurant_id FROM offers WHERE menu_item_id = %s LIMIT 1", (menu_item_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({'error': 'Invalid menu item; no associated restaurant found'}), 400
            restaurant_id = result['restaurant_id']

            # Attempt to insert or update the item in the cart
            cursor.execute(
                """
                INSERT INTO cart (user_id, menu_item_id, restaurant_id, quantity)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE quantity = quantity + %s
                """,
                (user_id, menu_item_id, restaurant_id, quantity, quantity)
            )
            connection.commit()
        return jsonify({'message': 'Item added to cart', 'status': 202})
    except pymysql.MySQLError  as e:
        # Check if the error is due to the trigger enforcing a one-restaurant rule
        if e.args[0]==1644:  # This indicates the custom error signal from the trigger
            logging.error("One-restaurant constraint triggered: User tried to add items from different restaurants")
            return jsonify({'error': 'You can only add items from one restaurant to the cart at a time.'}),400
        else:
            logging.error(f"Error adding to cart: {e}")
            return jsonify({'error': str(e), 'status': 500})
    finally:
        connection.close()



@app.route('/cart/remove', methods=['DELETE'])
def remove_from_cart():
    data = request.json
    print(data)
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
        return jsonify({'message': 'Item removed from cart'}), 200
    except Exception as e:
        logging.error(f"Error removing from cart: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
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
            cursor.execute("UPDATE cart SET quantity = %s WHERE cart_id = %s", (quantity, cart_id))
            connection.commit()
        return jsonify({'message': 'Cart updated successfully'}), 200
    except Exception as e:
        logging.error(f"Error updating cart: {e}")
        return jsonify({'error': str(e)}), 500
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
    logging.debug(f"Received order data: {data}")

    required_fields = ['user_id', 'address_id', 'menu_item_id', 'quantity', 'total']
    if not all(field in data for field in required_fields):
        logging.error("Missing required fields in order data.")
        return jsonify({'error': 'Missing required fields'}), 400

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
            
            if not delivery_person:
                logging.error("No delivery persons available")
                return jsonify({'error': 'No delivery persons available'}), 503

            # Get restaurant_id for the menu item
            cursor.execute("""
                SELECT restaurant_id 
                FROM offers 
                WHERE menu_item_id = %s
            """, (int(data['menu_item_id'])))
            restaurant = cursor.fetchone()
            
            if not restaurant:
                logging.error("Restaurant not found for the given menu item")
                return jsonify({'error': 'Restaurant not found for the given menu item'}), 404

            # Create the order
            cursor.execute("""
                INSERT INTO orders (
                    user_id, restaurant_id, menu_item_id, delivery_person_id, 
                    total, order_status
                ) VALUES (%s, %s, %s, %s, %s, 'pending')
            """, (
                data['user_id'],
                restaurant['restaurant_id'],
                data['menu_item_id'],
                delivery_person['delivery_person_id'],
                data['total']
            ))
            order_id = cursor.lastrowid

            # Update delivery person status
            cursor.execute("""
                UPDATE delivery_person 
                SET status = 'assigned' 
                WHERE delivery_person_id = %s
            """, (int(delivery_person['delivery_person_id'])))

            cursor.execute(f"""
                SELECT order_id FROM orders where user_id={int(data['user_id'])} 
                and restaurant_id={int(restaurant['restaurant_id'])}
                and menu_item_id={int(data['menu_item_id'])}
                and delivery_person_id={int(delivery_person['delivery_person_id'])}
                and total={float(data['total'])}
                limit 1
                           """)
            order_id=cursor.fetchone()

            connection.commit()
            
            return jsonify({
                'message': 'Order created successfully',
                'order_id': order_id['order_id'],
                'payment_required': True,
                'status_code':200
            }), 201

    except Exception as e:
        logging.error(f"Error creating order: {e}")
        if connection:
            connection.rollback()
        return jsonify({'error': type(e)}), 500
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

@app.route('/order/<int:order_id>/status', methods=['GET', 'POST'])
def handle_order_status(order_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            if request.method == 'GET':
                # Get current order status
                cursor.execute("SELECT order_status FROM orders WHERE order_id = %s", (order_id,))
                order = cursor.fetchone()
                
                if not order:
                    return jsonify({'error': 'Order not found'}), 404
                
                return jsonify({'status': order['order_status']}), 200
            
            elif request.method == 'POST':
                # Update order status
                new_status = request.json.get('status')
                if not new_status:
                    return jsonify({'error': 'New status is required'}), 400
                
                valid_statuses = ['pending', 'preparing', 'out_for_delivery', 'delivered']
                if new_status not in valid_statuses:
                    return jsonify({'error': 'Invalid status'}), 400
                
                cursor.execute(
                    "UPDATE orders SET order_status = %s WHERE order_id = %s",
                    (new_status, order_id)
                )
                cursor.callproc('update_order_status_procedure', [order_id])
                connection.commit()
                
                return jsonify({'message': 'Order status updated successfully', 'status': new_status}), 200
    
    except Exception as e:
        logging.error(f"Error handling order status: {e}")
        return jsonify({'error': 'Failed to handle order status'}), 500
    finally:
        if connection:
            connection.close()

@app.route('/order/<int:order_id>/track', methods=['GET'])
def track_order(order_id):
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Fetch the current order status
            cursor.execute("""
                SELECT order_status
                FROM orders
                WHERE order_id = %s LIMIT 1
            """, (order_id,))
            
            order = cursor.fetchone()
            
            if not order:
                logging.error(f"Order {order_id} not found.")
                return jsonify({'error': 'Order not found'}), 404

            # Check if the order is already delivered or in a final state
            if order['order_status'] == 'delivered':
                return jsonify({'status': order['order_status']}), 200

            # Log and proceed to call the stored procedure
            logging.debug(f"Calling procedure for order {order_id} with current status: {order['order_status']}")
            cursor.callproc('update_order_status_procedure', [order_id])
            connection.commit()

            # Refresh the order status after calling the procedure
            cursor.execute("""
                SELECT order_status
                FROM orders
                WHERE order_id = %s LIMIT 1
            """, (order_id,))
            updated_order = cursor.fetchone()

            logging.debug(f"Updated order status for {order_id}: {updated_order['order_status']}")
            print(updated_order['order_status'])
            return jsonify(updated_order), 200
    
    except Exception as e:
        logging.error(f"Error tracking order: {e}")
        return jsonify({'error': 'Failed to track order'}), 500
    finally:
        if connection:
            connection.close()



if __name__ == '__main__':
    app.run(debug=True)



