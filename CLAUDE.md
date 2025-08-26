# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready KTV (Karaoke) booking application built with uni-app for cross-platform frontend development and PHP for the backend REST API. The system features real SMS verification via Alibaba Cloud, GPS-based location services, distance-calculated venue sorting, and comprehensive booking management with an admin dashboard.

### Key Features
- **Real SMS Integration**: Alibaba Cloud SMS with rate limiting (60s interval, 10 daily limit per phone)
- **Location Services**: GPS positioning with Haversine distance calculation for venue sorting
- **Cross-Platform**: WeChat Mini Program, iOS/Android apps, and H5 web support
- **Admin Dashboard**: Complete CRUD operations for venue and booking management
- **Security**: JWT tokens, prepared statements, CORS headers, input validation

## Architecture

### Frontend (`ktvapp/` directory)
- **Framework**: uni-app (Vue.js 3) for cross-platform development
- **Target Platforms**: WeChat Mini Program (`mp-weixin`), Android/iOS apps
- **Pages Structure**:
  - `login/` - SMS verification code login
  - `index/` - Main page with KTV listings and user info
  - `mine/` - User profile and settings
  - `booking/` - KTV booking details and form
  - `bookings/` - User's booking history

### Backend (`ktv-api/` directory)
- **Language**: PHP 7.4+ (tested with PHP 8.2)
- **Database**: MySQL 5.7+ with PDO, utf8mb4 charset
- **Architecture**: RESTful API with modular design
- **SMS Integration**: Dual implementation - HTTP API (simple) and SDK (full-featured)
- **Security**: PDO prepared statements, JWT tokens, rate limiting, input validation
- **Features**: Real-time distance calculation, booking status management, admin authentication

### Database Schema
- `users` - User profiles with phone (unique), nickname, avatar, VIP level
- `verification_codes` - SMS codes with expiration (5min), usage tracking, daily limits
- `ktv_venues` - Venue data with GPS coordinates (lat/lng DECIMAL(10,7)), ratings, status
- `room_types` - Package room categories with capacity and pricing
- `bookings` - Reservations with status workflow (pending→confirmed→completed/cancelled)
- `admins` - Admin accounts with bcrypt hashed passwords

## Development Commands

### Quick Start
```bash
# 1. Initialize database with sample data
./setup-database.sh

# 2. Start backend server (public access for domain)
./start-backend-public.sh

# 3. Frontend: Open ktvapp/ in HBuilderX and run to target platform
```

### Backend Development
```bash
# Local development (localhost:3000)
./start-backend.sh

# Public access with domain support (0.0.0.0:3000)
./start-backend-public.sh

# Manual server start with custom port
cd ktv-api && php -S localhost:8080

# Test SMS functionality
php ktv-api/test_sms_simple.php

# Database operations
mysql -u root -p < ktv-api/init_db.sql          # Initialize
mysql -u root -p ktv_booking                    # Connect to DB
```

### Frontend Development
```bash
# HBuilderX workflow:
# 1. Open ktvapp/ project
# 2. Run → WeChat Developer Tools (for mini-program)
# 3. Run → Chrome (for H5 testing)
# 4. Publish → Various platforms (production builds)

# Key files to modify:
# - pages.json (routing configuration)
# - manifest.json (app configuration)
# - pages/*/**.vue (page components)
```

### Testing & Debugging
```bash
# API testing with curl
curl -X POST http://catdog.dachaonet.com/send_code.php \
  -H "Content-Type: application/json" \
  -d '{"phone":"18663764585"}'

# Database verification
mysql -u root -p ktv_booking -e "SELECT * FROM users LIMIT 5;"

# Check logs
tail -f /var/log/php_errors.log
```

## Configuration

### Backend Configuration
```php
// ktv-api/config.php - Database settings
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '123456');  // Update for production
define('DB_NAME', 'ktv_booking');
```

```php
// ktv-api/aliyun_sms_simple.php - SMS configuration
define('ALIYUN_ACCESS_KEY_ID', 'LTAI5tAgxEfwZrWw1sSpm9qF');
define('ALIYUN_SMS_SIGN_NAME', '大潮网络');
define('ALIYUN_SMS_TEMPLATE_CODE', 'SMS_474780238');
define('SMS_DAILY_LIMIT', 10);      // Per phone per day
define('SMS_SEND_INTERVAL', 60);    // Seconds between sends
```

### Production Domain Configuration
- **Current Domain**: `catdog.dachaonet.com` (hardcoded in frontend)
- **Local Access**: `localhost:3000`
- **Admin Panel**: `http://catdog.dachaonet.com/admin/`

### Frontend Configuration
```json
// ktvapp/manifest.json - App settings
{
  "name": "ktvapp",
  "appid": "__UNI__836C48E",
  "mp-weixin": {
    "appid": "wx2ef4744e64c7bc45"
  },
  "vueVersion": "3"
}
```

### API Endpoints
**User Endpoints:**
- `POST /send_code.php` - SMS verification (rate limited)
- `POST /login.php` - Phone + SMS code authentication
- `GET /get_ktv_list.php?latitude=X&longitude=Y` - Venues with distance sorting
- `POST /create_booking.php` - Create reservation
- `GET /get_user_bookings.php` - User booking history

**Admin Endpoints:**
- `POST /admin_login.php` - Admin authentication
- `GET /get_admin_stats.php` - Dashboard statistics
- `GET /get_admin_bookings.php` - All bookings management
- `POST /create_ktv.php` - Add venue
- `POST /update_ktv.php` - Edit venue
- `POST /update_booking_status.php` - Change booking status

## Key Features & Implementation Details

### SMS Authentication System
```php
// Dual SMS implementation:
// 1. aliyun_sms_simple.php - HTTP API (no SDK required)
// 2. sms_config.php - Full SDK implementation

// Security features:
- Rate limiting: 60 seconds between requests
- Daily limits: 10 SMS per phone number
- Code expiration: 5 minutes
- One-time use: Codes marked as used after verification
- Input validation: Phone format, code format
```

### Location-Based Services
```sql
-- Haversine formula for distance calculation
SELECT *, 
(6371000 * acos(
    cos(radians(?)) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(?)) + 
    sin(radians(?)) * sin(radians(latitude))
)) AS distance
FROM ktv_venues 
WHERE status = 'active'
HAVING distance <= ?
ORDER BY distance ASC
```

**Frontend GPS Integration:**
- `uni.getLocation()` with gcj02 coordinate system
- Permission handling with fallback to default list
- User experience: Loading states, permission dialogs
- Distance display: "500m" or "1.2km" formatting

### Booking Workflow
**Status Flow:** `pending → confirmed → completed/cancelled`

**Data Structure:**
```javascript
// Booking creation payload
{
  user_id: 123,
  ktv_id: 1,
  ktv_name: "星光KTV",
  booking_time: "2025-08-26 19:00",
  room_type: "中包厢",
  people_count: "6-8人",
  remark: "生日聚会"
}
```

### Cross-Platform Architecture
**Conditional Compilation:**
```javascript
// #ifdef MP-WEIXIN
// WeChat mini-program specific code
// #endif

// #ifdef APP-PLUS
// Native app specific code
// #endif
```

**Platform-Specific Features:**
- Mini-program: Custom navigation, tab bar
- App: GPS permissions, system settings integration
- H5: Responsive design, browser compatibility

## Testing & Debugging

### Test Credentials
```bash
# User login (development)
Phone: Any 11-digit number (e.g., 18663764585)
SMS Code: 1234 (development mode)

# User login (production with real SMS)
Phone: 18663764585
SMS Code: Received via Alibaba Cloud SMS

# Admin access
URL: http://catdog.dachaonet.com/admin/
Username: admin
Password: admin123
```

### Development Testing
```bash
# SMS functionality test
php ktv-api/test_sms_simple.php

# API endpoint testing
curl -X POST http://catdog.dachaonet.com/send_code.php \
  -H "Content-Type: application/json" \
  -d '{"phone":"18663764585"}'

curl -X POST http://catdog.dachaonet.com/login.php \
  -H "Content-Type: application/json" \
  -d '{"phone":"18663764585","code":"1234"}'
```

### Common Issues & Solutions

**1. SMS Rate Limiting**
```sql
-- Check daily SMS count
SELECT COUNT(*) FROM verification_codes 
WHERE phone = '18663764585' AND DATE(created_at) = CURDATE();

-- Reset for testing (use carefully)
DELETE FROM verification_codes WHERE phone = '18663764585';
```

**2. Location Permission Issues**
```javascript
// Frontend debugging
console.log('Location permission status:', this.locationPermissionGranted);
console.log('User location:', this.userLocation);

// Common fix: Check scope.userLocation in manifest.json
```

**3. Database Connection**
```bash
# Test database connection
mysql -u root -p123456 -e "USE ktv_booking; SHOW TABLES;"

# Check PHP PDO connection
php -r "try { \$pdo = new PDO('mysql:host=localhost;dbname=ktv_booking', 'root', '123456'); echo 'Connected\n'; } catch(Exception \$e) { echo 'Failed: ' . \$e->getMessage(); }"
```

**4. CORS Issues**
Check that `config.php` includes:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## Advanced Development Patterns

### Frontend Architecture Patterns
```javascript
// Vue 3 Composition API usage
export default {
  data() {
    return {
      userLocation: null,
      locationPermissionGranted: false
    }
  },
  async onLoad() {
    await this.getUserLocation(); // Location first
    // getKtvList() called automatically after successful location
  }
}
```

**State Management:**
- `uni.getStorageSync()` / `uni.setStorageSync()` for persistence
- Component data for reactive UI state
- Global user info in storage: `userInfo`, `token`

**Asset Organization:**
```
static/
├── yue.jpg           # User avatars
├── k-logo.jpg        # App logos
├── tabbar/           # Tab bar icons
└── [device-specific] # Platform variations
```

### Backend Security & Patterns
```php
// Standard API response format
function response($success = true, $message = '', $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Input validation pattern
$phone = $data['phone'] ?? '';
if (empty($phone) || !validatePhone($phone)) {
    response(false, '请输入正确的手机号');
}

// Rate limiting pattern
if (!$smsService->checkSendLimit($phone)['allowed']) {
    response(false, 'Rate limit exceeded');
}
```

### Database Best Practices
```sql
-- Proper indexing for performance
CREATE INDEX idx_ktv_venues_location ON ktv_venues(latitude, longitude);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- Timezone consistency
SET time_zone = '+08:00';  -- Set in connection

-- Distance query optimization
SELECT * FROM ktv_venues 
WHERE latitude BETWEEN ? AND ?   -- Bounding box first
AND longitude BETWEEN ? AND ?
HAVING distance <= ?              -- Then calculate distance
ORDER BY distance LIMIT 50;
```

### Development Workflow Best Practices

**1. Environment Setup**
```bash
# Development checklist:
□ MySQL server running
□ Database initialized with sample data
□ Backend server started (with domain access)
□ HBuilderX project opened
□ WeChat Developer Tools connected
```

**2. Code Changes Workflow**
```bash
# Frontend changes:
1. Edit .vue files in ktvapp/pages/
2. Save → Auto-reload in dev tools
3. Test on multiple platforms

# Backend changes:
1. Edit .php files in ktv-api/
2. No restart needed (PHP-FPM)
3. Test with curl/Postman
4. Check error logs

# Database changes:
1. Update init_db.sql
2. Test changes on copy database
3. Run migration script or re-initialize
```

**3. API URL Management**
**Critical:** When changing domains, update these hardcoded URLs:
```javascript
// ktvapp/pages/login/login.vue:165,223
url: 'http://catdog.dachaonet.com/send_code.php'
url: 'http://catdog.dachaonet.com/login.php'

// ktvapp/pages/index/index.vue:218
url: 'http://catdog.dachaonet.com/get_ktv_list.php'
```

**Better Approach:** Create a config file:
```javascript
// ktvapp/config.js
export const API_BASE_URL = 'http://catdog.dachaonet.com';

// Usage in components
import { API_BASE_URL } from '../config.js';
const res = await uni.request({
  url: `${API_BASE_URL}/send_code.php`,
  // ...
});
```

## Production Deployment

### Backend Production Setup
```bash
# 1. Server preparation
sudo apt update && sudo apt install -y nginx php8.2-fpm php8.2-mysql mysql-server

# 2. Database setup
mysql -u root -p
CREATE DATABASE ktv_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ktv_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL ON ktv_booking.* TO 'ktv_user'@'localhost';
source /path/to/init_db.sql;

# 3. PHP configuration
sudo nano /etc/php/8.2/fpm/php.ini
# Set timezone: date.timezone = "Asia/Shanghai"
# Enable error logging: log_errors = On

# 4. Nginx configuration (use provided nginx-proxy.conf)
sudo cp nginx-proxy.conf /etc/nginx/sites-available/ktv-api
sudo ln -s /etc/nginx/sites-available/ktv-api /etc/nginx/sites-enabled/
```

**Production Configuration Updates:**
```php
// ktv-api/config.php - Production settings
define('DB_HOST', 'localhost');
define('DB_USER', 'ktv_user');
define('DB_PASS', 'secure_password');
define('DB_NAME', 'ktv_booking');

// Remove debug information in production
$responseData = null; // Don't return codes in production
if ($_SERVER['SERVER_NAME'] === 'localhost') { 
  // Only in development
}
```

**Security Checklist:**
- [ ] Change database credentials
- [ ] Enable HTTPS with SSL certificates
- [ ] Remove debug endpoints
- [ ] Set up log rotation
- [ ] Configure firewall (ports 80, 443, 22 only)
- [ ] Regular security updates

### Frontend Production Deployment

**WeChat Mini Program:**
```bash
# 1. HBuilderX → Publish → WeChat Mini Program
# 2. WeChat Developer Tools → Upload → Submit for review
# 3. WeChat MP Admin → Version management → Release
```

**Mobile Apps:**
```bash
# 1. HBuilderX → Publish → App Cloud Packaging
# 2. Configure certificates (iOS) / keystore (Android)
# 3. Upload to App Store / Google Play
```

**H5 Web Version:**
```bash
# 1. HBuilderX → Publish → Web (H5)
# 2. Upload dist files to web server
# 3. Configure domain and SSL
```

### Monitoring & Maintenance

**Log Management:**
```bash
# PHP error logs
tail -f /var/log/php8.2-fpm.log

# Nginx access/error logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# SMS service logs (from error_log() calls)
tail -f /var/log/syslog | grep "SMS"
```

**Database Maintenance:**
```sql
-- Clean expired verification codes (run daily)
DELETE FROM verification_codes WHERE expires_at < NOW() - INTERVAL 1 DAY;

-- Monitor SMS usage
SELECT DATE(created_at) as date, COUNT(*) as sms_sent 
FROM verification_codes 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at);

-- Booking statistics
SELECT status, COUNT(*) as count FROM bookings GROUP BY status;
```

**Backup Strategy:**
```bash
# Daily database backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u ktv_user -p ktv_booking > /backups/ktv_booking_$DATE.sql
find /backups -name "ktv_booking_*.sql" -mtime +7 -delete

# Add to crontab
0 2 * * * /path/to/backup_script.sh
```