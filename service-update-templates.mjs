#!/usr/bin/env node

/**
 * Service Update Script Generator
 * Generates updated server.js files for all services to use shared configuration
 */

const services = [
  {
    name: 'api-gateway',
    port: 4000,
    routes: './middleware/authMiddleware.js',
    additionalImports: ['proxy from "express-http-proxy"'],
    middleware: ['validateToken']
  },
  {
    name: 'account-service', 
    port: 4002,
    routes: './routes/account-service.js',
    additionalImports: [],
    middleware: []
  },
  {
    name: 'client-service',
    port: 4002,
    routes: './routes/client-service.js', 
    additionalImports: [],
    middleware: []
  },
  {
    name: 'identity-service',
    port: 4004,
    routes: './routes/identity-service.js',
    additionalImports: ['sequelize from "./db/config.js"'],
    middleware: []
  }
];

services.forEach(service => {
  const template = `
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import {rateLimit} from "express-rate-limit";
import {RedisStore} from "rate-limit-redis";
import {RateLimiterRedis} from "rate-limiter-flexible";
import errorHandler from "./middleware/errorHandler.js";
import routes from "${service.routes}";
import { i18nManager, sharedConfig, loggerConfig } from "@moola/shared";
${service.additionalImports.map(imp => `import ${imp};`).join('\n')}

dotenv.config();

// Initialize shared configuration
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: '${service.name}',
  enableDatabase: true,
  enableRedis: true,
  requiredConfig: ['database.name', 'redis.url']
});

// Initialize i18n
await i18nManager.init();

const app = express();
const PORT = config.server.port || ${service.port};

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
  keyPrefix: "${service.name}-middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(\`Rate limit exceeded for IP: \${req.ip}\`);
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
    logger.warn(\`Sensitive endpoint rate limit exceeded for IP: \${req.ip}\`);
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
      service: '${service.name}',
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: '${service.name}',
      error: error.message
    });
  }
});

// Routes
app.use("/api/${service.name.replace('-service', '')}", routes);

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
    logger.info(\`🚀 \${service.name} running on port \${PORT}\`);
    logger.info(\`📊 Environment: \${config.server.env}\`);
    logger.info(\`🌐 CORS Origin: \${config.server.corsOrigin}\`);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason?.message || reason);
});
`;

  console.log(`\n📝 UPDATED SERVER.JS FOR ${service.name.toUpperCase()}:`);
  console.log('=' .repeat(60));
  console.log(template);
});

console.log('\n🎯 MIGRATION INSTRUCTIONS:');
console.log('1. Replace each service\'s server.js with the corresponding template above');
console.log('2. Adjust import paths as needed for each service');
console.log('3. Update route paths in the templates to match actual file locations');
console.log('4. Test each service after updating');
console.log('\n✅ All services will then use centralized shared configuration!');