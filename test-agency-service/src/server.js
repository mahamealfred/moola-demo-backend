
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import {rateLimit} from "express-rate-limit";
import {RedisStore} from "rate-limit-redis";
import {RateLimiterRedis} from "rate-limiter-flexible";
import Redis from "ioredis";
import errorHandler from "./middleware/errorHandler.js";
import routes from "./routes/agency-service.js";
import { i18nManager } from "@moola/shared";

dotenv.config()

// Initialize i18n
await i18nManager.init();

const app = express();
const PORT = process.env.PORT || 4003


const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet())
app.use(cors())
app.use(express.json())

// Add i18n middleware
app.use(i18nManager.middleware());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
  });

  //DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
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
  
  //Ip based rate limiting for sensitive endpoints
  const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  });
  

  //apply this sensitiveEndpointsLimiter to our routes
//app.use("/api/account/", sensitiveEndpointsLimiter);

//Routes
app.use("/api/agencytest", routes);

  //error handler
app.use(errorHandler);



app.listen(PORT, () => {
    logger.info(`Agency Test service running on port ${PORT}`);
})

//unhandled promise rejection

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason?.message || reason);
  });
  