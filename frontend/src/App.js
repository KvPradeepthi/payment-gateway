import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('key_test_abc123');
  const [apiSecret, setApiSecret] = useState('secret_test_xyz789');
  const [amount, setAmount] = useState(10000);
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [result, setResult] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const createOrder = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/orders`, {
        amount: parseInt(amount),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { description: 'Test Payment' }
      }, {
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret
        }
      });
      setResult(response.data);
      setOrderId(response.data.id);
      alert('Order created: ' + response.data.id);
    } catch (error) {
      alert('Error creating order: ' + error.response?.data?.message || error.message);
    }
  };

  const testMerchant = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/test/merchant`, {
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret
        }
      });
      setResult(response.data);
      alert('Merchant verified successfully');
    } catch (error) {
      alert('Error verifying merchant: ' + error.response?.data?.message || error.message);
    }
  };

  const getHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setResult(response.data);
      alert('Health Check: ' + JSON.stringify(response.data));
    } catch (error) {
      alert('Error checking health: ' + error.message);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Payment Gateway Dashboard</h1>
        
        <div className="section">
          <h2>API Credentials</h2>
          <div className="input-group">
            <label>API Key:</label>
            <input 
              type="text" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
            />
          </div>
          <div className="input-group">
            <label>API Secret:</label>
            <input 
              type="password" 
              value={apiSecret} 
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="API Secret"
            />
          </div>
        </div>

        <div className="section">
          <h2>Create Payment Order</h2>
          <div className="input-group">
            <label>Amount (in paise):</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount in paise"
            />
          </div>
          <button onClick={createOrder}>Create Order</button>
        </div>

        <div className="section">
          <h2>System Status</h2>
          <button onClick={getHealth}>Check Health</button>
          <button onClick={testMerchant}>Verify Merchant</button>
        </div>

        {result && (
          <div className="result">
            <h3>Response:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
