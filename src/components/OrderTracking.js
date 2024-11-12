import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Package, Truck, CheckCircle, Loader } from 'lucide-react';
import './OrderTracking.css';

const statusIcons = {
  pending: Package,
  preparing: Loader,
  out_for_delivery: Truck,
  delivered: CheckCircle,
};

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await axios.get(`/order/${orderId}/track`);
        setOrderData(response.data);
      } catch (error) {
        setError('Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };

    // Poll every 5 seconds
    const intervalId = setInterval(fetchOrderData, 5000);
    fetchOrderData(); // Initial call

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [orderId]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!orderData) return <p>No order data available</p>;

  const { order_status: status, restaurant_name, item_name, delivery_person_name } = orderData;
  const StatusIcon = statusIcons[status] || Package;

  return (
    <div className="order-tracking-page">
      <h2>Order Tracking for Order #{orderId}</h2>
      <div className="order-details">
        <div className="status-section">
          <StatusIcon className="status-icon" />
          <p>Status: <strong>{status.replace('_', ' ')}</strong></p>
        </div>
        <div className="restaurant-info">
          <p><strong>Restaurant:</strong> {restaurant_name}</p>
          <p><strong>Item:</strong> {item_name}</p>
          <p><strong>Delivery Person:</strong> {delivery_person_name || 'Not assigned'}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
