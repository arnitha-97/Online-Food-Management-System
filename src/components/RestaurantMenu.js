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

  const handleAddToCart = async (item) => {
    const userId = localStorage.getItem('userId');
    try {
      await axios.post('http://localhost:5000/cart/add', {
        user_id: userId,
        menu_item_id: item.menu_item_id,
        quantity: 1
      });
      setNotification('Item added to cart');
      setTimeout(() => setNotification(null), 3000);

      // Refresh cartItems to reflect changes
      const cartResponse = await axios.get(`http://localhost:5000/cart/items?user_id=${userId}`);
      setCartItems(cartResponse.data);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  return (
    <div className="restaurant-menu">
      <div className="menu-container">
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
              <div className="menu-item-content">
                <h3 className="item-name">{item.item_name}</h3>
                <p className="description">{item.description || "Description not available"}</p>
                <div className="item-details">
                  <p className="price">
                    {item.price != null && !isNaN(item.price) 
                      ? `$${Number(item.price).toFixed(2)}` 
                      : 'Price not available'}
                  </p>
                  <p className={`status ${item.availability?.toLowerCase() || 'unavailable'}`}>
                    {item.availability || 'Unavailable'}
                  </p>
                </div>
              </div>
              <button 
                className="add-to-cart"
                onClick={() => handleAddToCart(item)}
                disabled={item.availability?.toLowerCase() !== 'available'}
              >
                <Plus size={16} />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {notification && (
        <div className="notification">
          <p>{notification}</p>
          <div className="notification-buttons">
            <Link to="/cart" className="notification-button">View Cart</Link>
            <Link to="/checkout" className="notification-button">Proceed to Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
