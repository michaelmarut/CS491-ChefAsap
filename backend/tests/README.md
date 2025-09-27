# Tests Folder

This folder contains all test and utility scripts for the ChefAsap backend.

## Files:

### Database Tests
- **`test_connection.py`** - Tests database connectivity and verifies all required tables exist
- **`setup_db.py`** - Recreates and initializes the database with all tables

### Application Tests  
- **`test_flask.py`** - Tests Flask app setup and blueprint registration

## How to Run Tests

### Test Database Connection
```bash
cd backend/tests
python test_connection.py
```

### Setup/Reset Database
```bash
cd backend/tests
python setup_db.py
```

### Test Flask App
```bash
cd backend/tests
python test_flask.py
```

## Requirements
All tests require:
- MySQL server running on localhost
- Correct database credentials in `database/config.py`
- Required Python packages installed (mysql-connector-python, flask, etc.)