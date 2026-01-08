// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.header('X-Api-Key');
  const apiSecret = req.header('X-Api-Secret');

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'Missing API credentials'
    });
  }

  // In production, validate against database
  // For now, perform basic validation
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'Invalid API key format'
    });
  }

  // Attach credentials to request for later use
  req.apiKey = apiKey;
  req.apiSecret = apiSecret;
  next();
};

module.exports = authenticateApiKey;
