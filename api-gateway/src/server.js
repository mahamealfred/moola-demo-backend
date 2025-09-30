
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import dotenv from "dotenv";
import {rateLimit} from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import logger from "./utils/logger.js";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import  { validateToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiting
const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

app.use(ratelimitOptions);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

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
        `Response received from Test service: ${proxyRes.statusCode}`
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
        `Response received from Test service: ${proxyRes.statusCode}`
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




app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(
    `Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(
    `Account service is running on port ${process.env.ACCOUNT_SERVICE_URL}`
  );
  logger.info(
    `Agency service is running on port ${process.env.AGENCY_SERVICE_URL}`
  );
  logger.info(
    `Client service is running on port ${process.env.CLIENT_SERVICE_URL}`
  );
    logger.info(
    `Test service is running on port ${process.env.TEST_SERVICE_URL}`
  );
   logger.info(`Redis Url ${process.env.REDIS_URL}`);
});