# 🚀 Stripe Integration Quick Start

## ⚡ 5-Minute Setup

### 1️⃣ Install Stripe Package

```bash
cd backend
pip install stripe
```

### 2️⃣ Get Stripe API Keys

1. Visit [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Register an account (free)
3. Go to Dashboard → Developers → API keys
4. Copy the **test mode** keys

### 3️⃣ Set Environment Variables

Create or edit `backend/.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx
SECRET_KEY=your-jwt-secret
```

### 4️⃣ Update Database
## this one not necessary
```bash
cd backend/database
python setup_postgres.py
```

### 5️⃣ Start Server

```bash
cd backend
python app.py
```

---

## 📱 Frontend Integration (3 Steps)

### Step 1: Install Stripe SDK

```bash
cd frontend
npm install @stripe/stripe-react-native
```

### Step 2: Wrap Your App

In `app/_layout.js`:

```javascript
import { StripeProvider } from '@stripe/stripe-react-native';

export default function Layout() {
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    // Get Stripe publishable key
    fetch('http://192.168.1.181:3000/stripe-payment/config')
      .then(res => res.json())
      .then(data => setPublishableKey(data.publishableKey));
  }, []);

  if (!publishableKey) return <LoadingIcon />;

  return (
    <StripeProvider publishableKey={publishableKey}>
      <Stack>
        {/* Your screens */}
      </Stack>
    </StripeProvider>
  );
}
```

### Step 3: Add Card Component

See `app/components/AddCardModal.js` for complete implementation using `CardField` from Stripe SDK.

---

## 💳 Test Cards

Use these card numbers in test mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Insufficient funds |
| `4000 0000 0000 0002` | ❌ Card declined |

- Expiry: Any future date (e.g., `12/34`)
- CVV: Any 3 digits (e.g., `123`)
- Zip: Any zip code (e.g., `12345`)

---

## 🎯 Core API Endpoints

```bash
# 1. Get configuration
GET /stripe-payment/config

# 2. Get payment methods
GET /stripe-payment/payment-methods?customer_id={id}

# 3. Add card
POST /stripe-payment/attach-payment-method

# 4. Remove card
DELETE /stripe-payment/payment-methods/{pm_id}

# 5. Set default card
POST /stripe-payment/payment-methods/{pm_id}/set-default

# 6. Create payment
POST /stripe-payment/create-payment-intent
```

---

## ✅ Completion Checklist

- [ ] Stripe account registered
- [ ] API keys copied
- [ ] Environment variables set
- [ ] `pip install stripe` run
- [ ] Database updated (stripe_customer_id column exists)
- [ ] Server can start
- [ ] Frontend SDK installed
- [ ] StripeProvider configured
- [ ] Can add test card

---

## 🆘 Troubleshooting

### "Import stripe could not be resolved"
```bash
pip install stripe
```

### "Invalid API Key"
- Check if keys in `.env` file are correct
- Make sure you're using **test mode** keys (`sk_test_...`)
- Restart server

### "Stripe customer not found"
- Customer will be created automatically when adding first card
- Ensure database has `stripe_customer_id` column

### Frontend can't connect
- Check `apiUrl` in `config.js`
- Ensure server is running
- Check network connection

---

## 📚 Next Steps

1. [Stripe Official Docs](https://stripe.com/docs)
2. [Complete Integration Guide](./STRIPE_INTEGRATION_GUIDE.md)
3. [Stripe Dashboard](https://dashboard.stripe.com)
4. [Database Setup Guide](./database/DATABASE_SETUP_README.md)

---

## 💡 Tips

- Use **test mode** during development (`sk_test_...`)
- Switch to **production mode** for live environment (`sk_live_...`)
- Never expose Secret Key in frontend code
- Manage keys using environment variables
- Cards are securely stored by Stripe, not in your database
- Only `stripe_customer_id` is stored in your database

---

## 🔐 Security Best Practices

✅ **DO:**
- Store only `stripe_customer_id` in database
- Use Stripe SDK for card input
- Send card data directly to Stripe
- Use HTTPS in production
- Keep Secret Key secret

❌ **DON'T:**
- Store raw card numbers
- Store CVV codes
- Send Secret Key to frontend
- Log sensitive data

Done! 🎉 You can now process payments securely!
