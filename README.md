# Payment Gateway with Multi-Method Processing and Hosted Checkout

A production-ready payment gateway implementation similar to Razorpay or Stripe, featuring merchant onboarding, payment order management, multi-method payment processing (UPI and Cards), and a hosted checkout page.

## Features

- **RESTful API** with fixed endpoints for payment operations
- **Merchant Authentication** using API key and secret
- **Multi-Method Payment Processing**
  - UPI payments with VPA validation
  - Card payments with Luhn algorithm validation and network detection
- **Hosted Checkout Page** for customer payments
- **Database Persistence** with PostgreSQL
- **Docker Containerization** for seamless deployment
- **Payment Validation Logic**
  - VPA format validation (regex: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$)
  - Luhn algorithm for card validation
  - Card network detection (Visa, Mastercard, Amex, RuPay)
  - Expiry date validation

## Tech Stack

### Backend
- **Framework**: Node.js/Express.js
- **Database**: PostgreSQL 15
- **Authentication**: API Key & Secret (Header-based)
- **Validation**: Custom validation functions

### Frontend
- **Dashboard**: React (Port 3000)
- **Checkout**: React (Port 3001)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## Project Structure

```
payment-gateway/
├── docker-compose.yml
├── README.md
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── health.controller.js
│   │   │   ├── order.controller.js
│   │   │   └── payment.controller.js
│   │   ├── models/
│   │   │   ├── merchant.model.js
│   │   │   ├── order.model.js
│   │   │   └── payment.model.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── services/
│   │   │   ├── order.service.js
│   │   │   ├── payment.service.js
│   │   │   └── validation.service.js
│   │   └── routes/
│   │       ├── health.routes.js
│   │       ├── order.routes.js
│   │       └── payment.routes.js
│   └── db/
│       └── schema.sql
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   └── Transactions.jsx
│       └── components/
│           └── ...
└── checkout/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Checkout.jsx
        │   ├── Success.jsx
        │   └── Failure.jsx
        └── components/
            └── ...
```

## API Endpoints

### Health Check
- `GET /health` - Returns application and database health status

### Order Management
- `POST /api/v1/orders` - Create a new payment order
- `GET /api/v1/orders/{order_id}` - Retrieve order details

### Payment Processing
- `POST /api/v1/payments` - Create and process a payment
- `GET /api/v1/payments/{payment_id}` - Retrieve payment details

### Test Endpoints
- `GET /api/v1/test/merchant` - Retrieve test merchant details

## Database Schema

### Merchants Table
- `id` (UUID) - Primary key
- `name` (VARCHAR 255) - Merchant name
- `email` (VARCHAR 255) - Email (unique)
- `api_key` (VARCHAR 64) - API key (unique)
- `api_secret` (VARCHAR 64) - API secret
- `webhook_url` (TEXT) - Optional webhook URL
- `is_active` (BOOLEAN) - Active status
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Update time

### Orders Table
- `id` (VARCHAR 64) - Primary key (format: order_XXXXXXXXXXXXXXXX)
- `merchant_id` (UUID) - Foreign key to merchants
- `amount` (INTEGER) - Amount in paise
- `currency` (VARCHAR 3) - Currency code (default: INR)
- `receipt` (VARCHAR 255) - Optional receipt ID
- `notes` (JSON) - Optional metadata
- `status` (VARCHAR 20) - Order status (default: created)
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Update time

### Payments Table
- `id` (VARCHAR 64) - Primary key (format: pay_XXXXXXXXXXXXXXXX)
- `order_id` (VARCHAR 64) - Foreign key to orders
- `merchant_id` (UUID) - Foreign key to merchants
- `amount` (INTEGER) - Amount in paise
- `currency` (VARCHAR 3) - Currency code (default: INR)
- `method` (VARCHAR 20) - Payment method (upi or card)
- `status` (VARCHAR 20) - Payment status (processing, success, failed)
- `vpa` (VARCHAR 255) - UPI virtual payment address
- `card_network` (VARCHAR 20) - Card network (visa, mastercard, amex, rupay)
- `card_last4` (VARCHAR 4) - Last 4 digits of card
- `error_code` (VARCHAR 50) - Error code if payment fails
- `error_description` (TEXT) - Error description if payment fails
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Update time

## Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for local development)
- PostgreSQL 15 (for local development)

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/KvPradeepthi/payment-gateway.git
cd payment-gateway

# Start all services
docker-compose up -d

# Verify all services are running
docker-compose ps
```

Services will be available at:
- **Backend API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **Checkout Page**: http://localhost:3001
- **Database**: localhost:5432

### Local Development

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../checkout && npm install

# Configure environment
cp .env.example .env

# Run migrations
npm run db:migrate

# Start services
npm run dev
```

## Test Merchant Credentials

Automatically seeded on application startup:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Merchant",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "api_secret": "secret_test_xyz789"
}
```

## Payment Flow

1. **Order Creation** - Merchant creates a payment order via API
2. **Checkout Redirect** - Customer is redirected to hosted checkout page
3. **Payment Method Selection** - Customer selects UPI or Card
4. **Validation** - Payment details are validated
5. **Processing** - Payment is processed synchronously with 5-10s delay
6. **Result** - Payment succeeds (90% UPI, 95% Card) or fails
7. **Status Update** - Payment status is updated in database
8. **Completion** - Customer sees result page

## Validation Logic

### VPA Validation
- Pattern: `^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$`
- Valid: `user@paytm`, `john.doe@okhdfcbank`, `user_123@phonepe`

### Card Validation (Luhn Algorithm)
1. Remove spaces and dashes
2. Verify digits only, length 13-19
3. Double every second digit from right
4. Subtract 9 if doubled digit > 9
5. Sum all digits must be divisible by 10

### Card Network Detection
- **Visa**: Starts with 4
- **Mastercard**: Starts with 51-55
- **Amex**: Starts with 34 or 37
- **RuPay**: Starts with 60, 65, or 81-89

### Expiry Validation
- Month: 1-12
- Year: 2-digit or 4-digit format
- Must be >= current month/year

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway
PORT=8000

# Test Configuration
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000

# Payment Simulation
UPI_SUCCESS_RATE=0.90
CARD_SUCCESS_RATE=0.95
PROCESSING_DELAY_MIN=5000
PROCESSING_DELAY_MAX=10000
```

## Error Codes

- **AUTHENTICATION_ERROR** - Invalid API credentials
- **BAD_REQUEST_ERROR** - Validation errors
- **NOT_FOUND_ERROR** - Resource not found
- **PAYMENT_FAILED** - Payment processing failed
- **INVALID_VPA** - VPA format invalid
- **INVALID_CARD** - Card validation failed
- **EXPIRED_CARD** - Card expiry date invalid

## Implementation Notes

### Payment Status Flow
```
created → processing → success/failed
```

Note: Payments are created directly with "processing" status. The "created" state is skipped.

### Security Considerations
- Never store full card numbers or CVV
- Only store last 4 digits of card and card network
- API authentication via headers (X-Api-Key, X-Api-Secret)
- Database indexes on merchant_id, order_id, and payment status for performance

### Testing

Use test mode environment variables for deterministic testing:

```bash
TEST_MODE=true
TEST_PAYMENT_SUCCESS=true  # or false
TEST_PROCESSING_DELAY=1000  # milliseconds
```

## Deployment

### Docker Compose Deployment

```bash
docker-compose up -d
```

This automatically:
- Builds backend, frontend, and checkout images
- Starts PostgreSQL database with health checks
- Seeds test merchant data
- Starts all services with proper dependencies

### Service Names & Ports
- **pg_gateway** (Database): 5432
- **gateway_api** (Backend): 8000
- **gateway_dashboard** (Frontend): 3000
- **gateway_checkout** (Checkout): 3001

## Common Issues

1. **Docker build fails**: Ensure Dockerfiles are properly formatted
2. **Database connection errors**: Check DATABASE_URL environment variable
3. **Port conflicts**: Change port mappings in docker-compose.yml
4. **Missing test merchant**: Ensure database seeding runs on startup

## Future Enhancements (Deliverable 2)

- Webhook notifications
- Payment refunds
- Asynchronous payment processing with job queue
- Redis caching
- Advanced analytics
- Bulk payment operations

## License

MIT

## Author

KvPradeepthi

## Deadline

10 January 2026, 04:59 PM IST
