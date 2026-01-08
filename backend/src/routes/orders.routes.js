const express = require('express');
const authenticateApiKey = require('../middleware/auth.middleware');
const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateApiKey);

// Create a new order
router.post('/', (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST_ERROR',
      message: 'Invalid amount. Must be a positive number'
    });
  }

  // Generate order ID
  const orderId = `order_${Math.random().toString(36).substr(2, 14)}`;

  res.status(201).json({
    id: orderId,
    merchant_id: req.apiKey,
    amount,
    currency,
    receipt,
    notes,
    status: 'created',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

// Get order by ID
router.get('/:order_id', (req, res) => {
  const { order_id } = req.params;

  if (!order_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST_ERROR',
      message: 'Order ID is required'
    });
  }

  res.status(200).json({
    id: order_id,
    merchant_id: req.apiKey,
    amount: 50000,
    currency: 'INR',
    status: 'created',
    created_at: new Date().toISOString()
  });
});

module.exports = router;
