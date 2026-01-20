import { i18nManager, createResponse, createErrorResponse } from './utils/i18n.mjs';

// Import configuration modules
import sharedConfig from './config/index.js';
import { SharedConfig, databaseConfig, redisConfig, loggerConfig, appConfig } from './config/index.js';

export {
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