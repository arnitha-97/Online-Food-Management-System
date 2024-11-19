import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PageContainer = ({ children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    fontFamily: 'Arial, sans-serif',
  }}>
    {children}
  </div>
);

const OrderCard = ({ children }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
  }}>
    {children}
  </div>
);

const Title = ({ children }) => (
  <h1 style={{
    color: '#2c3e50',
    fontSize: '2rem',
    marginBottom: '1rem',
  }}>
    {children}
  </h1>
);

const OrderNumber = ({ children }) => (
  <h2 style={{
    color: '#34495e',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  }}>
    {children}
  </h2>
);

const StatusText = ({ children }) => (
  <p style={{
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: '1rem',
  }}>
    {children}
  </p>
);

const LoadingSpinner = () => (
  <div style={{
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  }} />
);

export default function TrackOrderPage() {
  const [status, setStatus] = useState('Loading...');
  const [nextStatus, setNextStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const statusDelay = 5000;

  useEffect(() => {
    const storedOrderId = localStorage.getItem('order_id');
    if (storedOrderId) {
      setOrderId(storedOrderId);
    }
  }, []);

  useEffect(() => {
    let intervalId;

    const fetchOrderStatus = async () => {
      if (!orderId) return;

      try {
        const response = await axios.get(`http://localhost:5000/order/${orderId}/track`);
        const fetchedStatus = response.data.status;

        if (fetchedStatus === 'delivered') {
          setNextStatus('delivered');
          setIsPolling(false);
          clearInterval(intervalId);
          return;
        }

        if (fetchedStatus !== status && fetchedStatus !== nextStatus) {
          setNextStatus(fetchedStatus);
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
        setStatus('Error fetching status');
      }
    };

    if (isPolling && orderId) {
      intervalId = setInterval(fetchOrderStatus, statusDelay);
    }

    return () => clearInterval(intervalId);
  }, [orderId, status, nextStatus, isPolling]);

  useEffect(() => {
    if (nextStatus) {
      const timer = setTimeout(() => {
        setStatus(nextStatus);
        setNextStatus(null);
      }, statusDelay);

      return () => clearTimeout(timer);
    }
  }, [nextStatus]);

  if (!orderId) {
    return (
      <PageContainer>
        <OrderCard>
          <Title>No Order Found</Title>
          <StatusText>Please place an order first.</StatusText>
        </OrderCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <OrderCard>
        <Title>Order Status</Title>
        <OrderNumber>Order #{orderId}</OrderNumber>
        {status === 'Loading...' ? (
          <LoadingSpinner />
        ) : (
          <StatusText>{status}</StatusText>
        )}
      </OrderCard>
    </PageContainer>
  );
}