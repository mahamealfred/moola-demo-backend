
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import {rateLimit} from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import  { validateToken } from "./middleware/authMiddleware.js";
import { i18nManager, sharedConfig, loggerConfig } from "@moola/shared";

dotenv.config();

// Initialize shared configuration
const { database, redis, logger, config } = await sharedConfig.init({
  serviceName: 'api-gateway',
  enableDatabase: false, // API Gateway typically doesn't need direct DB access
  enableRedis: true
});

// Initialize i18n
await i18nManager.init();

const app = express();
const PORT = config.server.port || process.env.PORT || 4000;

// Security and parsing middleware
app.use(helmet());
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Language', 'Accept-Language'],
  exposedHeaders: ['X-Language']
}));
app.use(express.json({ limit: config.server.bodyLimit }));

// Add shared middleware
app.use(loggerConfig.getRequestLogger());
app.use(i18nManager.middleware());

// Add language forwarding middleware
app.use((req, res, next) => {
  // Ensure language headers are preserved for downstream services
  req.headers['x-language'] = req.language;
  next();
});

// Rate limiting using shared configuration
const rateLimitConfig = config.rateLimit;
const ratelimitOptions = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

app.use(ratelimitOptions);

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

//setting up proxy for our identity service
app.use(
  "/v1/agency/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);
//setting up proxy for our account service
app.use(
  "/v1/agency/accounts",
  validateToken,
  proxy(process.env.ACCOUNT_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";

      // Forward the Bearer token if present
      const bearerToken = srcReq.headers["authorization"];
      if (bearerToken) {
        proxyReqOpts.headers["Authorization"] = bearerToken;
      }

      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);
//setting up proxy for our account service
app.use(
  "/v1/clients/payment",
  validateToken,
  proxy(process.env.CLIENT_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";

      // Forward the Bearer token if present
      const bearerToken = srcReq.headers["authorization"];
      if (bearerToken) {
        proxyReqOpts.headers["Authorization"] = bearerToken;
      }

      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Client service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);
//validation
app.use(
  "/v1/clients/validation",
  proxy(process.env.CLIENT_SERVICE_URL, proxyOptions)
);



//setting up proxy for our payment service agency prod
app.use(
  "/v1/agency",
  //validateToken,
  proxy(process.env.AGENCY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    //  proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Agency service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

app.use(
  "/v1/agency/thirdpartyagency/services/execute",
  validateToken,
  proxy(process.env.AGENCY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    //  proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Agency service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
  
);


app.use(
  "/v1/agency/thirdpartyagency/services/transactions/history",
  validateToken,
  proxy(process.env.AGENCY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    //  proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Agency service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
  
);




//Test validation env config
app.use(
  "/v1/agencytest/thirdpartyagency/services/execute",
  validateToken,
  proxy(process.env.TEST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    //  proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Test service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
  
);


app.use(
  "/v1/agencytest/thirdpartyagency/services/transactions/history",
  validateToken,
  proxy(process.env.TEST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    //  proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Test service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
  
);
app.use(
  "/v1/agencytest",
  proxy(process.env.TEST_SERVICE_URL, proxyOptions)
);




// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await sharedConfig.healthCheck();
    res.json({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'api-gateway',
      error: error.message
    });
  }
});

app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('🔄 Received shutdown signal, closing API Gateway gracefully...');
  
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
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.server.env}`);
  logger.info(`🌐 CORS Origin: ${config.server.corsOrigin}`);
  logger.info(`🔗 Services: ${JSON.stringify(config.services)}`);
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason?.message || reason);
});