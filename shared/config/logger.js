import winston from "winston";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Logger Configuration Manager
 * Centralized logging configuration for all Moola services
 */
class LoggerConfig {
  constructor() {
    this.logger = null;
  }

  /**
   * Initialize logger
   * @param {Object} options - Logger configuration options
   */
  init(options = {}) {
    const serviceName = options.serviceName || process.env.SERVICE_NAME || "moola-service";
    const logLevel = options.level || process.env.LOG_LEVEL || "info";
    const logFormat = options.format || this.getDefaultFormat(serviceName);

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    // Add file transport if specified
    if (options.enableFileLogging || process.env.ENABLE_FILE_LOGGING === "true") {
      const logDir = options.logDirectory || process.env.LOG_DIRECTORY || "./logs";
      
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/${serviceName}-error.log`,
          level: "error"
        }),
        new winston.transports.File({
          filename: `${logDir}/${serviceName}-combined.log`
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      defaultMeta: { 
        service: serviceName,
        timestamp: new Date().toISOString()
      },
      transports,
      exceptionHandlers: [
        new winston.transports.Console(),
        ...(options.enableFileLogging ? [
          new winston.transports.File({ filename: `./logs/${serviceName}-exceptions.log` })
        ] : [])
      ],
      rejectionHandlers: [
        new winston.transports.Console(),
        ...(options.enableFileLogging ? [
          new winston.transports.File({ filename: `./logs/${serviceName}-rejections.log` })
        ] : [])
      ]
    });

    // Create request logger middleware
    this.requestLogger = (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          language: req.language || 'en'
        };

        if (res.statusCode >= 400) {
          this.logger.warn('HTTP Request', logData);
        } else {
          this.logger.info('HTTP Request', logData);
        }
      });

      next();
    };

    return this.logger;
  }

  /**
   * Get default log format
   */
  getDefaultFormat(serviceName) {
    return winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: service || serviceName,
          message,
          ...meta
        });
      })
    );
  }

  /**
   * Get the logger instance
   */
  getInstance() {
    if (!this.logger) {
      throw new Error("Logger not initialized. Call init() first.");
    }
    return this.logger;
  }

  /**
   * Get request logger middleware
   */
  getRequestLogger() {
    if (!this.requestLogger) {
      throw new Error("Logger not initialized. Call init() first.");
    }
    return this.requestLogger;
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.getInstance().info(message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.getInstance().error(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.getInstance().warn(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.getInstance().debug(message, meta);
  }
}

// Export singleton instance
const loggerConfig = new LoggerConfig();

export { loggerConfig as default, LoggerConfig };