const { Pool } = require('pg');

// PostgreSQL connection pool configuration
const pool = new Pool({
  user: process.env.DATABASE_USER || 'gateway_user',
  password: process.env.DATABASE_PASSWORD || 'gateway_pass',
  host: process.env.DATABASE_HOST || 'postgres',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'payment_gateway',
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
});

module.exports = pool;
