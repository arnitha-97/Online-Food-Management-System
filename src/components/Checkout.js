import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiMapPin, FiPackage, FiLoader } from 'react-icons/fi';
import './Checkout.css';

const Checkout = ({ clearCart }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, total } = location.state || { cartItems: [], total: 0 };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get('http://localhost:5000/user/addresses', {
        params: { user_id: userId }
      });
      setAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddress(response.data[0].address_id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      alert('Could not load addresses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prevAddress => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const response = await axios.post('http://localhost:5000/user/address', {
        user_id: localStorage.getItem('userId'),
        ...newAddress
      });
      
      setAddresses([...addresses, response.data]);
      setSelectedAddress(response.data.address_id);
      setNewAddress({ address: '', city: '', state: '', postal_code: '', country: '' });
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again later.');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert('Please select an address before proceeding.');
      return;
    }
  
    setLoading(true);
    try {
      // Log the order details for debugging
      for (const item of cartItems) {
        const orderData = {
          user_id: localStorage.getItem('userId'),
          address_id: selectedAddress,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          total: item.price * item.quantity,
        };
        console.log("Order Data:", orderData); // Add this line to log the order data
        await axios.post('http://localhost:5000/order/create', orderData);
      }
  
      clearCart();
      navigate('/payment', { 
        state: { 
          total: total
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Order creation failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">
        <FiPackage className="icon" />
        Checkout
      </h1>
      <div className="checkout-content">
        <div className="address-section">
          <h2>
            <FiMapPin className="icon" />
            Delivery Address
          </h2>
          {loading ? (
            <div className="loading-state">
              <FiLoader className="spinner" />
              <p>Loading addresses...</p>
            </div>
          ) : (
            <>
              {addresses.length > 0 ? (
                <div className="existing-addresses">
                  <h3>Your Addresses</h3>
                  {addresses.map((addr) => (
                    <div key={addr.address_id} className="address-item">
                      <input
                        type="radio"
                        id={`address-${addr.address_id}`}
                        name="address"
                        value={addr.address_id}
                        checked={selectedAddress === addr.address_id}
                        onChange={() => setSelectedAddress(addr.address_id)}
                      />
                      <label htmlFor={`address-${addr.address_id}`}>
                        {addr.address}, {addr.city}, {addr.state} {addr.postal_code}, {addr.country}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-address">No addresses found. Please add a new address below.</p>
              )}
            </>
          )}
          <form onSubmit={handleAddressSubmit} className="new-address-form">
            <h3>Add New Address</h3>
            <div className="form-grid">
              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  value={newAddress.address}
                  onChange={handleAddressChange}
                  placeholder="Street Address"
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="city"
                  value={newAddress.city}
                  onChange={handleAddressChange}
                  placeholder="City"
                  required
                />
                <input
                  type="text"
                  name="state"
                  value={newAddress.state}
                  onChange={handleAddressChange}
                  placeholder="State"
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  name="postal_code"
                  value={newAddress.postal_code}
                  onChange={handleAddressChange}
                  placeholder="Postal Code"
                  required
                />
                <input
                  type="text"
                  name="country"
                  value={newAddress.country}
                  onChange={handleAddressChange}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
            <button type="submit" className="add-address-btn" disabled={addingAddress}>
              {addingAddress ? (
                <>
                  <FiLoader className="spinner" />
                  Adding...
                </>
              ) : (
                'Add Address'
              )}
            </button>
          </form>
        </div>
        <div className="order-summary">
          <h2>
            <FiShoppingBag className="icon" />
            Order Summary
          </h2>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.menu_item_id} className="cart-item">
                <div className="item-details">
                  <span className="item-name">{item.item_name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="total">
            <strong>Total:</strong>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="checkout-btn"
            disabled={loading || !selectedAddress}
          >
            {loading ? (
              <>
                <FiLoader className="spinner" />
                Placing Order...
              </>
            ) : (
              <>
                <FiShoppingBag className="icon" />
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;