import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Login.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      setMessage(response.data.message);
      
      if (response.status === 200) {
        // Navigate to the RestaurantListing component on successful login
        navigate('/restaurants');
      }
    } catch (error) {
      setMessage('Invalid credentials, please try again.');
    }
  };

  return (
    <div className="container">
      <div className="logo">🍕</div>
      <h1 className="heading">Welcome to the Food Delivery App</h1>
      <form onSubmit={handleLogin} className="form">
        <label htmlFor="email" className="label">Email</label>
        <input
          type="email"
          className="input"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <label htmlFor="password" className="label">Password</label>
        <input
          type="password"
          className="input"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" className="btn">Login</button>
      </form>
      <p className="message">{message}</p>
      <p className="register-link">
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;
