// Order Service - Business logic for orders
const { Order } = require('../models');

const orderService = {
  createOrder: async (merchantId, amount, currency, receipt, notes) => {
    return await Order.create({ merchant_id: merchantId, amount, currency, receipt, notes });
  },
  
  getOrderById: async (orderId) => {
    return await Order.findById(orderId);
  },
  
  updateOrderStatus: async (orderId, status) => {
    return await Order.updateStatus(orderId, status);
  }
};

module.exports = orderService;
