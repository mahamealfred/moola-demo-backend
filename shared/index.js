const { i18nManager, createResponse, createErrorResponse } = require('./utils/i18n');

// Import configuration modules
const {
  default: sharedConfig,
  SharedConfig,
  databaseConfig,
  redisConfig,
  loggerConfig,
  appConfig
} = require('./config/index.js');

module.exports = {
  // i18n exports
  i18nManager,
  createResponse,
  createErrorResponse,
  // Configuration exports
  sharedConfig,
  SharedConfig,
  databaseConfig,
  redisConfig,
  loggerConfig,
  appConfig
};