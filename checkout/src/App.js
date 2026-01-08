import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentId, setPaymentId] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    if (id) {
      setOrderId(id);
      loadOrder(id);
    }
  }, []);

  const loadOrder = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders/${id}/public`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaymentStatus('processing');

    try {
      let paymentData = {
        order_id: orderId,
        method: paymentMethod
      };

      if (paymentMethod === 'upi') {
        paymentData.vpa = vpa;
      } else if (paymentMethod === 'card') {
        paymentData.card = {
          number: cardNumber.replace(/\s/g, ''),
          expiry_month: expiry.split('/')[0],
          expiry_year: expiry.split('/')[1],
          cvv: cvv,
          holder_name: cardholderName
        };
      }

      const response = await axios.post(`${API_URL}/api/v1/payments/public`, paymentData);
      setPaymentId(response.data.id);
      pollPaymentStatus(response.data.id);
    } catch (error) {
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (payId) => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/payments/${payId}/public`);
      if (response.data.status === 'success' || response.data.status === 'failed') {
        setPaymentStatus(response.data.status);
        setLoading(false);
      } else {
        setTimeout(() => pollPaymentStatus(payId), 2000);
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    }
  };

  if (!order) {
    return <div className="checkout-container">Loading order details...</div>;
  }

  return (
    <div className="checkout-container" data-test-id="checkout-container">
      {paymentStatus === null ? (
        <div className="checkout-form">
          <div className="order-summary" data-test-id="order-summary">
            <h1>Complete Payment</h1>
            <div className="order-details">
              <div className="detail-row">
                <span>Amount:</span>
                <span className="amount" data-test-id="order-amount">{(order.amount / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="detail-row">
                <span>Order ID:</span>
                <span className="order-id" data-test-id="order-id">{order.id}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods" data-test-id="payment-methods">
            <button
              type="button"
              className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}
              data-test-id="method-upi"
            >
              UPI
            </button>
            <button
              type="button"
              className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
              data-test-id="method-card"
            >
              Card
            </button>
          </div>

          <form onSubmit={processPayment} className="payment-form">
            {paymentMethod === 'upi' ? (
              <div className="upi-form" data-test-id="upi-form">
                <input
                  type="text"
                  data-test-id="vpa-input"
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  placeholder="username@bank"
                  required
                />
              </div>
            ) : (
              <div className="card-form" data-test-id="card-form">
                <input
                  type="text"
                  data-test-id="card-number-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Card Number"
                  required
                />
                <input
                  type="text"
                  data-test-id="expiry-input"
                  value={expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                    setExpiry(val);
                  }}
                  placeholder="MM/YY"
                  required
                />
                <input
                  type="password"
                  data-test-id="cvv-input"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  required
                />
                <input
                  type="text"
                  data-test-id="cardholder-name-input"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Name on Card"
                  required
                />
              </div>
            )}

            <button type="submit" data-test-id="pay-button" disabled={loading}>
              {loading ? 'Processing...' : 'Pay'}
            </button>
          </form>
        </div>
      ) : paymentStatus === 'processing' ? (
        <div className="payment-state processing" data-test-id="processing-state">
          <p>Processing payment...</p>
        </div>
      ) : paymentStatus === 'success' ? (
        <div className="payment-state success" data-test-id="success-state">
          <h2>Payment Successful!</h2>
          <div className="detail-row">
            <span>Payment ID:</span>
            <span data-test-id="payment-id">{paymentId}</span>
          </div>
          <p>Your payment has been processed successfully</p>
          <button
            onClick={() => window.location.href = '/'}
            data-test-id="continue-button"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="payment-state error" data-test-id="error-state">
          <h2>Payment Failed</h2>
          <p>Payment could not be processed</p>
          <button
            onClick={() => {
              setPaymentStatus(null);
              setVpa('');
              setCardNumber('');
              setExpiry('');
              setCvv('');
              setCardholderName('');
            }}
            data-test-id="retry-button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
