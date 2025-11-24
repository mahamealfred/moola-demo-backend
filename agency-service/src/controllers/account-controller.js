import axios from 'axios';
import logger from '../utils/logger.js';
import { generateRequestId, generateRequestToken } from "../utils/helper.js";
import dotenv from "dotenv";
import CryptoJS from "crypto-js";
import { createResponse, createErrorResponse } from '@moola/shared';

dotenv.config();

const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = "ERW";
const SOURCE_CODE = "DDIN";
const SOURCE_IP = "10.8.245.9"; // Consistent source IP for EcoCash
const CHANNEL = "API"; // Changed from "MOBILE" to "API" for consistency
const AGENT_ACCOUNT = process.env.AGENT_ACCOUNT_CASH_OUT;
  const reqId = generateRequestId(); // or use uuid

export const getEcoBankAccountBalance = async (req, res) => {

  logger.info(`Get Account Balance endpoint `);

      const amountFormatted = parseFloat(amount).toFixed(2);
      const requestToken = generateRequestToken(
        AFFCODE,
        reqId,
        AGENT_CODE,
        SOURCE_CODE,
        SOURCE_IP
      );
  
      // Generate transaction token: SHA512(IP + Request ID + Agent Code + ccy + senderaccount + amount + PIN)
    
      const transactionTokenString =
        SOURCE_IP + reqId + AGENT_CODE + ccy + "6775009514" + amountFormatted + PIN;
      const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

  const data = {
    header: {
      affcode:AFFCODE,
      requestId,
      requestToken,
      sourceCode:SOURCE_CODE,
      sourceIp:SOURCE_IP,
      channel: CHANNEL,
      requesttype: "VALIDATE",
      agentcode:AGENT_CODE
    },
    transactiontoken: transactionToken
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/getbalance',
    headers: {
      'Content-Type': 'application/json'
    },
    data
  };

  try {
    const response = await axios.request(config);
    logger.info("Account balance response received", response.data);

    if (response.data?.header?.responsecode === "000") {
      return res.status(200).json(createResponse(true, 'banking.balance_retrieved_successfully', response.data, req.language));
    }

    logger.warn("Failed to retrieve balance", response.data?.header?.responsemessage);
    return res.status(400).json(createErrorResponse('banking.balance_retrieval_failed', req.language, 400, {
      apiMessage: response.data?.header?.responsemessage
    }));

  } catch (e) {
    logger.error("Get Account Balance error occurred", e?.response?.data || e.message);
    res.status(500).json(createErrorResponse('common.server_error', req.language, 500, {
      error: e?.response?.data || e.message
    }));
  }
};


export const validateIdentity = async (req, res) => {
  const { idNumber } = req.body;

  if (!idNumber) {
    logger.warn('Missing required field: idNumber', req.body);
    return res.status(400).json(createErrorResponse('validation.missing_id_number', req.language, 400));
  }
  const requestId = generateRequestId();
  const requestToken = generateRequestToken(AFFCODE,requestId,AGENT_CODE,SOURCE_CODE,sourceIp);
  const payload = {
    header: {
      sourceCode: SOURCE_CODE,
      affcode: AFFCODE,
      requestId,
      agentcode: AGENT_CODE,
      requestToken,
      requesttype: 'ACCOUNT_OPENING',
      sourceIp:SOURCE_IP,
      channel: CHANNEL,
    },
    idNumber,
    base64Image: ''
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/validateidentity',
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
  };

  try {
    const response = await axios.request(config);
    const responseData = response.data;

    logger.info('Identity validation response', { requestId, responseData });

    if (responseData?.header?.responsecode === '000') {
      return res.status(200).json(createResponse(true, 'banking.identity_validation_successful', responseData, req.language));
    } else {
      return res.status(400).json(createErrorResponse('validation.failed', req.language, 400, {
        code: responseData?.header?.responsecode,
        apiMessage: responseData?.header?.responsemessage
      }));
    }
  } catch (error) {
    logger.error(' Identity validation failed', {
      requestId,
      error: error?.response?.data || error.message,
    });

    return res.status(500).json(createErrorResponse('common.server_error', req.language, 500, {
      error: error?.response?.data || error.message,
    }));
  }
};

export const getCustomerDetails = async (req, res) => {
  const { accountno } = req.body;

  logger.info("Initiating customer detail validation", { accountno });

  // Generate these variables first
  const requestId = generateRequestId();
  const sourceIp = req.ip || req.connection.remoteAddress; // Make sure to get sourceIp
  const requestToken = generateRequestToken(AFFCODE, requestId, AGENT_CODE, SOURCE_CODE, sourceIp);

  // Then create the header object
  const header = {
    sourceCode: SOURCE_CODE,
    affcode: AFFCODE,
    requestId: requestId, // Use the already declared variable
    agentcode: AGENT_CODE,
    requestToken: requestToken, // Use the already declared variable
    requesttype: 'VALIDATE',
    sourceIp: SOURCE_IP, // Make sure sourceIp is defined
    channel: CHANNEL,
  };

  const payload = {
    accountno,
    header
  };

  const config = {
    method: 'post',
    url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/getcustomerdetails',
    maxBodyLength: Infinity,
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload
  };

  try {
    logger.info("Sending request to Ecobank API", { requestId: header.requestId });

    const response = await axios.request(config);
    const responseData = response.data;

    logger.info("Received response", responseData);

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json(createResponse(true, 'banking.customer_details_retrieved', responseData, req.language));
    } else {
      logger.error("Validation failed", responseData?.header);
      return res.status(400).json(createErrorResponse('validation.failed', req.language, 400, {
        code: responseData?.header?.responsecode,
        apiMessage: responseData?.header?.responsemessage
      }));
    }
  } catch (error) {
    logger.error("Request failed", error?.response?.data || error.message);
    return res.status(500).json(createErrorResponse('common.server_error', req.language, 500, {
      error: error?.response?.data || error.message
    }));
  }
};
export const validateExpressCashToken = async (req, res) => {
  const { cashToken, amount } = req.body;

  // Input validation
  if (!cashToken || !amount) {
    return res.status(400).json(createErrorResponse('validation.missing_cash_token_amount', req.language, 400));
  }

  logger.info("Initiating customer detail validation", { cashToken, amount });

  try {
    const amountFormatted = parseFloat(amount).toFixed(2);

    // Keep your existing request token and transaction token generation
    const requestToken = generateRequestToken(
      AFFCODE,
      reqId,
      AGENT_CODE,
      SOURCE_CODE,
      SOURCE_IP
    );

    const ccy = "RWF";
    const transactionTokenString =
      SOURCE_IP + reqId + AGENT_CODE + ccy + "6775009514" + amountFormatted + PIN;
    const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

    const header = {
      sourceCode: SOURCE_CODE,
      affcode: AFFCODE,
      requestId: reqId,
      agentcode: AGENT_CODE,
      requestToken: requestToken,
      requesttype: "VALIDATE",
      sourceIp: SOURCE_IP,
      channel: CHANNEL,
    };

    const payload = {
      token: cashToken,
      amount,
      transactionToken,
      header,
    };

    const config = {
      method: "post",
      url: "https://devtuat.ecobank.com/agencybanking/services/thirdpartyagencybanking/validatetoken",
      maxBodyLength: Infinity,
      headers: { "Content-Type": "application/json" },
      data: payload,
    };

    logger.info("Sending request to Ecobank API", { requestId: header.requestId });

    const response = await axios.request(config);
    const responseData = response.data;

    logger.info("Received response from Ecobank API", responseData);

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json(createResponse(true, 'banking.customer_details_retrieved', responseData, req.language));
    } else {
      logger.error("Validation failed", responseData?.header);
      return res.status(400).json(createErrorResponse('validation.failed', req.language, 400, {
        code: responseData?.header?.responsecode,
        apiMessage: responseData?.header?.responsemessage
      }));
    }
  } catch (error) {
    logger.error("Request failed", error?.response?.data || error.message);
    return res.status(500).json(createErrorResponse('common.server_error', req.language, 500, {
      error: error?.response?.data || error.message,
    }));
  }
};
