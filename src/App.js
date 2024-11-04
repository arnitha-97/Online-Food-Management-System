import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import RestaurantListing from './components/RestaurantListing';
import RestaurantMenu from './components/RestaurantMenu';
import Cart from './components/cart';
import Checkout from './components/Checkout';
import PaymentPage from './components/PaymentPage'; // Import PaymentPage
import './App.css';

const App = () => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.menu_item_id === item.menu_item_id);
      if (existingItem) {
        return prevItems.map(i => 
          i.menu_item_id === item.menu_item_id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/restaurants" element={<RestaurantListing cartItems={cartItems} />} />
          <Route 
            path="/restaurants/:restaurantId/menu" 
            element={<RestaurantMenu addToCart={addToCart} cartItems={cartItems} />} 
          />
          <Route 
            path="/cart" 
            element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} 
          />
          <Route 
            path="/checkout" 
            element={<Checkout cartItems={cartItems} total={calculateTotal()} clearCart={clearCart} />} 
          />
          <Route 
            path="/payment" // Add a route for the PaymentPage
            element={<PaymentPage />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
