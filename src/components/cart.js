import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Fetch cart data on component mount
  useEffect(() => {
    const getData = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const cartResponse = await axios.get(`http://localhost:5000/cart/items?user_id=${userId}`);
          console.log(cartResponse.data)
          setCartItems(cartResponse.data);
          console.log(cartResponse)
        } catch (error) {
          console.error('Error fetching cart items:', error);
        }
      }
    };
    getData();
  }, []);

const updateQuantity = async (cartId, newQuantity) => {
  if (newQuantity <= 0) {
    await removeItem(cartId);
  } else {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.cart_id === cartId) {
          return { ...item, quantity: newQuantity }; // Update the quantity for the specific item
        }
        return item; // Leave other items unchanged
      });
      return updatedItems;
    });

    try {
      await axios.put('http://localhost:5000/cart/update', {
        cart_id: cartId,
        quantity: newQuantity
      });
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  }
};


  // Function to remove an item from the cart
const removeItem = async (itemId) => {
  console.log('Removing item with menu_item_id:', itemId);
  const userId = localStorage.getItem('userId');
  
  try {
    await axios.delete('http://localhost:5000/cart/remove', {
      headers: { 'Content-Type': 'application/json' },
      data: { menu_item_id: itemId, user_id: userId }
    });
    
    // After a successful backend response, update the state
    setCartItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
  } catch (error) {
    console.error('Error removing item from cart:', error);
  }
};

  // Calculate total price of items in the cart
  const total = cartItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQuantity = parseInt(item.quantity) || 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);

  // Navigate to checkout
  const handleProceedToCheckout = () => {
    navigate('/checkout', { state: { cartItems, total } });
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">Your Cart</h1>
        <ShoppingCart size={24} />
      </div>
      
      {cartItems.length === 0 ? (
        <p className="empty-cart-message">Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item,index) => (
              <div key={item.menu_item_id} className="cart-item">
                <div className="item-details">
                  <h3>{item.item_name}</h3>
                  <p className="item-price">${parseFloat(item.price).toFixed(2) || '0.00'}</p>
                </div>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.cart_id, (parseInt(item.quantity) || 1) - 1)}>
                    <Minus size={16} />
                  </button>
                  <span>{parseInt(item.quantity) || 1}</span>
                  <button onClick={() => updateQuantity(item.cart_id, (parseInt(item.quantity) || 1) + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <button className="remove-item" onClick={() => removeItem(item.menu_item_id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-total">
              <h3>Total:</h3>
              <h3>${total.toFixed(2)}</h3>
            </div>
            <button className="checkout-button" onClick={handleProceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
