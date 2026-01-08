// Payment Service - Business logic for payment processing
const { Payment, Order } = require('../models');

const paymentService = {
  processPayment: async (orderId, method, amount, vpa = null, cardNetwork = null) => {
    // Simulate payment processing with random success rate
    const isSuccess = Math.random() < 0.9;
    
    const payment = await Payment.create({
      order_id: orderId,
      method,
      amount,
      vpa,
      card_network: cardNetwork,
      status: isSuccess ? 'success' : 'failed'
    });
    
    // Update order status based on payment result
    if (isSuccess) {
      await Order.updateStatus(orderId, 'paid');
    }
    
    return payment;
  },
  
  getPaymentById: async (paymentId) => {
    return await Payment.findById(paymentId);
  },
  
  getPaymentStatus: async (paymentId) => {
    const payment = await Payment.findById(paymentId);
    return payment ? payment.status : null;
  }
};

module.exports = paymentService;
