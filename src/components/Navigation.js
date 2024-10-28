import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ cartItems, user }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/register';

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Toggle the dropdown when the profile icon is clicked
  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  if (isAuthPage) {
    return null; // Don't render anything on login or register pages
  }

  return (
    <nav className="menu-nav">
      <div className="nav-content">
        <Link to="/" className="nav-logo">
          Food Delivery
        </Link>
        <div className="nav-items">
          <div className="profile-dropdown" onClick={handleProfileClick}>
            <User size={24} className="profile-icon" />
            {showProfileDropdown && (
              <div className="profile-info">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            )}
          </div>
          <Link to="/cart" className="cart-icon">
            <ShoppingCart size={24} />
            {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
