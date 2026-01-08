import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [merchant, setMerchant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Test merchant credentials
  const TEST_EMAIL = 'test@example.com';
  const TEST_API_KEY = 'key_test_abc123';
  const TEST_API_SECRET = 'secret_test_xyz789';
  const TEST_MERCHANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === TEST_EMAIL) {
      setMerchant({
        email: TEST_EMAIL,
        apiKey: TEST_API_KEY,
        apiSecret: TEST_API_SECRET,
        id: TEST_MERCHANT_ID
      });
      setCurrentPage('dashboard');
      loadTransactions();
    } else {
      alert('Invalid credentials. Use: test@example.com');
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/test/merchant`, {
        headers: {
          'X-Api-Key': TEST_API_KEY,
          'X-Api-Secret': TEST_API_SECRET
        }
      });
      
      // For demo purposes, we'll create sample transaction data
      // In production, fetch from actual database
      setTransactions([
        { id: 'pay_abc123def456', orderId: 'order_xyz789abc123', amount: 5000, method: 'upi', status: 'success', createdAt: new Date().toISOString() }
      ]);
      
      calculateStats();
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const calculateStats = () => {
    const totalTx = transactions.length;
    const totalAmt = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const successCount = transactions.filter(tx => tx.status === 'success').length;
    const successRate = totalTx > 0 ? ((successCount / totalTx) * 100).toFixed(2) : 0;
    
    setStats({
      totalTransactions: totalTx,
      totalAmount: totalAmt,
      successRate: parseFloat(successRate)
    });
  };

  const handleLogout = () => {
    setCurrentPage('login');
    setMerchant(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="app-container">
      {/* Login Page */}
      {currentPage === 'login' && (
        <div className="page login-page" data-test-id="login-page">
          <div className="card">
            <h1>Merchant Login</h1>
            <form onSubmit={handleLogin} data-test-id="login-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  data-test-id="email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  data-test-id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
              <button type="submit" data-test-id="login-button" className="btn-primary">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Page */}
      {currentPage === 'dashboard' && merchant && (
        <div className="page dashboard-page" data-test-id="dashboard">
          <div className="header">
            <h1>Merchant Dashboard</h1>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>

          {/* API Credentials Section */}
          <div className="section" data-test-id="api-credentials">
            <h2>API Credentials</h2>
            <div className="credentials-grid">
              <div className="credential-item">
                <label>API Key</label>
                <code data-test-id="api-key-display">{merchant.apiKey}</code>
              </div>
              <div className="credential-item">
                <label>API Secret</label>
                <code data-test-id="api-secret-display">{merchant.apiSecret}</code>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="section">
            <h2>Statistics</h2>
            <div className="stats-grid" data-test-id="statistics">
              <div className="stat-card">
                <div className="stat-value" data-test-id="total-transactions">{stats.totalTransactions}</div>
                <div className="stat-label">Total Transactions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" data-test-id="total-amount">₹{(stats.totalAmount / 100).toLocaleString('en-IN')}</div>
                <div className="stat-label">Total Amount</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" data-test-id="success-rate">{stats.successRate}%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="section">
            <h2>Recent Transactions</h2>
            <table className="transactions-table" data-test-id="transactions-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} data-test-id="transaction-row">
                      <td>{tx.id}</td>
                      <td>{tx.orderId}</td>
                      <td>₹{(tx.amount / 100).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge badge-${tx.method}`}>
                          {tx.method.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${tx.status}`}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
