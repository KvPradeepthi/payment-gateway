const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const seedTestMerchant = async () => {
  try {
    console.log('Seeding test merchant...');

    const testMerchantId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Check if merchant already exists
    const existingMerchant = await pool.query(
      'SELECT * FROM merchants WHERE id = $1',
      [testMerchantId]
    );

    if (existingMerchant.rows.length === 0) {
      await pool.query(
        `INSERT INTO merchants (id, name, email, api_key, api_secret, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          testMerchantId,
          'Test Merchant',
          'test@example.com',
          'key_test_abc123',
          'secret_test_xyz789',
          true
        ]
      );
      console.log('Test merchant created successfully');
    } else {
      console.log('Test merchant already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedTestMerchant();
