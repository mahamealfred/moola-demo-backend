# Multi-Language Support for Moola Services

This implementation provides internationalization (i18n) support across all Moola microservices with Kinyarwanda as the default language, along with English and French support.

## Features

- **Default Language**: Kinyarwanda (rw)
- **Supported Languages**: Kinyarwanda (rw), English (en), French (fr)
- **Shared Translation Files**: Centralized in the `shared/locales` folder
- **Automatic Language Detection**: From headers, query parameters, or defaults to Kinyarwanda
- **Express Middleware**: Automatically adds translation functions to requests

## Folder Structure

```
shared/
├── locales/
│   ├── rw.json       # Kinyarwanda (default)
│   ├── en.json       # English
│   └── fr.json       # French
├── utils/
│   ├── i18n.js       # CommonJS version
│   └── i18n.mjs      # ES Module version
├── index.js          # CommonJS exports
├── index.mjs         # ES Module exports
└── package.json
```

## How to Use

### 1. Language Detection

The system automatically detects language from:
1. Query parameter: `?lang=rw|en|fr`
2. Accept-Language header
3. Custom header: `x-language`
4. Falls back to Kinyarwanda (rw) as default

### 2. In Controllers

```javascript
import { createResponse, createErrorResponse } from "@moola/shared";

export const someController = async (req, res) => {
  try {
    // Success response with translation
    res.status(200).json(createResponse(
      true, 
      'account.transaction_success', 
      { transactionId: '123' }, 
      req.language
    ));
  } catch (error) {
    // Error response with translation
    res.status(400).json(createErrorResponse(
      'common.server_error', 
      req.language, 
      400
    ));
  }
};
```

### 3. Using the Translation Function

```javascript
// In any route handler after middleware
export const someHandler = (req, res) => {
  const message = req.t('common.success');
  const errorMessage = req.t('validation.email_invalid');
  
  res.json({
    success: true,
    message: message
  });
};
```

### 4. Client Usage Examples

```bash
# Default (Kinyarwanda)
curl http://localhost:4000/api/endpoint

# English
curl "http://localhost:4000/api/endpoint?lang=en"

# French  
curl "http://localhost:4000/api/endpoint?lang=fr"

# Using headers
curl -H "x-language: en" http://localhost:4000/api/endpoint
curl -H "Accept-Language: fr" http://localhost:4000/api/endpoint
```

## Translation Keys

### Common Messages
- `common.success` - Success message
- `common.error` - General error message  
- `common.server_error` - Internal server error
- `common.unauthorized` - Unauthorized access
- `common.not_found` - Resource not found

### Authentication
- `authentication.login_success` - Login successful
- `authentication.login_failed` - Login failed
- `authentication.invalid_credentials` - Invalid credentials
- `authentication.token_expired` - Token expired

### Account Operations
- `account.account_created` - Account created successfully
- `account.insufficient_balance` - Insufficient balance
- `account.transaction_success` - Transaction successful
- `account.transaction_failed` - Transaction failed

### Banking Operations
- `banking.deposit_success` - Deposit successful
- `banking.withdrawal_success` - Withdrawal successful
- `banking.transfer_success` - Transfer successful
- `banking.payment_success` - Payment successful

### Validation
- `validation.email_invalid` - Invalid email
- `validation.phone_invalid` - Invalid phone number
- `validation.required_fields_missing` - Required fields missing

## Adding New Translations

1. Add the new key-value pairs to all three language files:
   - `shared/locales/rw.json` (Kinyarwanda)
   - `shared/locales/en.json` (English) 
   - `shared/locales/fr.json` (French)

2. Use the new keys in your controllers:
   ```javascript
   const message = req.t('your.new.key');
   ```

## Services Updated

All services now include i18n support:
- ✅ account-service
- ✅ agency-service  
- ✅ api-gateway
- ✅ client-service
- ✅ identity-service
- ✅ test-agency-service

## Language Examples

### Kinyarwanda (Default)
```json
{
  "common": {
    "success": "Byagenze neza",
    "error": "Ikosa ryabaye"
  }
}
```

### English
```json
{
  "common": {
    "success": "Success", 
    "error": "Error occurred"
  }
}
```

### French
```json
{
  "common": {
    "success": "Succès",
    "error": "Une erreur s'est produite"  
  }
}
```

## Implementation Notes

- All services use the shared i18n module via `@moola/shared`
- Middleware automatically adds `req.t()` function and `req.language` property
- Helper functions `createResponse()` and `createErrorResponse()` standardize API responses
- Language fallback ensures users always get a response, defaulting to Kinyarwanda