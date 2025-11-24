
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import {rateLimit} from "express-rate-limit";
import {RedisStore} from "rate-limit-redis";
import {RateLimiterRedis} from "rate-limiter-flexible";
import errorHandler from "./middleware/errorHandler.js";
import routes from "./routes/client-service.js";
import { i18nManager, sharedConfig, loggerConfig } from "@moola/shared";

dotenv.config();

// Initialize shared configuration
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: 'client-service',
  enableDatabase: true,
  enableRedis: true,
  requiredConfig: ['redis.url']
});

// Initialize i18n
await i18nManager.init();

const app = express();
const PORT = config.server.port || process.env.PORT || 4003;

// Security and parsing middleware
app.use(helmet());
app.use(cors({
  origin: config.server.corsOrigin
}));
app.use(express.json({ limit: config.server.bodyLimit }));

// Add shared middleware
app.use(loggerConfig.getRequestLogger());
app.use(i18nManager.middleware());

// DDos protection and rate limiting using shared configuration
const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "client-middleware",
    points: 10,
    duration: 1,
  });
  
  app.use((req, res, next) => {
    rateLimiter
      .consume(req.ip)
      .then(() => next())
      .catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
      });
  });
  
  // IP based rate limiting for sensitive endpoints using shared config
  const rateLimitConfig = config.rateLimit;
  const sensitiveEndpointsLimiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.sensitiveMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
  });

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await sharedConfig.healthCheck();
    res.json({
      status: 'ok',
      service: 'client-service',
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'client-service',
      error: error.message
    });
  }
});

// Routes
app.use("/api/clients", routes);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('🔄 Received shutdown signal, closing server gracefully...');
  
  try {
    await sharedConfig.shutdown();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(PORT, () => {
    logger.info(`🚀 Client service running on port ${PORT}`);
    logger.info(`📊 Environment: ${config.server.env}`);
    logger.info(`🌐 CORS Origin: ${config.server.corsOrigin}`);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason?.message || reason);
});
  