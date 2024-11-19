import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import './PaymentPage.css';

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Initialize useLocation to access passed state
  const { orderId, total } = location.state || {}; // Destructure orderId and total from location.state

  useEffect(() => {
    console.log("Received orderId:", orderId, "and total:", total);
    if (!orderId || !total) {
      alert('Order details are missing.');
      navigate('/');
    }
  }, [orderId, total, navigate]);

  const handleTrackOrder = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem('order_id', orderId);
      navigate(`/order/${orderId}/track`);
    } catch (error) {
      console.error('Error tracking order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1 className="title">Scan to Pay</h1>
          <div className="status-badge">Pending</div>
        </div>

        <div className="qr-wrapper">
          <div className="qr-container">
            <QRCodeCanvas 
              value={`Pay Now: Order ${orderId}`} // Displaying orderId in the QR code value (or any other value)
              size={256}
              level="H"
              includeMargin={true}
            />
            <div className="qr-overlay"></div>
          </div>
        </div>

        <div className="instruction-container">
          <p className="instruction">
            Scan the QR code above with your mobile banking app to complete the payment
          </p>
          <div className="security-note">
            <span className="security-icon">🔒</span>
            Secure Payment Gateway
          </div>
        </div>

        <button 
          className={`track-button ${isLoading ? 'loading' : ''}`}
          onClick={handleTrackOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="spin-icon" />
              Updating Status...
            </>
          ) : (
            <>
              Track Your Order
              <ArrowRight className="button-icon" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
