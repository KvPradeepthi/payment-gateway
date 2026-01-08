// Controllers for payment gateway API
const { Order, Payment } = require('../models');
const { validateVPA, validateCardNumber, detectCardNetwork } = require('../services/validation.service');

// Order Controller
const orderController = {
  create: async (req, res) => {
    try {
      const { amount, currency, receipt, notes } = req.body;
      const order = await Order.create({ merchant_id: req.apiKey, amount, currency, receipt, notes });
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: 'BAD_REQUEST_ERROR', message: error.message });
    }
  },
  getById: async (req, res) => {
    try {
      const { order_id } = req.params;
      const order = await Order.findById(order_id);
      if (!order) return res.status(404).json({ error: 'NOT_FOUND_ERROR' });
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: 'SERVER_ERROR' });
    }
  }
};

// Payment Controller
const paymentController = {
  create: async (req, res) => {
    try {
      const { order_id, method, vpa, card_number } = req.body;
      if (method === 'upi' && !validateVPA(vpa)) {
        return res.status(400).json({ error: 'INVALID_VPA', message: 'Invalid VPA format' });
      }
      if (method === 'card' && !validateCardNumber(card_number)) {
        return res.status(400).json({ error: 'INVALID_CARD', message: 'Invalid card number' });
      }
      const payment = await Payment.create({ order_id, method, vpa, card_network: method === 'card' ? detectCardNetwork(card_number) : null });
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: 'BAD_REQUEST_ERROR' });
    }
  },
  getById: async (req, res) => {
    try {
      const { payment_id } = req.params;
      const payment = await Payment.findById(payment_id);
      if (!payment) return res.status(404).json({ error: 'NOT_FOUND_ERROR' });
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: 'SERVER_ERROR' });
    }
  }
};

module.exports = { orderController, paymentController };
