# ChefAsap Backend - Project Structure

## 📁 Organized Project Layout

```
backend/
├── 📄 app.py                    # Main Flask application
├── 📄 auth.py                   # Authentication routes  
├── 📄 sample_data.py            # Sample data for testing
├── 📄 requirements.txt          # Python dependencies
├── 📄 run_tests.py             # Test runner script
├── 📄 BOOKING_CLEANUP_SUMMARY.md # Documentation
│
├── 📁 blueprint/               # API blueprints
│   ├── 📄 booking.py          # Booking management API
│   └── 📄 chat.py             # Chat system API
│
├── 📁 database/               # Database configuration
│   ├── 📄 __init__.py
│   ├── 📄 config.py           # Database connection settings
│   └── 📄 init_db.py          # Database schema initialization
│
└── 📁 tests/                  # All tests organized here
    ├── 📄 __init__.py         # Package marker
    ├── 📄 README.md           # Test documentation
    ├── 📄 setup_db.py         # Database setup/reset utility
    ├── 📄 test_connection.py  # Database connectivity test
    └── 📄 test_flask.py       # Flask app integration test
```

## 🧪 Testing

### Run All Tests
```bash
python run_tests.py
```

### Run Individual Tests
```bash
# From backend directory:
python tests/test_connection.py
python tests/test_flask.py
python tests/setup_db.py
```

## 🌐 API Endpoints

### Authentication (`/auth/*`)
- Login, registration, etc.

### Bookings (`/api/bookings/*`)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/<id>` - Get booking details
- `GET /api/bookings?role=customer&user_id=X` - List bookings
- `POST /api/bookings/<id>/accept` - Accept booking
- `POST /api/bookings/<id>/reject` - Reject booking
- `POST /api/bookings/<id>/cancel` - Cancel booking

### Chat (`/api/chat/*`)
- `POST /api/chat/send` - Send message
- `GET /api/chat/history?booking_id=X` - Get chat history
- `GET /api/chat/contacts?user_id=X&role=chef` - Get contacts
- `GET /api/chat/bookings?chef_id=X&customer_id=Y` - List shared bookings

## 🗄️ Database

- **Tables**: 24 tables including users, chefs, customers, bookings, chat_messages, etc.
- **Schema**: Enhanced with ratings, reviews, social media links
- **Connection**: MySQL via `database/config.py`

## ✅ Benefits of This Organization

1. **🧹 Clean Structure**: All tests in dedicated folder
2. **📚 Clear Documentation**: README files explain each component  
3. **🔧 Easy Testing**: Single command runs all tests
4. **🎯 Focused Files**: Each file has a single responsibility
5. **🚀 Scalable**: Easy to add new tests and features