// Database models
const db = require('../config/database');

// Merchant Model
const Merchant = {
  findByApiKey: async (apiKey) => {
    // Placeholder - would query database
    return { id: 'test-merchant', apiKey };
  },
  create: async (data) => {
    // Placeholder - would insert into database
    return { id: 'new-merchant', ...data };
  }
};

// Order Model
const Order = {
  create: async (data) => {
    // Placeholder - would insert into database
    return { id: `order_${Date.now()}`, ...data, status: 'created' };
  },
  findById: async (id) => {
    // Placeholder - would query database
    return { id, status: 'created', amount: 50000 };
  },
  updateStatus: async (id, status) => {
    // Placeholder - would update database
    return { id, status };
  }
};

// Payment Model
const Payment = {
  create: async (data) => {
    // Placeholder - would insert into database
    return { id: `pay_${Date.now()}`, ...data, status: 'processing' };
  },
  findById: async (id) => {
    // Placeholder - would query database
    return { id, status: 'success' };
  },
  updateStatus: async (id, status, error = null) => {
    // Placeholder - would update database
    return { id, status, error_code: error };
  }
};

module.exports = { Merchant, Order, Payment };
