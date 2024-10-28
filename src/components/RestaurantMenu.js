import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, ShoppingCart, Search } from 'lucide-react';
import './RestaurantMenu.css';

const RestaurantMenu = ({ addToCart, cartItems }) => {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/restaurants/${restaurantId}/menu`);
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };
    fetchMenuItems();
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (item) => {
    addToCart(item);
    setNotification('Item added to cart');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="restaurant-menu">
      <nav className="menu-nav">
        <h1 className="menu-title">Menu Items</h1>
        <Link to="/cart" className="cart-icon">
          <ShoppingCart size={24} />
          {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
        </Link>
      </nav>
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.menu_item_id} className="menu-item">
            <h3>{item.item_name}</h3>
            <p className="description">{item.description}</p>
            <p className="price">
              {item.price != null && !isNaN(item.price) 
                ? `$${Number(item.price).toFixed(2)}` 
                : 'Price not available'}
            </p>
            <p className={`status ${item.availability.toLowerCase()}`}>
              {item.availability}
            </p>
            <button className="add-to-cart" onClick={() => handleAddToCart(item)}>
              <Plus size={16} />
              Add to Cart
            </button>
          </div>
        ))}
      </div>
      {notification && (
        <div className="notification">
          {notification}
          <Link to="/cart" className="checkout-link">Proceed to Checkout</Link>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;