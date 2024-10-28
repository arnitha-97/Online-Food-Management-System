import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import './Cart.css';

const Cart = ({ cartItems, setCartItems }) => {
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.menu_item_id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
  };

  const total = cartItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQuantity = parseInt(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);

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
            {cartItems.map(item => (
              <div key={item.menu_item_id} className="cart-item">
                <div className="item-details">
                  <h3>{item.item_name}</h3>
                  <p className="item-price">${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.menu_item_id, (parseInt(item.quantity) || 0) - 1)}>
                    <Minus size={16} />
                  </button>
                  <span>{parseInt(item.quantity) || 0}</span>
                  <button onClick={() => updateQuantity(item.menu_item_id, (parseInt(item.quantity) || 0) + 1)}>
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
            <button className="checkout-button">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;