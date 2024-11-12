import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, ShoppingCart, Search } from 'lucide-react';
import './RestaurantListing.css';

const RestaurantListing = ({ cartItems = [] }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/restaurants');
        const formattedRestaurants = response.data.map((restaurant) => ({
          ...restaurant,
          rating: Number(restaurant.rating),
        }));
        setRestaurants(formattedRestaurants);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const handleOrderNowClick = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}/menu`);
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="restaurant-listing">
      <nav className="restaurant-nav">
        <div className="nav-content">
          <h1 className="nav-title">Food Delivery</h1>
          <div className="nav-icons">
            <Link to="/cart" className="nav-icon cart-icon">
              <ShoppingCart size={24} />
              {cartItems.length > 0 && (
                <span className="cart-count">{cartItems.length}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>
      <div className="main-content">
        <div className="search-container">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="restaurant-grid">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.restaurant_id} className="restaurant-card">
              <div className="restaurant-info">
                <h2 className="restaurant-name">{restaurant.name}</h2>
                <div className="restaurant-details">
                  <span className="restaurant-rating">
                    <Star size={16} className="icon" />
                    {restaurant.rating.toFixed(1)}
                  </span>
                </div>
                <p className="restaurant-location">
                  <MapPin size={16} className="icon" />
                  {restaurant.address}, {restaurant.city}
                </p>
                <button
                  className="order-button"
                  onClick={() => handleOrderNowClick(restaurant.restaurant_id)}
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantListing;
