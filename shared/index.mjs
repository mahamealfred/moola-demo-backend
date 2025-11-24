import { i18nManager, createResponse, createErrorResponse } from './utils/i18n.mjs';

// Import configuration modules
import {
  default as sharedConfig,
  SharedConfig,
  databaseConfig,
  redisConfig,
  loggerConfig,
  appConfig
} from './config/index.js';

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