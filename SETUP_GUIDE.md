# ChefAsap Full-Stack Setup Guide

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.7+ installed
- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- MySQL server running (or use your existing database setup)

### Backend Setup (Terminal 1)

1. **Navigate to backend directory:**
   ```cmd
   cd "d:\CS491\clone\CS491-ChefAsap\backend"
   ```

2. **Install Python dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

3. **⚠️ IMPORTANT: Set up database (New installations only):**
   
   **First time setup:**
   - Make sure MySQL server is running
   - Update `backend/database/config.py` with your MySQL credentials:
     ```python
     db_config = {
         'host': 'localhost',
         'user': 'your_mysql_username', 
         'password': 'your_mysql_password',
         'database': 'chefasap'
     }
     ```
   - Run the automated setup script:
     ```cmd
     python setup_database.py
     ```
   
   This creates all tables, relationships, and adds test data:
   - 🧪 Test Chef: `chef1@example.com` / `password123`
   - 🧪 Test Customer: `customer1@example.com` / `password123`

4. **Start the Flask server:**
   ```cmd
   python app.py
   ```
   ✅ You should see: "Server starting on 192.168.1.181:3000"

### Frontend Setup (Terminal 2)

1. **Navigate to frontend directory:**
   ```cmd
   cd "d:\CS491\clone\CS491-ChefAsap\frontend"
   ```

2. **Install React Native dependencies:**
   ```cmd
   npm install
   ```

3. **Start the Expo development server:**
   ```cmd
   npx expo start -w
   ```
   ✅ This will open the Expo developer tools in your web browser

### 📱 Testing the App

1. **Use Expo Go app on your phone** (recommended)
   - Download "Expo Go" from App Store/Play Store
   - Scan the QR code from the Expo developer tools
   - The app will load on your phone

2. **Or use web browser:**
   - Press 'w' in the terminal to open in web browser
   - Note: Some features might not work perfectly in web mode

### 🔍 New Features Available

#### 1. **Advanced Chef Search**
- Navigate to "Search Chefs" from the landing page
- Filter by:
  - Cuisine type (Italian, Chinese, Mexican, etc.)
  - Chef gender
  - City/Location
  - Minimum rating (3.0+ to 4.5+)
  - Sort by rating, distance, name, or city

#### 2. **Enhanced Chef Profiles**
- Star ratings and review counts
- Distance calculation
- Cuisine specialties
- Professional bios
- Easy booking buttons

#### 3. **Smart Booking System**
- Original booking functionality maintained
- Integration with search results
- Direct chef selection from search

### 🗄️ Database Features

The database now includes:
- ✅ Enhanced chef profiles with ratings
- ✅ Customer reviews and feedback system
- ✅ Cuisine type categorization
- ✅ Location-based search capabilities
- ✅ Sample data for testing (8 chefs with various specialties)

### 🛠️ API Endpoints Available

- **GET** `/api/bookings/search-chefs` - Advanced chef search with filters
- **GET** `/api/bookings/filter-options` - Get available filter options
- **POST** `/api/bookings/create` - Create new booking (existing)
- **POST** `/api/bookings/book-chef` - Book specific chef (existing)
- **POST** `/api/chat/*` - Chat system endpoints
- **POST** `/auth/*` - Authentication endpoints

### 🧪 Testing the Search Functionality

1. Open the app and tap "Search Chefs"
2. Try different filter combinations:
   - Select "Italian" cuisine type
   - Set minimum rating to 4.0+
   - Sort by rating
3. Browse the results and tap "Book Now" on any chef
4. The booking system will integrate with your existing booking flow

### ⚠️ Troubleshooting

#### Backend Issues:
- **Port already in use?** Make sure no other Flask app is running on port 3000
- **Database connection failed?** Check your MySQL server is running and credentials in `config.py` are correct
- **Import errors?** Make sure you're in the correct backend directory
- **Tables don't exist?** Run `python setup_database.py` to create all required tables

#### Database Setup Issues:
- **"Database 'chefasap' doesn't exist"?** The setup script will create it automatically
- **"Access denied for user"?** Update your MySQL username/password in `backend/database/config.py`
- **"Can't connect to MySQL server"?** Make sure MySQL service is running on your system
- **Setup script fails?** Try running MySQL commands manually or check MySQL error logs
- **Sample data missing?** Re-run `python setup_database.py` - it's safe to run multiple times

#### Frontend Issues:
- **Metro bundler error?** Try `npx expo start --clear` to clear cache
- **Can't connect to backend?** Check the IP address in `config.js` matches your computer's IP
- **Expo Go not loading?** Make sure your phone and computer are on the same WiFi network

### 🎯 Next Steps

Your app now has a complete chef search and booking system! You can:
1. Customize the search filters to match your business needs
2. Add more sample data for testing
3. Integrate with your authentication system
4. Add photo upload for chef profiles
5. Implement real-time chat with the existing chat system

### 📝 File Structure

```
frontend/
├── App.js                  (Main navigation)
├── pages/
│   └── LandingPage.js     (Home screen with navigation)
├── app/
│   ├── chef-search.js     (🆕 Advanced search screen)
│   ├── booking.js         (Enhanced booking system)
│   ├── signin.js          (Login functionality)
│   └── signup.js          (Registration functionality)
└── config.js              (API configuration)

backend/
├── app.py                 (Main Flask server)
├── blueprint/
│   ├── booking.py         (🆕 Enhanced with search endpoints)
│   └── chat.py           (Chat system)
├── database/
│   └── init_db.py        (🆕 Enhanced database schema)
└── requirements.txt       (Python dependencies)
```

Happy cooking! 🍳✨