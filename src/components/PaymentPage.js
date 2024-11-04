import React, { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import './PaymentPage.css'

export default function PaymentPage({ orderId }) {
  const [isLoading, setIsLoading] = useState(false)
  const [orderStatus, setOrderStatus] = useState('pending')

  const handleTrackOrder = async () => {
    try {
      setIsLoading(true)
      const response = await axios.post(`http://localhost:5000/order/${orderId}/track`)
      if (response.data.status) {
        setOrderStatus(response.data.status)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1 className="title">Scan to Pay</h1>
          <div className="status-badge">{orderStatus}</div>
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