import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Application Configuration Manager
 * Centralized application configuration for all Moola services
 */
class AppConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables
   */
  loadConfig() {
    return {
      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 4005,
        host: process.env.HOST || "localhost",
        env: process.env.NODE_ENV || "development",
        corsOrigin: process.env.CORS_ORIGIN || "*",
        bodyLimit: process.env.BODY_LIMIT || "50mb"
      },

      // Database Configuration
      database: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 3306,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        dialect: process.env.DB_DIALECT || "mysql",
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        minConnections: parseInt(process.env.DB_MIN_CONNECTIONS) || 0,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
      },

      // Redis Configuration
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        url: process.env.REDIS_URL
      },

      // JWT Configuration
      jwt: {
        secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
      },

      // Rate Limiting Configuration
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        sensitiveMaxRequests: parseInt(process.env.RATE_LIMIT_SENSITIVE_MAX) || 5
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || "info",
        enableFileLogging: process.env.ENABLE_FILE_LOGGING === "true",
        logDirectory: process.env.LOG_DIRECTORY || "./logs"
      },

      // Security Configuration
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionSecret: process.env.SESSION_SECRET || "your-super-secret-session-key",
        enableHelmet: process.env.ENABLE_HELMET !== "false",
        enableCors: process.env.ENABLE_CORS !== "false"
      },

      // External API Configuration
      externalAPIs: {
        paymentGateway: {
          baseUrl: process.env.PAYMENT_GATEWAY_URL,
          apiKey: process.env.PAYMENT_GATEWAY_API_KEY,
          timeout: parseInt(process.env.PAYMENT_GATEWAY_TIMEOUT) || 30000
        },
        smsGateway: {
          baseUrl: process.env.SMS_GATEWAY_URL,
          apiKey: process.env.SMS_GATEWAY_API_KEY,
          timeout: parseInt(process.env.SMS_GATEWAY_TIMEOUT) || 10000
        },
        emailService: {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD,
          from: process.env.EMAIL_FROM || "noreply@moola.com"
        }
      },

      // Service URLs Configuration
      services: {
        apiGateway: process.env.API_GATEWAY_URL || "http://localhost:4000",
        accountService: process.env.ACCOUNT_SERVICE_URL || "http://localhost:4002",
        agencyService: process.env.AGENCY_SERVICE_URL || "http://localhost:4001",
        clientService: process.env.CLIENT_SERVICE_URL || "http://localhost:4003",
        identityService: process.env.IDENTITY_SERVICE_URL || "http://localhost:4004"
      },

      // Business Logic Configuration
      business: {
        defaultCurrency: process.env.DEFAULT_CURRENCY || "RWF",
        minimumWithdrawAmount: parseInt(process.env.MIN_WITHDRAW_AMOUNT) || 5000,
        maximumDailyLimit: parseInt(process.env.MAX_DAILY_LIMIT) || 1000000,
        commissionRate: parseFloat(process.env.COMMISSION_RATE) || 0.02,
        transactionTimeout: parseInt(process.env.TRANSACTION_TIMEOUT) || 300000 // 5 minutes
      },

      // Language Configuration
      i18n: {
        defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
        supportedLanguages: (process.env.SUPPORTED_LANGUAGES || "en,rw,fr,sw").split(","),
        fallbackLanguage: process.env.FALLBACK_LANGUAGE || "en"
      }
    };
  }

  /**
   * Get configuration value by key path
   * @param {string} keyPath - Dot notation key path (e.g., 'database.host')
   */
  get(keyPath) {
    return keyPath.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return this.config.server;
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * Get Redis configuration
   */
  getRedisConfig() {
    return this.config.redis;
  }

  /**
   * Get JWT configuration
   */
  getJWTConfig() {
    return this.config.jwt;
  }

  /**
   * Get rate limit configuration
   */
  getRateLimitConfig() {
    return this.config.rateLimit;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.config.security;
  }

  /**
   * Get external APIs configuration
   */
  getExternalAPIsConfig() {
    return this.config.externalAPIs;
  }

  /**
   * Get services URLs configuration
   */
  getServicesConfig() {
    return this.config.services;
  }

  /**
   * Get business logic configuration
   */
  getBusinessConfig() {
    return this.config.business;
  }

  /**
   * Get i18n configuration
   */
  getI18nConfig() {
    return this.config.i18n;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment() {
    return this.config.server.env === "development";
  }

  /**
   * Check if running in production mode
   */
  isProduction() {
    return this.config.server.env === "production";
  }

  /**
   * Validate required configuration
   */
  validateRequired(requiredKeys = []) {
    const missing = [];
    
    for (const key of requiredKeys) {
      if (!this.get(key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
    }

    return true;
  }
}

// Export singleton instance
const appConfig = new AppConfig();

export { appConfig as default, AppConfig };