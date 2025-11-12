# Stripe Payment Integration - Complete Guide

## 🎉 Why Use Stripe?

✅ **Security**: Stripe is PCI DSS Level 1 compliant (highest security standard)  
✅ **No Sensitive Data Storage**: Card numbers, CVV, etc. are securely stored by Stripe  
✅ **Simple Integration**: Implement payment functionality with just a few lines of code  
✅ **Global Support**: Supports 135+ currencies and multiple payment methods  
✅ **Test Friendly**: Comprehensive test mode and test card numbers  

---

## 📋 Step 1: Get Stripe API Keys

### 1. Register for a Stripe Account
Visit [https://stripe.com](https://stripe.com) to register

### 2. Get API Keys
1. Log in to Stripe Dashboard
2. Click **Developers** → **API keys**
3. You'll see two types of keys:
   - **Publishable key** (pk_test_...) - For frontend
   - **Secret key** (sk_test_...) - For backend (Keep it secret!)

### 3. Set Environment Variables

Create a `.env` file in `backend/` directory:

```bash
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# JWT Secret
SECRET_KEY=your-jwt-secret-key-here
```

**Note**: Add `.env` to `.gitignore` - never commit it to Git!

---

## 📦 Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs `stripe==7.4.0`

---

## 🗄️ Step 3: Update Database

The `customers` table needs a `stripe_customer_id` column to link to Stripe customers.

This is already included in `setup_postgres.py`:

```python
# In customers table (line ~199)
stripe_customer_id VARCHAR(255) UNIQUE,
```

If you need to add it manually:

```sql
ALTER TABLE customers ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
```

---

## 🚀 Step 4: API Endpoints

### Base URL
```
http://localhost:3000/stripe-payment
```

### 1. Get Stripe Publishable Key (Frontend Needs This)
```http
GET /stripe-payment/config
```

**Response:**
```json
{
  "publishableKey": "pk_test_..."
}
```

---

### 2. Get Payment Methods (No Auth)
```http
GET /stripe-payment/payment-methods?customer_id={id}
```

**Response:**
```json
{
  "success": true,
  "payment_methods": [
    {
      "id": "pm_1Abc...",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025,
      "is_default": true
    }
  ]
}
```

---

### 3. Add Payment Method
```http
POST /stripe-payment/attach-payment-method
Content-Type: application/json

{
  "customer_id": 1,
  "token_id": "tok_visa"
}
```

**Process:**
1. Frontend creates token using Stripe SDK
2. Send token to backend
3. Backend creates payment method from token
4. Attaches payment method to customer
5. Creates Stripe customer if doesn't exist
6. Sets as default if it's the first card

**Response:**
```json
{
  "success": true,
  "payment_method": {
    "id": "pm_1Abc...",
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2025
  },
  "message": "Card added successfully"
}
```

---

### 4. Remove Payment Method
```http
DELETE /stripe-payment/payment-methods/{payment_method_id}
Content-Type: application/json

{
  "customer_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

---

### 5. Set Default Payment Method
```http
POST /stripe-payment/payment-methods/{payment_method_id}/set-default
Content-Type: application/json

{
  "customer_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Default payment method updated successfully"
}
```

---

### 6. Create Payment Intent (Authenticated)
```http
POST /stripe-payment/create-payment-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 1,
  "amount": 25.50,
  "currency": "usd",
  "payment_method_id": "pm_1Abc...",
  "description": "ChefAsap Booking Payment"
}
```

**Response:**
```json
{
  "success": true,
  "client_secret": "pi_1Abc..._secret_xyz",
  "payment_intent_id": "pi_1Abc...",
  "status": "succeeded"
}
```

**Note**: This endpoint requires JWT authentication. The token is validated using the `@token_required` decorator.

---

### 7. Test Payment
```http
POST /stripe-payment/test-payment
Content-Type: application/json

{
  "customer_id": 1,
  "amount": 100
}
```

Tests a $1.00 payment with the customer's default payment method.

**Response:**
```json
{
  "success": true,
  "payment_intent_id": "pi_1Abc...",
  "status": "succeeded",
  "amount": 100,
  "currency": "usd",
  "message": "Test payment of $1.00 processed successfully!"
}
```

---

## 💳 Test Card Numbers

Stripe provides test card numbers for development:

### Successful Payments
| Card Number | Brand |
|-------------|-------|
| `4242 4242 4242 4242` | Visa |
| `5555 5555 5555 4444` | Mastercard |
| `3782 822463 10005` | American Express |

### Payment Failures
| Card Number | Result |
|-------------|--------|
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |

**For all test cards:**
- Expiry: Any future date (e.g., `12/34`)
- CVV: Any 3 digits (e.g., `123`)
- Zip: Any 5 digits (e.g., `12345`)

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Store only `stripe_customer_id` in your database
- ✅ Use Stripe SDK for card input
- ✅ Send card data directly to Stripe (never through your server)
- ✅ Use HTTPS in production
- ✅ Keep Secret Key secret (server-side only)
- ✅ Validate JWT tokens for payment endpoints
- ✅ Log payment activities

### ❌ DON'T:
- ❌ Store raw card numbers in database
- ❌ Store CVV codes (Stripe doesn't allow this)
- ❌ Send Secret Key to frontend
- ❌ Log sensitive payment data
- ❌ Trust frontend data without validation

---

## 📱 Frontend Integration

### 1. Install Stripe React Native SDK

```bash
cd frontend
npm install @stripe/stripe-react-native
```

### 2. Wrap App with StripeProvider

In `app/_layout.js`:

```javascript
import { StripeProvider } from '@stripe/stripe-react-native';
import { useState, useEffect } from 'react';

export default function RootLayout() {
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    fetch('http://192.168.1.181:3000/stripe-payment/config')
      .then(res => res.json())
      .then(data => setPublishableKey(data.publishableKey));
  }, []);

  if (!publishableKey) {
    return <LoadingScreen />;
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <Stack>
        {/* Your app screens */}
      </Stack>
    </StripeProvider>
  );
}
```

### 3. Add Card Modal Component

See `app/components/AddCardModal.js` for complete implementation.

Key features:
- Uses `CardField` from Stripe SDK
- Creates token on submit
- Sends token to backend
- Handles errors gracefully

### 4. Payment Method Selection

See `app/ChefMenu/[id].js` for booking with payment example.

Shows:
- List of saved cards
- Radio button selection
- "No cards" message
- Link to manage cards

### 5. Profile Payment Management

See `app/(tabs)/Profile.js` for complete payment management.

Features:
- View all cards
- Add new card
- Delete card
- Set default card
- Test payment ($1 charge)

---

## 🎯 Complete Payment Flow

### Adding a Card:

1. **Frontend**: User enters card details in `CardField`
2. **Frontend**: Stripe SDK creates token (card data never touches your server)
3. **Frontend**: Sends token to `/attach-payment-method`
4. **Backend**: Creates Stripe customer if doesn't exist
5. **Backend**: Creates payment method from token
6. **Backend**: Attaches payment method to customer
7. **Backend**: Stores `stripe_customer_id` in database
8. **Backend**: Sets as default if first card

### Making a Payment:

1. **Frontend**: User selects payment method
2. **Frontend**: Sends payment request with amount and payment_method_id
3. **Backend**: Validates JWT token
4. **Backend**: Retrieves stripe_customer_id from database
5. **Backend**: Creates and confirms payment intent
6. **Stripe**: Processes payment
7. **Backend**: Returns payment status
8. **Frontend**: Shows success/error message

---

## 🐛 Troubleshooting

### "Invalid API Key"
- Check `.env` file has correct keys
- Ensure using test mode keys (`sk_test_...`)
- Restart server after changing .env

### "Stripe customer not found"
- Customer is created automatically when first card is added
- Check `stripe_customer_id` column exists in database

### "Invalid token"
- JWT token expired (24 hour expiry)
- SECRET_KEY mismatch between auth_bp.py and stripe_payment_bp.py
- Token not in Authorization header

### "Card declined"
- Using a test card that simulates decline (e.g., `4000 0000 0000 0002`)
- Insufficient funds card (e.g., `4000 0000 0000 9995`)
- Use `4242 4242 4242 4242` for successful test

### Frontend can't connect
- Check `apiUrl` in `frontend/config.js`
- Ensure backend server is running
- Check IP address matches your local network
- Verify no firewall blocking connection

---

## 🚀 Production Deployment

### 1. Switch to Live Mode

In `.env`:
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
```

### 2. Set up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/stripe-payment/webhook`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `payment_method.attached`

4. Copy webhook signing secret to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Use HTTPS

- All production apps must use HTTPS
- Stripe requires HTTPS for live mode
- Use Let's Encrypt for free SSL certificates

### 4. Enable Logging

- Log all payment attempts (success and failures)
- Monitor for unusual activity
- Set up alerts for failed payments

---

## 📊 Monitoring

### Stripe Dashboard

Monitor in real-time:
- Payment volume
- Success rate
- Failed payments
- Customer activity

### Important Metrics

- **Success Rate**: Should be > 95%
- **Decline Rate**: Investigate if > 5%
- **Average Transaction**: Track trends
- **Customer Lifetime Value**: Important for business

---

## 🔗 Useful Links

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe React Native SDK](https://github.com/stripe/stripe-react-native)
- [Testing Guide](https://stripe.com/docs/testing)
- [PCI Compliance](https://stripe.com/docs/security/guide)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

---

## 📝 Database Schema

### customers table
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    stripe_customer_id VARCHAR(255) UNIQUE,  -- Links to Stripe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
```

**What we store:**
- ✅ `stripe_customer_id` - Reference to Stripe customer
- ✅ Customer basic info (name, email)

**What we DON'T store:**
- ❌ Card numbers
- ❌ CVV codes
- ❌ Card expiration dates
- ❌ Any sensitive payment data

All payment data is securely stored by Stripe and accessed via API.

---

## 🎓 Summary

You've learned:
- ✅ How to set up Stripe API keys
- ✅ How to create and manage Stripe customers
- ✅ How to safely add and store payment methods
- ✅ How to process payments securely
- ✅ How to handle errors and edge cases
- ✅ Security best practices for payment processing
- ✅ How to test payment integration
- ✅ How to deploy to production

**Next Steps:**
1. Test with test cards
2. Integrate into booking flow
3. Add error handling
4. Set up webhooks
5. Test in production mode
6. Go live! 🚀

---

**Last Updated:** November 11, 2025  
**Stripe SDK Version:** 7.4.0  
**React Native Stripe SDK:** @stripe/stripe-react-native  

For questions or issues, refer to:
- [Stripe Support](https://support.stripe.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- This project's `STRIPE_QUICK_START.md` for quick reference
