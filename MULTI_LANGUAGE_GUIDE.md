# 🌐 Moola Multi-Language Implementation Guide

## ✅ Implementation Status

All Moola microservices now support multi-language responses with:
- **🇷🇼 Kinyarwanda (rw)** - Default language
- **🇺🇸 English (en)** - Secondary language  
- **🇫🇷 French (fr)** - Third language

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   API Gateway   │───▶│  Microservices  │───▶│   Shared i18n    │
│  (Port 4000)    │    │                 │    │     Module       │
│                 │    │ • Identity      │    │                  │
│ • Language      │    │ • Account       │    │ • Translations   │
│   Detection     │    │ • Agency        │    │ • Utilities      │
│ • Header        │    │ • Client        │    │ • Middleware     │
│   Forwarding    │    │                 │    │                  │
└─────────────────┘    └─────────────────┘    └──────────────────┘
```

## 🚀 Quick Test Examples

### 1. **Login with Different Languages**

```bash
# Kinyarwanda (Default)
curl -X POST http://localhost:4000/v1/agency/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"test_user","password":"TestPass123!"}'

# English
curl -X POST "http://localhost:4000/v1/agency/auth/login?lang=en" \\
  -H "Content-Type: application/json" \\
  -d '{"username":"test_user","password":"TestPass123!"}'

# French  
curl -X POST http://localhost:4000/v1/agency/auth/login \\
  -H "Content-Type: application/json" \\
  -H "x-language: fr" \\
  -d '{"username":"test_user","password":"TestPass123!"}'
```

### 2. **Expected Response Examples**

**Success (Kinyarwanda):**
```json
{
  "success": true,
  "message": "Winjiye neza",
  "data": { ... }
}
```

**Success (English):**
```json
{
  "success": true,
  "message": "Login successful", 
  "data": { ... }
}
```

**Success (French):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": { ... }
}
```

**Error (Kinyarwanda):**
```json
{
  "success": false,
  "message": "Amazina y'ukoresha cyangwa ijambo ry'ibanga sibyo",
  "statusCode": 401
}
```

**Error (English):**
```json
{
  "success": false,
  "message": "Invalid username or password", 
  "statusCode": 401
}
```

**Error (French):**
```json
{
  "success": false,
  "message": "Nom d'utilisateur ou mot de passe incorrect",
  "statusCode": 401
}
```

## 📋 Service Endpoints

### **Identity Service (Port 4004)**
- `POST /api/agency/auth/login` - User login
- `POST /api/agency/auth/register` - User registration  
- `POST /api/agency/auth/logout` - User logout
- `GET /api/agency/auth/find/:user` - Find user

### **Account Service (Port 4002)**
- `GET /api/agency/accounts/balance` - Get account balance
- `GET /api/agency/accounts/history` - Get transaction history
- `POST /api/agency/accounts/topup` - Account top-up

### **Agency Service (Port 4001)**
- `POST /api/agency/banking/accounts/open` - Account opening
- `POST /api/agency/banking/deposit` - Cash deposit
- `POST /api/agency/banking/withdraw` - Cash withdrawal

### **Client Service (Port 4003)**  
- `POST /api/clients/payment/momo` - Mobile money payment
- `POST /api/clients/payment/airtime` - Airtime purchase

### **API Gateway (Port 4000)**
- `POST /v1/agency/auth/login` - Login via gateway
- `GET /v1/agency/accounts/balance` - Balance via gateway
- All endpoints prefixed with `/v1/`

## 🔧 Language Detection Methods

### **1. Query Parameter (Recommended)**
```bash
?lang=rw  # Kinyarwanda
?lang=en  # English  
?lang=fr  # French
```

### **2. Custom Header**
```bash
-H "x-language: rw"  # Kinyarwanda
-H "x-language: en"  # English
-H "x-language: fr"  # French
```

### **3. Accept-Language Header**
```bash
-H "Accept-Language: en-US,en;q=0.9"
-H "Accept-Language: fr-FR,fr;q=0.9"  
```

### **4. Priority Order**
1. Query parameter `?lang=`
2. Custom header `x-language`
3. Accept-Language header
4. **Default: Kinyarwanda (rw)**

## 🧪 Testing All Services

Run the comprehensive test suite:

```bash
node test-i18n-all-services.mjs
```

This will test:
- ✅ All 5 microservices
- ✅ All 3 languages (rw, en, fr)
- ✅ Success and error responses
- ✅ API Gateway routing
- ✅ Direct service access

## 📝 Development Usage

### **In Controllers:**
```javascript
import { createResponse, createErrorResponse } from '@moola/shared';

// Success response
res.status(200).json(createResponse(
  true, 
  'authentication.login_success', 
  userData, 
  req.language
));

// Error response  
res.status(401).json(createErrorResponse(
  'authentication.invalid_credentials', 
  req.language, 
  401
));

// Direct translation
const message = req.t('common.success'); // Uses request language
```

### **Available Translation Keys:**

**Common:**
- `common.success`
- `common.error` 
- `common.server_error`
- `common.unauthorized`
- `common.not_found`

**Authentication:**
- `authentication.login_success`
- `authentication.login_failed`
- `authentication.invalid_credentials`
- `authentication.token_expired`

**Account:**
- `account.account_created`
- `account.insufficient_balance`
- `account.transaction_success`
- `account.account_not_found`

**Banking:**
- `banking.deposit_success`
- `banking.withdrawal_success`
- `banking.transfer_success`
- `banking.payment_success`

**Validation:**
- `validation.email_invalid`
- `validation.phone_invalid`
- `validation.required_fields_missing`

## 🎯 Production Usage

### **Frontend Integration:**
```javascript
// Set user's preferred language
const userLanguage = getUserPreference(); // 'rw', 'en', or 'fr'

// API calls with language
fetch('/v1/agency/auth/login?lang=' + userLanguage, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-language': userLanguage
  },
  body: JSON.stringify(credentials)
});
```

### **Mobile App Integration:**
```javascript
// Axios with interceptors
axios.interceptors.request.use(config => {
  config.params = config.params || {};
  config.params.lang = getDeviceLanguage(); // Detect device language
  config.headers['x-language'] = getDeviceLanguage();
  return config;
});
```

## 📊 Features Implemented

- ✅ **Centralized Translations** - Single source of truth
- ✅ **Automatic Language Detection** - Multiple detection methods  
- ✅ **API Gateway Integration** - Language header forwarding
- ✅ **Consistent Response Format** - Standardized across services
- ✅ **Kinyarwanda Default** - As requested
- ✅ **Error Message Translation** - All error responses translated
- ✅ **Middleware Integration** - Seamless language detection
- ✅ **ES Module Support** - Modern JavaScript standards
- ✅ **Comprehensive Testing** - Test suite for all services

## 🔄 Next Steps

1. **Start Services:**
   ```bash
   # Terminal 1 - API Gateway
   cd api-gateway && npm start

   # Terminal 2 - Identity Service  
   cd identity-service && npm start

   # Terminal 3 - Account Service
   cd account-service && npm start

   # Terminal 4 - Agency Service
   cd agency-service && npm start

   # Terminal 5 - Client Service
   cd client-service && npm start
   ```

2. **Test the Implementation:**
   ```bash
   node test-i18n-all-services.mjs
   ```

3. **Use in Production:**
   - Deploy with environment variables
   - Configure load balancer to preserve headers
   - Monitor language usage analytics

## 🎉 Success!

Your Moola microservices now provide seamless multi-language support with Kinyarwanda as the default language, English and French as alternatives, all routing through a centralized API Gateway! 🚀