import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Database Configuration Manager
 * Centralized database configuration for all Moola services
 */
class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   * @param {Object} options - Database connection options
   */
  async init(options = {}) {
    try {
      const config = {
        host: options.host || process.env.DB_HOST || "localhost",
        port: options.port || process.env.DB_PORT || 3306,
        dialect: options.dialect || process.env.DB_DIALECT || "mysql",
        logging: options.logging !== undefined ? options.logging : (process.env.NODE_ENV === 'development' ? console.log : false),
        pool: {
          max: options.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
          min: options.minConnections || parseInt(process.env.DB_MIN_CONNECTIONS) || 0,
          acquire: options.acquireTimeout || parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
          idle: options.idleTimeout || parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
        ...options.additionalOptions
      };

      this.sequelize = new Sequelize(
        options.database || process.env.DB_NAME,
        options.username || process.env.DB_USER,
        options.password || process.env.DB_PASS,
        config
      );

      // Test the connection
      await this.sequelize.authenticate();
      console.log(`✅ Database connection established successfully for ${process.env.DB_NAME || 'database'}`);
      this.isConnected = true;

      return this.sequelize;
    } catch (error) {
      console.error("❌ Unable to connect to the database:", error);
      throw error;
    }
  }

  /**
   * Get the Sequelize instance
   */
  getInstance() {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.sequelize;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      console.log("Database connection closed.");
    }
  }

  /**
   * Check if database is connected
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * Sync database models
   * @param {Object} options - Sync options
   */
  async sync(options = {}) {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call init() first.");
    }
    
    const syncOptions = {
      force: options.force || false,
      alter: options.alter || false,
      logging: options.logging !== undefined ? options.logging : console.log,
      ...options
    };

    return await this.sequelize.sync(syncOptions);
  }
}

// Export singleton instance
const databaseConfig = new DatabaseConfig();

export { databaseConfig as default, DatabaseConfig };