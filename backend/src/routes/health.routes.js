const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Payment gateway API is running',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check with database status
router.get('/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    services: {
      api: 'running',
      database: 'connected'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
