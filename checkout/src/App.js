import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState('form'); // form, processing, success, error
  const [paymentId, setPaymentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders/${orderId}/public`);
      setOrderData(response.data);
    } catch (error) {
      setErrorMessage('Failed to load order. Please try again.');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaymentState('processing');

    try {
      const paymentPayload = {
        order_id: orderId,
        method: paymentMethod
      };

      if (paymentMethod === 'upi') {
        paymentPayload.vpa = vpa;
      } else {
        paymentPayload.card_number = cardNumber;
        paymentPayload.expiry_month = parseInt(expiryMonth);
        paymentPayload.expiry_year = parseInt(expiryYear);
        paymentPayload.cvv = cvv;
        paymentPayload.holder_name = cardholderName;
      }

      const response = await axios.post(`${API_URL}/api/v1/payments/public`, paymentPayload);
      setPaymentId(response.data.id);

      // Poll for payment status
      pollPaymentStatus(response.data.id);
    } catch (err) {
      setPaymentState('error');
      setErrorMessage(err.response?.data?.error?.description || 'Payment failed');
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (pId) => {
    const maxAttempts = 20; // Poll for max 40 seconds (2 seconds * 20)
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const response = await axios.get(`${API_URL}/api/v1/payments/${pId}/public`);
        if (response.data.status === 'success') {
          setPaymentState('success');
          clearInterval(poll);
          setLoading(false);
        } else if (response.data.status === 'failed') {
          setPaymentState('error');
          setErrorMessage(response.data.error_description || 'Payment declined');
          clearInterval(poll);
          setLoading(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setLoading(false);
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setLoading(false);
        }
      }
    }, 2000);
  };

  if (!orderData) {
    return <div className="checkout-container">Loading order details...</div>;
  }

  const formattedAmount = (orderData.amount / 100).toFixed(2);

  return (
    <div className="App">
      <div className="checkout-container" data-test-id="checkout-container">
        <div className="order-summary" data-test-id="order-summary">
          <h1>Complete Payment</h1>
          <div>
            <p><strong>Amount:</strong> <span data-test-id="order-amount">₹{formattedAmount}</span></p>
            <p><strong>Order ID:</strong> <span data-test-id="order-id">{orderId}</span></p>
          </div>
        </div>

        {paymentState === 'form' && (
          <form onSubmit={handlePayment} className="payment-form">
            <div className="payment-methods" data-test-id="payment-methods">
              <label>
                <input type="radio" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} data-method="upi" data-test-id="method-upi" />
                UPI
              </label>
              <label>
                <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} data-method="card" data-test-id="method-card" />
                Card
              </label>
            </div>

            {paymentMethod === 'upi' && (
              <div className="upi-form" data-test-id="upi-form">
                <input type="text" value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="username@bank" data-test-id="vpa-input" required />
                <button type="submit" data-test-id="pay-button">Pay ₹{formattedAmount}</button>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="card-form" data-test-id="card-form">
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card Number" data-test-id="card-number-input" required />
                <div className="card-row">
                  <input type="text" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="MM" data-test-id="expiry-input" maxLength="2" required />
                  <input type="text" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="YY" maxLength="2" required />
                  <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" data-test-id="cvv-input" maxLength="4" required />
                </div>
                <input type="text" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="Name on Card" data-test-id="cardholder-name-input" required />
                <button type="submit" data-test-id="pay-button">Pay ₹{formattedAmount}</button>
              </div>
            )}
          </form>
        )}

        {paymentState === 'processing' && (
          <div className="processing-state" data-test-id="processing-state">
            <div className="spinner"></div>
            <p data-test-id="processing-message">Processing payment...</p>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="success-state" data-test-id="success-state">
            <h2>Payment Successful!</h2>
            <p><strong>Payment ID:</strong> <span data-test-id="payment-id">{paymentId}</span></p>
            <p data-test-id="success-message">Your payment has been processed successfully.</p>
          </div>
        )}

        {paymentState === 'error' && (
          <div className="error-state" data-test-id="error-state">
            <h2>Payment Failed</h2>
            <p data-test-id="error-message">{errorMessage}</p>
            <button onClick={() => setPaymentState('form')} data-test-id="retry-button">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
