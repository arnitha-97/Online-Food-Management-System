import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import RestaurantListing from './components/RestaurantListing';
import RestaurantMenu from './components/RestaurantMenu';
import Cart from './components/cart';
import './App.css';

const App = () => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prevItems => [...prevItems, item]);
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
          <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;