# 🚀 Moola Shared Configuration Guide

## 📁 **Shared Configuration System**

The shared configuration system provides centralized management of:
- **Database Configuration** (MySQL/Sequelize)
- **Redis Configuration** (Redis client)
- **Logger Configuration** (Winston logging)
- **Application Configuration** (Environment variables)
- **I18n Configuration** (Multi-language support)

## 🔧 **Available Configurations**

### 1. **Database Configuration** (`databaseConfig`)
```javascript
import { databaseConfig } from '@moola/shared';

// Initialize database
await databaseConfig.init({
  database: 'moola_db',
  username: 'user',
  password: 'password',
  host: 'localhost'
});

// Get Sequelize instance
const sequelize = databaseConfig.getInstance();
```

### 2. **Redis Configuration** (`redisConfig`)
```javascript
import { redisConfig } from '@moola/shared';

// Initialize Redis
const redis = redisConfig.init({
  host: 'localhost',
  port: 6379
});

// Get Redis client
const client = redisConfig.getClient();
```

### 3. **Logger Configuration** (`loggerConfig`)
```javascript
import { loggerConfig } from '@moola/shared';

// Initialize logger
const logger = loggerConfig.init({
  serviceName: 'my-service',
  level: 'info'
});

// Use logger
logger.info('Service started');
logger.error('Error occurred', { error: 'details' });

// Get request logging middleware
app.use(loggerConfig.getRequestLogger());
```

### 4. **Application Configuration** (`appConfig`)
```javascript
import { appConfig } from '@moola/shared';

// Get specific config
const dbConfig = appConfig.getDatabaseConfig();
const serverConfig = appConfig.getServerConfig();

// Get config by path
const port = appConfig.get('server.port');
const dbHost = appConfig.get('database.host');

// Validate required config
appConfig.validateRequired(['database.name', 'redis.url']);
```

### 5. **Complete Shared Configuration** (`sharedConfig`)
```javascript
import { sharedConfig } from '@moola/shared';

// Initialize everything at once
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: 'agency-service',
  enableDatabase: true,
  enableRedis: true,
  requiredConfig: ['database.name', 'redis.url']
});

// Health check
const health = await sharedConfig.healthCheck();

// Graceful shutdown
await sharedConfig.shutdown();
```

## 🔄 **Service Update Template**

### **Before (Old Way):**
```javascript
import express from "express";
import { Sequelize } from "sequelize";
import Redis from "ioredis";
import winston from "winston";
import dotenv from "dotenv";

dotenv.config();

// Manual database setup
const sequelize = new Sequelize(process.env.DB_NAME, ...);

// Manual Redis setup
const redis = new Redis(process.env.REDIS_URL);

// Manual logger setup
const logger = winston.createLogger(...);
```

### **After (Shared Config):**
```javascript
import express from "express";
import { sharedConfig, i18nManager } from "@moola/shared";

// Centralized configuration
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: 'my-service',
  enableDatabase: true,
  enableRedis: true
});

// Initialize i18n
await i18nManager.init();
```

## 📋 **Environment Variables**

Create a `.env` file with these variables:

```env
# Server Configuration
PORT=4001
HOST=localhost
NODE_ENV=development
CORS_ORIGIN=*
BODY_LIMIT=50mb

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moola_db
DB_USER=root
DB_PASS=password
DB_DIALECT=mysql
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=0

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SENSITIVE_MAX=5

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
LOG_DIRECTORY=./logs

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
ENABLE_HELMET=true
ENABLE_CORS=true

# Business Logic
DEFAULT_CURRENCY=RWF
MIN_WITHDRAW_AMOUNT=5000
MAX_DAILY_LIMIT=1000000
COMMISSION_RATE=0.02

# Languages
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,rw,fr,sw
FALLBACK_LANGUAGE=en

# Service URLs
API_GATEWAY_URL=http://localhost:4000
ACCOUNT_SERVICE_URL=http://localhost:4002
AGENCY_SERVICE_URL=http://localhost:4001
CLIENT_SERVICE_URL=http://localhost:4003
IDENTITY_SERVICE_URL=http://localhost:4004
```

## 🎯 **Migration Steps for Each Service**

### 1. **Update Package Dependencies**
```bash
# Remove individual dependencies (optional)
npm uninstall sequelize mysql2 ioredis winston dotenv

# The shared package now includes these
```

### 2. **Update Server File**
Replace individual imports with shared config:

```javascript
// OLD
import { Sequelize } from "sequelize";
import Redis from "ioredis";
import winston from "winston";

// NEW
import { sharedConfig, loggerConfig } from "@moola/shared";
```

### 3. **Initialize Shared Config**
```javascript
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: 'your-service-name',
  enableDatabase: true,
  enableRedis: true,
  requiredConfig: ['database.name', 'redis.url'] // Validate required config
});
```

### 4. **Update Middleware Usage**
```javascript
// Use shared logger middleware
app.use(loggerConfig.getRequestLogger());

// Use shared config values
app.use(cors({ origin: config.server.corsOrigin }));
app.use(express.json({ limit: config.server.bodyLimit }));
```

### 5. **Add Health Check Endpoint**
```javascript
app.get('/health', async (req, res) => {
  const health = await sharedConfig.healthCheck();
  res.json({
    status: 'ok',
    service: 'your-service-name',
    ...health
  });
});
```

### 6. **Add Graceful Shutdown**
```javascript
const gracefulShutdown = async () => {
  await sharedConfig.shutdown();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## ✅ **Benefits**

- **🔄 Consistency:** Same configuration across all services
- **🛠️ Maintainability:** Update config in one place
- **🚀 Quick Setup:** Initialize everything with one call
- **📊 Health Monitoring:** Built-in health checks
- **🔒 Security:** Centralized security configurations
- **📝 Logging:** Standardized logging across services
- **🌐 I18n:** Multi-language support everywhere
- **⚡ Performance:** Optimized database and Redis connections

## 🎊 **Ready to Use!**

All services can now use centralized configuration with:
```javascript
import { sharedConfig, i18nManager } from "@moola/shared";
```

**Your shared configuration system is production-ready!** 🚀