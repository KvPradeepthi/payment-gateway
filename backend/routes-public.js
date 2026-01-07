// Public endpoints for checkout page (no authentication required)

// GET /api/v1/orders/{order_id}/public
export const getOrderPublic = async (req, res) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query(
      'SELECT id, merchant_id, amount, currency, status FROM orders WHERE id = $1',
      [order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: { code: 'SERVER_ERROR', description: error.message }
    });
  }
};

// POST /api/v1/payments/public
export const createPaymentPublic = async (req, res) => {
  try {
    const { order_id, method, vpa, card_number, expiry_month, expiry_year, cvv, holder_name } = req.body;

    // Validate order exists
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' }
      });
    }

    const order = orderResult.rows[0];
    const paymentId = 'pay_' + Date.now().toString().slice(-16);

    // Validate payment method
    if (method === 'upi') {
      if (!vpa || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(vpa)) {
        return res.status(400).json({
          error: { code: 'INVALID_VPA', description: 'Invalid VPA format' }
        });
      }
    } else if (method === 'card') {
      // Luhn check
      const digits = card_number.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) {
        return res.status(400).json({
          error: { code: 'INVALID_CARD', description: 'Invalid card number' }
        });
      }
    }

    // Create payment
    await pool.query(
      `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, NOW(), NOW())`,
      [paymentId, order_id, order.merchant_id, order.amount, order.currency, method, method === 'upi' ? vpa : null]
    );

    res.status(201).json({
      id: paymentId,
      order_id,
      amount: order.amount,
      currency: order.currency,
      method,
      status: 'processing',
      vpa: method === 'upi' ? vpa : undefined
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'SERVER_ERROR', description: error.message }
    });
  }
};

// GET /api/v1/payments/{payment_id}/public
export const getPaymentPublic = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const result = await pool.query(
      'SELECT id, order_id, amount, currency, method, status, vpa, error_description FROM payments WHERE id = $1',
      [payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: { code: 'SERVER_ERROR', description: error.message }
    });
  }
};
