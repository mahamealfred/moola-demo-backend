/**
 * Mock Payment Service
 * Intercepts payment API calls and returns dummy responses
 * This prevents actual calls to third-party payment APIs during testing
 */

import {
  getDummyValidationData,
  getDummyPaymentResponse,
  getDummyTransactionStatus,
  DUMMY_PAYMENT_DATA,
} from './dummy-payment-data.js';

// Simple logger function
const logger = {
  info: (msg, data) => console.log(`[MOCK MODE] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[MOCK MODE] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[MOCK MODE] ${msg}`, data || ''),
};

// Enable/disable mock mode via environment variable
const MOCK_MODE = process.env.USE_MOCK_PAYMENTS === 'true';

/**
 * Mock validator for billing services
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string} billerCode - The biller code
 * @param {string} customerId - Customer ID
 * @returns {object} Validation response
 */
export const mockValidateBiller = async (req, res, billerCode, customerId) => {
  if (!MOCK_MODE) {
    return null; // Return null to use actual API
  }

  logger.info(`[MOCK MODE] Validating biller: ${billerCode} for customer: ${customerId}`);

  try {
    const validationData = getDummyValidationData(billerCode, customerId);

    if (!validationData) {
      logger.warn(`[MOCK MODE] No dummy data found for biller: ${billerCode}`);
      return res.status(404).json({
        success: false,
        message: 'Biller not found',
      });
    }

    logger.info(`[MOCK MODE] Returning dummy validation data for ${billerCode}`);
    return res.status(200).json(validationData);
  } catch (error) {
    logger.error(`[MOCK MODE] Error in mock validation: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mock executor for payment transactions
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string} billerCode - The biller code
 * @param {number} amount - Transaction amount
 * @returns {object} Payment response
 */
export const mockExecutePayment = async (req, res, billerCode, amount) => {
  if (!MOCK_MODE) {
    return null; // Return null to use actual API
  }

  logger.info(`[MOCK MODE] Executing payment for biller: ${billerCode}, amount: ${amount}`);

  try {
    const paymentResponse = getDummyPaymentResponse(billerCode, amount);
    logger.info(`[MOCK MODE] Returning dummy payment response for ${billerCode}`);
    return res.status(200).json(paymentResponse);
  } catch (error) {
    logger.error(`[MOCK MODE] Error in mock payment execution: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mock transaction status checker
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string} transactionId - Transaction ID
 * @returns {object} Status response
 */
export const mockCheckTransactionStatus = async (req, res, transactionId) => {
  if (!MOCK_MODE) {
    return null; // Return null to use actual API
  }

  logger.info(`[MOCK MODE] Checking transaction status for: ${transactionId}`);

  try {
    const statusResponse = getDummyTransactionStatus(transactionId);
    logger.info(`[MOCK MODE] Returning dummy status for transaction: ${transactionId}`);
    return res.status(200).json(statusResponse);
  } catch (error) {
    logger.error(`[MOCK MODE] Error in mock status check: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mock Ecobank biller validation
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Validation response
 */
export const mockValidateEcobankBiller = async (req, res) => {
  if (!MOCK_MODE) {
    return null;
  }

  const { billerCode, customerId } = req.body;
  logger.info(`[MOCK MODE] Validating Ecobank biller: ${billerCode}`);

  try {
    const validationData = getDummyValidationData(billerCode, customerId);

    if (!validationData) {
      return res.status(404).json({
        success: false,
        message: 'Ecobank biller not found',
      });
    }

    logger.info(`[MOCK MODE] Returning dummy Ecobank validation for ${billerCode}`);
    return res.status(200).json({
      success: true,
      data: validationData.data,
    });
  } catch (error) {
    logger.error(`[MOCK MODE] Error in mock Ecobank validation: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mock MoMo transaction
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} MoMo response
 */
export const mockMomoTransaction = async (req, res) => {
  if (!MOCK_MODE) {
    return null;
  }

  const { phoneNumber, amount, serviceType } = req.body;
  logger.info(`[MOCK MODE] Processing MoMo transaction: ${phoneNumber}, amount: ${amount}`);

  try {
    const response = {
      success: true,
      data: {
        status: 'successful',
        phoneNumber,
        amount,
        serviceType,
        transactionId: `TRX-MOMO-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'MoMo transaction completed successfully (Mock)',
      },
    };

    logger.info(`[MOCK MODE] Returning dummy MoMo response`);
    return res.status(202).json(response);
  } catch (error) {
    logger.error(`[MOCK MODE] Error in mock MoMo transaction: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Check if mock mode is enabled
 * @returns {boolean} True if mock mode is enabled
 */
export const isMockMode = () => MOCK_MODE;

/**
 * Get available dummy services
 * @returns {array} List of available services with their dummy data
 */
export const getAvailableMockServices = () => {
  return Object.keys(DUMMY_PAYMENT_DATA).map((service) => ({
    service,
    dataCount: DUMMY_PAYMENT_DATA[service].length,
    entries: DUMMY_PAYMENT_DATA[service],
  }));
};

export default {
  mockValidateBiller,
  mockExecutePayment,
  mockCheckTransactionStatus,
  mockValidateEcobankBiller,
  mockMomoTransaction,
  isMockMode,
  getAvailableMockServices,
};
