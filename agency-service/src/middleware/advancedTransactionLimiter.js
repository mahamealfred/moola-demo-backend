// middleware/advancedTransactionLimiter.js
import Redis from "ioredis";
import logger from "../utils/logger.js";

const redisClient = new Redis(process.env.REDIS_URL);

/**
 * Advanced transaction limiter with user-based and IP-based protection
 * Updated for airtime/topup transaction structure
 */
export const advancedTransactionLimiter = () => {
  return async (req, res, next) => {
    if (!req.path.includes('/transfer') && !req.path.includes('/execute')) {
      return next();
    }

    try {
      const { email, clientPhone, customerId, billerCode, productCode, amount, ccy, requestId } = req.body;
      
      // Use customerId or clientPhone as user identifier
      const userId = customerId || clientPhone || 'anonymous';
      const userIp = req.ip;
      
      // Create unique keys based on your transaction structure
      const exactTransactionKey = `exact_tx:${customerId}:${billerCode}:${productCode}:${amount}:${ccy}:${requestId}`;
      const similarTransactionKey = `similar_tx:${customerId}:${billerCode}:${productCode}:${Math.round(amount)}:${requestId}`; // Rounded amount
      const phoneTransactionKey = `phone_tx:${clientPhone}:${billerCode}:${productCode}:${amount}:${requestId}`;
      const userRecentKey = `user_recent:${userId}`;
      const ipRecentKey = `ip_recent:${userIp}`;
      
      // Check exact transaction match (same customer, same biller, same product, same amount)
      const exactMatch = await redisClient.get(exactTransactionKey);
      if (exactMatch) {
        logger.warn(`Exact duplicate transaction detected for customer ${customerId}`);
        return res.status(429).json({
          success: false,
          message: "You cannot perform the same transaction within a 3 minute window"
        });
      }
      
      // Check for same phone number transactions
      if (clientPhone) {
        const phoneMatch = await redisClient.get(phoneTransactionKey);
        if (phoneMatch) {
          logger.warn(`Duplicate transaction detected for phone ${clientPhone}`);
          return res.status(429).json({
            success: false,
            message: "You cannot perform the same transaction within a 3 minute window"
          });
        }
      }
      
      // Check for similar transactions (same customer, same biller, similar amount)
      const similarMatch = await redisClient.get(similarTransactionKey);
      if (similarMatch) {
        const similarData = JSON.parse(similarMatch);
        const timeDiff = (Date.now() - new Date(similarData.timestamp).getTime()) / 1000 / 60;
        
        if (timeDiff < 3) { // 3 minutes
          logger.warn(`Similar transaction detected for customer ${customerId}`);
          return res.status(429).json({
            success: false,
            message: "You cannot g perform a similar transaction for the same service within a 3 minute window"
          });
        }
      }
      
      // Store transaction data
      const transactionData = {
        timestamp: new Date().toISOString(),
        userId,
        userIp,
        email,
        clientPhone,
        customerId,
        billerCode,
        productCode,
        amount,
        ccy,
        requestId
      };
      
      // Store exact transaction (3 minutes)
      await redisClient.setex(exactTransactionKey, 180, JSON.stringify(transactionData));
      
      // Store similar transaction (5 minutes)
      await redisClient.setex(similarTransactionKey, 300, JSON.stringify(transactionData));
      
      // Store phone-based transaction (3 minutes)
      if (clientPhone) {
        await redisClient.setex(phoneTransactionKey, 180, JSON.stringify(transactionData));
      }
      
      // Track user's recent transactions
      await redisClient.lpush(userRecentKey, exactTransactionKey);
      await redisClient.ltrim(userRecentKey, 0, 4); // Keep last 5 transactions
      await redisClient.expire(userRecentKey, 600); // 10 minutes
      
      // Track IP's recent transactions
      await redisClient.lpush(ipRecentKey, exactTransactionKey);
      await redisClient.ltrim(ipRecentKey, 0, 9); // Keep last 10 transactions
      await redisClient.expire(ipRecentKey, 600); // 10 minutes
      
      next();
    } catch (error) {
      logger.error('Advanced transaction limiter error:', error);
      next(); // Fail open - allow transaction on error
    }
  };
};