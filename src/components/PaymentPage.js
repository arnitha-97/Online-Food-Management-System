import React, { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './PaymentPage.css'

export default function PaymentPage({ orderId }) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate(); // Initialize useNavigate

  const handleTrackOrder = async () => {
    try {
      setIsLoading(true);
      const order_id=localStorage.getItem('order_id')
      const response = await axios.get(`http://localhost:5000/order/${order_id}/track`);
      if (response.data.status) {
        // Navigate to OrderTrackingPage with the orderId
        navigate(`/order/${order_id}/track`, { 
    
        });
      }
    } catch (error) {
      console.error('Error tracking order:', error);
    } finally {
      setIsLoading(false);
    }
  }

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
              value="Pay Now"
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
  )
}
