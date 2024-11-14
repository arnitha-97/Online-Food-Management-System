import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, ShoppingCart, Search } from 'lucide-react';
import './RestaurantMenu.css';

export default function RestaurantMenu({ addToCart, cartItems, setCartItems }) {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/restaurants/${restaurantId}/menu`);
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setNotification('Failed to load menu items');
      }
    };
    fetchMenuItems();
  }, [restaurantId]);

  const handleAddToCart = async (item) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setNotification('Please login to add items to cart');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/cart/add', {
        user_id: userId,
        menu_item_id: item.menu_item_id,
        restaurant_id: parseInt(restaurantId),
        quantity: 1
      });

      if (response.status === 200 || response.status === 202) {
        // Refresh cart items
        const cartResponse = await axios.get(`http://localhost:5000/cart/items?user_id=${userId}`);
        setCartItems(cartResponse.data);
        setNotification('Item added to cart successfully');
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      if (error.response?.data?.error) {
        setNotification(error.response.data.error);
      } else {
        setNotification('Error adding item to cart');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="restaurant-menu">
      <div className="menu-container">
        <nav className="menu-nav">
          <div className="menu-nav-content">
            <h1 className="menu-title">Menu Items</h1>
            <Link to="/cart" className="cart-icon">
              <ShoppingCart size={24} />
              {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
            </Link>
          </div>
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
              <div className="menu-item-content">
                <h3 className="item-name">{item.item_name}</h3>
                <p className="description">{item.description || "Description not available"}</p>
                <div className="item-details">
                  <p className="price">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                  <p className={`status ${item.availability?.toLowerCase() || 'unavailable'}`}>
                    {item.availability || 'Unavailable'}
                  </p>
                </div>
              </div>
              <button 
                className="add-to-cart"
                onClick={() => handleAddToCart(item)}
                disabled={loading || item.availability?.toLowerCase() !== 'available'}
              >
                <Plus size={16} />
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {notification && (
          <div className="notification">
            <p>{notification}</p>
            <div className="notification-buttons">
              <Link to="/cart" className="notification-button">View Cart</Link>
              <button onClick={() => setNotification(null)} className="notification-button">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}