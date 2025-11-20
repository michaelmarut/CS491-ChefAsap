# Payment Cards API Documentation

## Overview
This API allows customers to manage their payment cards (credit/debit cards) in the ChefAsap system.

## Security Notice
⚠️ **IMPORTANT**: This implementation is for development/demonstration purposes only. In a production environment:
- Card numbers should be encrypted using AES-256 or similar
- **CVV should NEVER be stored** - it should only be used for immediate transaction processing
- Consider using payment gateways (Stripe, PayPal, etc.) instead of storing card data
- Ensure PCI DSS compliance
- Implement proper access controls and audit logging

## Database Setup

### Run the database setup script:
```bash
cd backend/database
python setup_postgres.py
```

Or manually run the SQL script:
```bash
psql -U your_username -d your_database -f add_payment_cards_table.sql
```

## API Endpoints

### Base URL
```
http://localhost:3000/payment
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 1. Get All Cards for a Customer

**GET** `/customer/<customer_id>/cards`

### Description
Retrieves all saved payment cards for a specific customer. Card numbers are masked for security.

### Request
```bash
curl -X GET \
  http://localhost:3000/payment/customer/123/cards \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response (200 OK)
```json
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "card_holder_name": "John Doe",
      "masked_card_number": "****-****-****-1234",
      "expiry_date": "12/2025",
      "card_type": "Credit",
      "is_default": true,
      "created_at": "2025-01-15T10:30:00"
    },
    {
      "id": 2,
      "card_holder_name": "John Doe",
      "masked_card_number": "****-****-****-5678",
      "expiry_date": "06/2026",
      "card_type": "Debit",
      "is_default": false,
      "created_at": "2025-02-20T14:15:00"
    }
  ]
}
```

---

## 2. Add a New Card

**POST** `/customer/<customer_id>/cards`

### Description
Adds a new payment card for a customer.

### Request Body
```json
{
  "card_holder_name": "John Doe",
  "card_number": "4532123456789012",
  "expiry_date": "12/2025",
  "cvv": "123",
  "card_type": "Credit",
  "is_default": true
}
```

### Field Validation
- `card_holder_name`: Required, any non-empty string
- `card_number`: Required, 13-19 digits (spaces allowed, will be removed)
- `expiry_date`: Required, format MM/YY or MM/YYYY
- `cvv`: Required, 3-4 digits
- `card_type`: Optional, either "Credit" or "Debit" (default: "Credit")
- `is_default`: Optional, boolean (default: false)

### Request Example
```bash
curl -X POST \
  http://localhost:3000/payment/customer/123/cards \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "card_holder_name": "John Doe",
    "card_number": "4532123456789012",
    "expiry_date": "12/2025",
    "cvv": "123",
    "card_type": "Credit",
    "is_default": true
  }'
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Card added successfully",
  "card_id": 1
}
```

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Invalid card number format"
}
```

**400 Bad Request** - Missing field
```json
{
  "error": "Missing required field: card_number"
}
```

**403 Forbidden** - Unauthorized
```json
{
  "error": "Unauthorized access"
}
```

---

## 3. Delete a Card

**DELETE** `/customer/<customer_id>/cards/<card_id>`

### Description
Deletes a specific payment card.

### Request
```bash
curl -X DELETE \
  http://localhost:3000/payment/customer/123/cards/1 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

### Error Responses

**404 Not Found**
```json
{
  "error": "Card not found"
}
```

**403 Forbidden**
```json
{
  "error": "Unauthorized access"
}
```

---

## 4. Set Default Card

**PUT** `/customer/<customer_id>/cards/<card_id>/set-default`

### Description
Sets a specific card as the default payment method. All other cards will be unmarked as default.

### Request
```bash
curl -X PUT \
  http://localhost:3000/payment/customer/123/cards/2/set-default \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Card set as default successfully"
}
```

### Error Responses

**404 Not Found**
```json
{
  "error": "Card not found"
}
```

**403 Forbidden**
```json
{
  "error": "Unauthorized access"
}
```

---

## Frontend Integration Example

### React Native / JavaScript

```javascript
import getEnvVars from '../../config';

const { apiUrl } = getEnvVars();

// Get all cards
const getCards = async (customerId, token) => {
  try {
    const response = await fetch(`${apiUrl}/payment/customer/${customerId}/cards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.cards;
    } else {
      throw new Error(data.error || 'Failed to get cards');
    }
  } catch (error) {
    console.error('Error getting cards:', error);
    throw error;
  }
};

// Add a new card
const addCard = async (customerId, token, cardData) => {
  try {
    const response = await fetch(`${apiUrl}/payment/customer/${customerId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cardData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || 'Failed to add card');
    }
  } catch (error) {
    console.error('Error adding card:', error);
    throw error;
  }
};

// Delete a card
const deleteCard = async (customerId, cardId, token) => {
  try {
    const response = await fetch(`${apiUrl}/payment/customer/${customerId}/cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || 'Failed to delete card');
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};

// Set default card
const setDefaultCard = async (customerId, cardId, token) => {
  try {
    const response = await fetch(`${apiUrl}/payment/customer/${customerId}/cards/${cardId}/set-default`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || 'Failed to set default card');
    }
  } catch (error) {
    console.error('Error setting default card:', error);
    throw error;
  }
};

export { getCards, addCard, deleteCard, setDefaultCard };
```

---

## Testing with cURL

### 1. Login to get a token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### 2. Add a card
```bash
curl -X POST http://localhost:3000/payment/customer/1/cards \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "card_holder_name": "John Doe",
    "card_number": "4532123456789012",
    "expiry_date": "12/2025",
    "cvv": "123",
    "card_type": "Credit",
    "is_default": true
  }'
```

### 3. Get all cards
```bash
curl -X GET http://localhost:3000/payment/customer/1/cards \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 4. Set a card as default
```bash
curl -X PUT http://localhost:3000/payment/customer/1/cards/2/set-default \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 5. Delete a card
```bash
curl -X DELETE http://localhost:3000/payment/customer/1/cards/1 \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

---

## Next Steps

After implementing the basic card storage, consider:

1. **Payment Gateway Integration**: Integrate with Stripe, PayPal, or similar services
2. **Card Encryption**: Implement encryption for card numbers
3. **Remove CVV Storage**: CVV should never be stored - only used for immediate transactions
4. **Card Validation**: Implement Luhn algorithm for card number validation
5. **3D Secure**: Add support for 3D Secure authentication
6. **Tokenization**: Use tokenization instead of storing actual card numbers
7. **Audit Logging**: Log all card-related operations for security auditing
8. **Rate Limiting**: Implement rate limiting to prevent abuse
9. **Fraud Detection**: Add fraud detection mechanisms
10. **PCI Compliance**: Ensure full PCI DSS compliance if storing card data

---

## Support

For questions or issues, please contact the development team.
