const express = require('express');
const authenticateApiKey = require('../middleware/auth.middleware');
const router = express.Router();

// Apply authentication to all payment routes
router.use(authenticateApiKey);

// Create and process a payment
router.post('/', (req, res) => {
  const { order_id, method, vpa, card_number, card_expiry, card_cvv } = req.body;

  // Validate required fields
  if (!order_id || !method) {
    return res.status(400).json({
      error: 'BAD_REQUEST_ERROR',
      message: 'order_id and method are required'
    });
  }

  if (!['upi', 'card'].includes(method)) {
    return res.status(400).json({
      error: 'BAD_REQUEST_ERROR',
      message: 'method must be either "upi" or "card"'
    });
  }

  // Validate UPI
  if (method === 'upi' && !vpa) {
    return res.status(400).json({
      error: 'INVALID_VPA',
      message: 'VPA is required for UPI payments'
    });
  }

  // Validate Card
  if (method === 'card' && !card_number) {
    return res.status(400).json({
      error: 'INVALID_CARD',
      message: 'Card number is required for card payments'
    });
  }

  // Generate payment ID
  const paymentId = `pay_${Math.random().toString(36).substr(2, 14)}`;
  const status = Math.random() < 0.9 ? 'success' : 'failed';

  res.status(201).json({
    id: paymentId,
    order_id,
    method,
    status,
    vpa: method === 'upi' ? vpa : undefined,
    card_last4: method === 'card' ? card_number.slice(-4) : undefined,
    card_network: method === 'card' ? 'visa' : undefined,
    error_code: status === 'failed' ? 'PAYMENT_FAILED' : undefined,
    created_at: new Date().toISOString()
  });
});

// Get payment by ID
router.get('/:payment_id', (req, res) => {
  const { payment_id } = req.params;

  if (!payment_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST_ERROR',
      message: 'Payment ID is required'
    });
  }

  res.status(200).json({
    id: payment_id,
    order_id: 'order_12345',
    method: 'upi',
    status: 'success',
    vpa: 'user@paytm',
    created_at: new Date().toISOString()
  });
});

module.exports = router;
