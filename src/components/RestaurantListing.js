import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, ShoppingCart, Search, ChevronDown } from 'lucide-react';
import './RestaurantListing.css';

const RestaurantListing = ({ cartItems = [] }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const ratingDropdownRef = useRef(null);
  const cuisineDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ratingDropdownRef.current && !ratingDropdownRef.current.contains(event.target)) {
        setShowRatingDropdown(false);
      }
      if (cuisineDropdownRef.current && !cuisineDropdownRef.current.contains(event.target)) {
        setShowCuisineDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/restaurants', {
        params: {
          minRating: selectedRating,
          cuisine: selectedCuisine
        }
      });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [selectedRating, selectedCuisine]);

  const handleOrderNowClick = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}/menu`);
  };

  const toggleRatingDropdown = (e) => {
    e.stopPropagation();
    setShowRatingDropdown(!showRatingDropdown);
    setShowCuisineDropdown(false);
  };

  const toggleCuisineDropdown = (e) => {
    e.stopPropagation();
    setShowCuisineDropdown(!showCuisineDropdown);
    setShowRatingDropdown(false);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4.5', label: '4.5 & Above' },
    { value: '4.0', label: '4.0 & Above' },
    { value: '3.5', label: '3.5 & Above' },
    { value: '3.0', label: '3.0 & Above' }
  ];

  const cuisineOptions = [
    { value: 'all', label: 'All Cuisines' },
    { value: '1', label: 'Italian' },
    { value: '2', label: 'American' },
    { value: '3', label: 'Japanese' },
    { value: '4', label: 'Chinese' },
    { value: '5', label: 'Mexican' },
    { value: '6', label: 'Indian' },
    { value: '7', label: 'French' },
    { value: '8', label: 'Thai' },
    { value: '9', label: 'Greek' },
    { value: '10', label: 'Spanish' },
    { value: '11', label: 'Middle Eastern' },
    { value: '12', label: 'Korean' },
    { value: '13', label: 'Vietnamese' }
  ];

  return (
    <div className="page-container">
      <div className="header">
        <h1>Food Delivery</h1>
        <Link to="/cart" className="cart-link">
          <ShoppingCart className="cart-icon" />
          {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
        </Link>
      </div>

      <div className="content">
        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-container">
          <div className="filter-group" ref={ratingDropdownRef}>
            <button 
              className="filter-button"
              onClick={toggleRatingDropdown}
            >
              <Star className="filter-icon" />
              <span>{selectedRating === 'all' ? 'All Ratings' : `${selectedRating}+ Stars`}</span>
              <ChevronDown className={`chevron ${showRatingDropdown ? 'rotate' : ''}`} />
            </button>
            {showRatingDropdown && (
              <div className="dropdown-menu">
                {ratingOptions.map(option => (
                  <button
                    key={option.value}
                    className={`dropdown-item ${selectedRating === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRating(option.value);
                      setShowRatingDropdown(false);
                    }}
                  >
                    {option.value !== 'all' && <Star className="star-icon" />}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filter-group" ref={cuisineDropdownRef}>
            <button 
              className="filter-button"
              onClick={toggleCuisineDropdown}
            >
              <span>{selectedCuisine === 'all' ? 'All Cuisines' : 
                cuisineOptions.find(c => c.value === selectedCuisine)?.label}</span>
              <ChevronDown className={`chevron ${showCuisineDropdown ? 'rotate' : ''}`} />
            </button>
            {showCuisineDropdown && (
              <div className="dropdown-menu">
                {cuisineOptions.map(option => (
                  <button
                    key={option.value}
                    className={`dropdown-item ${selectedCuisine === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCuisine(option.value);
                      setShowCuisineDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading restaurants...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurant_id} className="restaurant-card">
                <div className="restaurant-info">
                  <h2 className="restaurant-name">{restaurant.name}</h2>
                  <div className="restaurant-details">
                    <div className="rating">
                      <Star className="star-icon" />
                      <span>{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <div className="location">
                      <MapPin className="location-icon" />
                      <span>{restaurant.address}, {restaurant.city}</span>
                    </div>
                  </div>
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
        )}
      </div>
    </div>
  );
};

export default RestaurantListing;