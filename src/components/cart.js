import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]); // Initialize as an empty array
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const cartResponse = await axios.get(`http://localhost:5000/cart/items?user_id=${userId}`);
          setCartItems(Array.isArray(cartResponse.data) ? cartResponse.data : []); // Ensure cartItems is always an array
          const totalResponse = await axios.get(`http://localhost:5000/cart/total?user_id=${userId}`);
          setTotal(Number(totalResponse.data.total) || 0);
        } catch (error) {
          console.error('Error fetching cart data:', error);
          setCartItems([]); // Set as empty array in case of error
        }
      }
    };
    getData();
  }, []);

  const updateQuantity = async (cartId, newQuantity) => {
    const userId = localStorage.getItem('userId');
    if (newQuantity <= 0) {
      await removeItem(cartId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cart_id === cartId ? { ...item, quantity: newQuantity } : item
        )
      );

      try {
        await axios.put('http://localhost:5000/cart/update', {
          cart_id: cartId,
          quantity: newQuantity
        });

        const totalResponse = await axios.get(`http://localhost:5000/cart/total?user_id=${userId}`);
        setTotal(totalResponse.data.total);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }
  };

  const removeItem = async (itemId) => {
    const userId = localStorage.getItem('userId');
    try {
      await axios.delete('http://localhost:5000/cart/remove', {
        headers: { 'Content-Type': 'application/json' },
        data: { menu_item_id: itemId, user_id: userId }
      });

      setCartItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
      const totalResponse = await axios.get(`http://localhost:5000/cart/total?user_id=${userId}`);
      setTotal(totalResponse.data.total);
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

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
            {Array.isArray(cartItems) && cartItems.map((item) => (
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
              <h3>${Number(total).toFixed(2)}</h3>
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
