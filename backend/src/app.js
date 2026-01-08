const express = require('express');
const authenticateApiKey = require('./middleware/auth.middleware');
const healthRoutes = require('./routes/health.routes');
const orderRoutes = require('./routes/orders.routes');
const paymentRoutes = require('./routes/payments.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Api-Key, X-Api-Secret');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND_ERROR',
    message: 'Endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.error || 'SERVER_ERROR',
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
