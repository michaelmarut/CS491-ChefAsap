# ChefAsap Sample Users Reference

## 📋 Quick Access Information

### 🔑 Universal Credentials
- **Password for ALL users**: `QWEasd123!`

### 👨‍🍳 Chef Accounts (100 total)
- **Email Pattern**: `chef1@example.com` to `chef100@example.com`
- **Examples**:
  - chef1@example.com
  - chef25@example.com
  - chef50@example.com
  - chef75@example.com
  - chef100@example.com

### 👤 Customer Accounts (100 total)
- **Email Pattern**: `user1@example.com` to `user100@example.com`
- **Examples**:
  - user1@example.com
  - user25@example.com
  - user50@example.com
  - user75@example.com
  - user100@example.com

## 🧪 Testing Scenarios

### For Login Testing:
```
Chef Login:
Email: chef1@example.com
Password: QWEasd123!

Customer Login:
Email: user1@example.com  
Password: QWEasd123!
```

### For Database Queries:
```sql
-- Get all chefs
SELECT * FROM chefs WHERE email LIKE 'chef%@example.com';

-- Get all customers  
SELECT * FROM customers WHERE email LIKE 'user%@example.com';

-- Get chef with cuisines
SELECT c.*, GROUP_CONCAT(ct.name) as cuisines 
FROM chefs c 
LEFT JOIN chef_cuisines cc ON c.id = cc.chef_id
LEFT JOIN cuisine_types ct ON cc.cuisine_id = ct.id
WHERE c.email = 'chef1@example.com'
GROUP BY c.id;
```

## 📊 Database Statistics
- ✅ 100 Chef Users (users table)
- ✅ 100 Chef Profiles (chefs table)
- ✅ 100 Customer Users (users table)
- ✅ 100 Customer Profiles (customers table)
- ✅ 20+ Cuisine Types
- ✅ 200+ Sample Reviews
- ✅ Multiple Chef-Cuisine Relationships
- ✅ Customer Addresses
- ✅ Diverse Locations (50 US Cities)

## 🎯 Features Available for Testing
1. **User Authentication** - Login/Logout for both chefs and customers
2. **Chef Search** - Filter by cuisine, location, rating, gender
3. **Booking System** - Create, accept, reject bookings
4. **Review System** - Rate and review chefs
5. **Profile Management** - View and edit profiles
6. **Location-based Services** - Geographic filtering

## 🔧 Database Management Commands

### Reset All Sample Data:
```sql
DELETE FROM chef_reviews WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com');
DELETE FROM bookings WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com');
DELETE FROM chef_cuisines WHERE chef_id IN (SELECT id FROM chefs WHERE email LIKE 'chef%@example.com');
DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM customers WHERE email LIKE 'user%@example.com');
DELETE FROM chefs WHERE email LIKE 'chef%@example.com';
DELETE FROM customers WHERE email LIKE 'user%@example.com';
DELETE FROM users WHERE email LIKE 'chef%@example.com' OR email LIKE 'user%@example.com';
```

### Check Data Counts:
```sql
SELECT 'Chefs' as type, COUNT(*) as count FROM chefs WHERE email LIKE 'chef%@example.com'
UNION ALL
SELECT 'Customers' as type, COUNT(*) as count FROM customers WHERE email LIKE 'user%@example.com'
UNION ALL
SELECT 'Chef Users' as type, COUNT(*) as count FROM users WHERE email LIKE 'chef%@example.com'
UNION ALL  
SELECT 'Customer Users' as type, COUNT(*) as count FROM users WHERE email LIKE 'user%@example.com';
```

## 🚀 Ready for Testing!
Your ChefAsap application now has comprehensive sample data for thorough testing of all features.