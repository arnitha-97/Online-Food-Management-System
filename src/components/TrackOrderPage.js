import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState(); // Get order ID from the URL
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        setOrderId(localStorage.getItem('order_id'))
        const response = await axios.get(`http://localhost:5000/order/${localStorage.getItem('order_id')}/status`);
        console.log(response)
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
    }, 5000); // fetch every 5 seconds

    return () => clearInterval(intervalId);
  }, [orderId]);

  return (
    <div>
      <h2>Order Status for Order #{orderId}: {status}</h2>
    </div>
  );
}
