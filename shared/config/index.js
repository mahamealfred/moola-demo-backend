// Import configuration modules
import databaseConfig from './database.js';
import redisConfig from './redis.js';
import loggerConfig from './logger.js';
import appConfig from './app.js';

/**
 * Shared Configuration Manager
 * Centralized configuration initialization and management
 */
class SharedConfig {
  constructor() {
    this.initialized = false;
    this.database = databaseConfig;
    this.redis = redisConfig;
    this.logger = loggerConfig;
    this.app = appConfig;
  }

  /**
   * Initialize all configurations
   * @param {Object} options - Initialization options
   */
  async init(options = {}) {
    if (this.initialized) return;

    try {
      const serviceName = options.serviceName || process.env.SERVICE_NAME || 'moola-service';
      
      // Initialize logger first
      this.logger.init({
        serviceName,
        ...options.logger
      });

      this.logger.info(`🚀 Initializing ${serviceName} configuration...`);

      // Initialize Redis if enabled
      if (options.enableRedis !== false) {
        this.redis.init({
          ...this.app.getRedisConfig(),
          ...options.redis
        });
      }

      // Initialize Database if enabled
      if (options.enableDatabase !== false) {
        await this.database.init({
          ...this.app.getDatabaseConfig(),
          ...options.database
        });
        this.logger.info(`✅ Database connection established`);
      }

      // Validate required configuration if specified
      if (options.requiredConfig && Array.isArray(options.requiredConfig)) {
        this.app.validateRequired(options.requiredConfig);
      }

      this.initialized = true;
      this.logger.info(`✅ ${serviceName} configuration initialized successfully`);

      return {
        database: options.enableDatabase !== false ? this.database.getInstance() : null,
        redis: options.enableRedis !== false ? this.redis.getClient() : null,
        logger: this.logger.getInstance(),
        config: this.app.getAll()
      };

    } catch (error) {
      console.error('❌ Configuration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDatabase() {
    return this.database.getInstance();
  }

  /**
   * Get Redis client
   */
  getRedis() {
    return this.redis.getClient();
  }

  /**
   * Get logger instance
   */
  getLogger() {
    return this.logger.getInstance();
  }

  /**
   * Get app configuration
   */
  getConfig() {
    return this.app;
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const health = {
      database: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Check database
      if (this.database.isReady()) {
        await this.database.getInstance().authenticate();
        health.database = true;
      }
    } catch (error) {
      this.logger.error('Database health check failed:', error);
    }

    try {
      // Check Redis
      health.redis = await this.redis.healthCheck();
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
    }

    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('🔄 Shutting down shared configurations...');

    try {
      await Promise.all([
        this.database.close(),
        this.redis.disconnect()
      ]);

      this.logger.info('✅ Graceful shutdown completed');
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
const sharedConfig = new SharedConfig();

export { 
  sharedConfig as default,
  SharedConfig,
  databaseConfig,
  redisConfig,
  loggerConfig,
  appConfig
};