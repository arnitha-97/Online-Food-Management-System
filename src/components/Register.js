import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/register', 
        { username, email, password }, 
        {
          headers: {
            'Content-Type': 'application/json'  // Specify JSON content type
          }
        }
      );
      setMessage(response.data.message);
      
      if (response.status === 201 && response.data.redirect) {
        navigate(response.data.redirect);
      }
    } catch (error) {
      setMessage('Registration failed, please try again.');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Register</h2>
      <form onSubmit={handleRegister} className="form-group">
        <input 
          type="text" 
          className="form-control mb-3" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          className="form-control mb-3" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          className="form-control mb-3" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" className="btn btn-primary btn-block">Register</button>
      </form>
      <p className="text-danger text-center">{message}</p>
    </div>
  );
};

export default Register;
