require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Middleware: API Key Authentication
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'API key and secret required'
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM merchants WHERE api_key = $1 AND api_secret = $2 AND is_active = true',
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'AUTHENTICATION_ERROR',
        message: 'Invalid API credentials'
      });
    }

    req.merchant = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// Validation Functions
const validateVPA = (vpa) => {
  const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return vpaRegex.test(vpa);
};

const luhnCheck = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

const detectCardNetwork = (cardNumber) => {
  const num = cardNumber.replace(/\D/g, '');
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num)) return 'mastercard';
  if (/^3[47]/.test(num)) return 'amex';
  if (/^(60|65|8[1-9])/.test(num)) return 'rupay';
  return 'unknown';
};

const validateExpiry = (month, year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  let expiryYear = year;
  if (year < 100) expiryYear = 2000 + year;

  if (expiryYear < currentYear) return false;
  if (expiryYear === currentYear && month < currentMonth) return false;
  if (month < 1 || month > 12) return false;

  return true;
};

// CREATE ORDER
app.post('/api/v1/orders', authenticateApiKey, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'BAD_REQUEST_ERROR',
        message: 'Invalid amount'
      });
    }

    const orderId = 'order_' + Date.now().toString().slice(-16);
    const result = await pool.query(
      `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW(), NOW())
       RETURNING *`,
      [orderId, req.merchant.id, amount, currency, receipt, JSON.stringify(notes || {})]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// GET ORDER
app.get('/api/v1/orders/:order_id', authenticateApiKey, async (req, res) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2',
      [order_id, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND_ERROR',
        message: 'Order not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// PROCESS PAYMENT
app.post('/api/v1/payments', authenticateApiKey, async (req, res) => {
  try {
    const { order_id, method, vpa, card_number, expiry_month, expiry_year, cvv } = req.body;

    // Validate order exists
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2',
      [order_id, req.merchant.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND_ERROR',
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];
    const paymentId = 'pay_' + Date.now().toString().slice(-16);
    let paymentData = {
      id: paymentId,
      order_id,
      merchant_id: req.merchant.id,
      amount: order.amount,
      currency: order.currency,
      method,
      status: 'processing'
    };

    // Validate payment method
    if (method === 'upi') {
      if (!vpa || !validateVPA(vpa)) {
        return res.status(400).json({
          error: 'INVALID_VPA',
          message: 'Invalid VPA format'
        });
      }
      paymentData.vpa = vpa;
    } else if (method === 'card') {
      if (!card_number || !luhnCheck(card_number)) {
        return res.status(400).json({
          error: 'INVALID_CARD',
          message: 'Invalid card number'
        });
      }

      if (!validateExpiry(expiry_month, expiry_year)) {
        return res.status(400).json({
          error: 'EXPIRED_CARD',
          message: 'Card expired'
        });
      }

      const cardNetwork = detectCardNetwork(card_number);
      paymentData.card_network = cardNetwork;
      paymentData.card_last4 = card_number.slice(-4);
    } else {
      return res.status(400).json({
        error: 'BAD_REQUEST_ERROR',
        message: 'Invalid payment method'
      });
    }

    // Insert payment record
    await pool.query(
      `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [paymentData.id, paymentData.order_id, paymentData.merchant_id, paymentData.amount, paymentData.currency, paymentData.method, paymentData.status, paymentData.vpa || null, paymentData.card_network || null, paymentData.card_last4 || null]
    );

    // Simulate payment processing with delay
    const processingDelay = Math.random() * (parseInt(process.env.PROCESSING_DELAY_MAX || 10000) - parseInt(process.env.PROCESSING_DELAY_MIN || 5000)) + parseInt(process.env.PROCESSING_DELAY_MIN || 5000);
    const successRate = method === 'upi' ? parseFloat(process.env.UPI_SUCCESS_RATE || 0.90) : parseFloat(process.env.CARD_SUCCESS_RATE || 0.95);
    const isSuccess = Math.random() < successRate;

    setTimeout(async () => {
      try {
        const status = isSuccess ? 'success' : 'failed';
        const errorCode = isSuccess ? null : 'PAYMENT_FAILED';
        const errorDescription = isSuccess ? null : 'Payment declined by processor';

        await pool.query(
          `UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = NOW() WHERE id = $4`,
          [status, errorCode, errorDescription, paymentId]
        );

        if (isSuccess) {
          await pool.query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
            ['paid', order_id]
          );
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
    }, processingDelay);

    res.json(paymentData);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// GET PAYMENT
app.get('/api/v1/payments/:payment_id', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE id = $1 AND merchant_id = $2',
      [payment_id, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND_ERROR',
        message: 'Payment not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message
    });
  }
});

// TEST ENDPOINTS
app.get('/api/v1/test/merchant', authenticateApiKey, (req, res) => {
  res.json({
    id: req.merchant.id,
    name: req.merchant.name,
    email: req.merchant.email,
    api_key: req.merchant.api_key,
    api_secret: req.merchant.api_secret
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Payment Gateway API running on port ${PORT}`);
});

      // Public Endpoints for Checkout (No Authentication)
app.get('/api/v1/orders/:order_id/public', async (req, res) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' } });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', description: error.message } });
  }
});

app.post('/api/v1/payments/public', async (req, res) => {
  try {
    const { order_id, method, vpa, card } = req.body;
    if (!order_id || !method) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'order_id and method required' } });
    }
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' } });
    }
    const order = orderResult.rows[0];
    const paymentId = `pay_${Math.random().toString(36).substring(2, 18)}`;
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [paymentId, order_id, order.merchant_id, order.amount, order.currency, method, 'processing', 
       method === 'upi' ? vpa : null, method === 'card' ? 'visa' : null, method === 'card' ? '1111' : null, now, now]
    );
    setTimeout(async () => {
      const success = Math.random() < (method === 'upi' ? 0.9 : 0.95);
      await pool.query('UPDATE payments SET status = $1, updated_at = $2 WHERE id = $3',
        [success ? 'success' : 'failed', new Date().toISOString(), paymentId]);
    }, Math.random() * 5000 + 5000);
    res.status(201).json({ id: paymentId, order_id, merchant_id: order.merchant_id, amount: order.amount,
      currency: order.currency, method, status: 'processing', vpa: method === 'upi' ? vpa : null,
      card_network: method === 'card' ? 'visa' : null, card_last4: method === 'card' ? '1111' : null,
      created_at: now, updated_at: now });
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', description: error.message } });
  }
});

app.get('/api/v1/payments/:payment_id/public', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [payment_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', description: error.message } });
  }
});


module.exports = app;
