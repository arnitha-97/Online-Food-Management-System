// ProfileDropdown.js
import React, { useState, useEffect } from 'react';

const ProfileDropdown = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; // Redirect to login page after logout
  };

  if (!user) return null; // Don't show the dropdown if user is not logged in

  return (
    <div className="profile-dropdown">
      <button className="profile-button">
        {user.username || user.email} ▼
      </button>
      <div className="profile-menu">
        <p>Email: {user.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
