import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Redis Configuration Manager
 * Centralized Redis configuration for all Moola services
 */
class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   * @param {Object} options - Redis connection options
   */
  init(options = {}) {
    try {
      const config = {
        host: options.host || process.env.REDIS_HOST || "localhost",
        port: options.port || parseInt(process.env.REDIS_PORT) || 6379,
        password: options.password || process.env.REDIS_PASSWORD,
        db: options.db || parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: options.retryDelayOnFailover || 100,
        enableReadyCheck: options.enableReadyCheck !== undefined ? options.enableReadyCheck : true,
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        lazyConnect: options.lazyConnect !== undefined ? options.lazyConnect : true,
        keepAlive: options.keepAlive || 30000,
        ...options.additionalOptions
      };

      // Use full URL if provided
      if (options.url || process.env.REDIS_URL) {
        this.client = new Redis(options.url || process.env.REDIS_URL);
      } else {
        this.client = new Redis(config);
      }

      // Event listeners
      this.client.on("connect", () => {
        console.log("✅ Redis connection established");
        this.isConnected = true;
      });

      this.client.on("error", (error) => {
        console.error("❌ Redis connection error:", error);
        this.isConnected = false;
      });

      this.client.on("ready", () => {
        console.log("🚀 Redis client ready");
      });

      this.client.on("close", () => {
        console.log("📴 Redis connection closed");
        this.isConnected = false;
      });

      return this.client;
    } catch (error) {
      console.error("❌ Failed to initialize Redis:", error);
      throw error;
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient() {
    if (!this.client) {
      throw new Error("Redis not initialized. Call init() first.");
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady() {
    return this.isConnected && this.client && this.client.status === "ready";
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log("Redis connection closed.");
    }
  }

  /**
   * Health check for Redis
   */
  async healthCheck() {
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
const redisConfig = new RedisConfig();

export { redisConfig as default, RedisConfig };