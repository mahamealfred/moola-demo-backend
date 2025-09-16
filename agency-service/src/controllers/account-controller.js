import axios from 'axios';
import logger from '../utils/logger.js';
import { generateRequestId, generateRequestToken } from '../utils/helper.js';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';

dotenv.config();


const AGENT_CODE = process.env.AGENT_CODE ;
const PIN = process.env.AGENT_PIN ; 
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';
const sourceIp = "10.8.245.9"
const ccy = "RWF";
const CHANNEL="API"
  const requestId = generateRequestId(); // or use uuid

export const getEcoBankAccountBalance = async (req, res) => {

  logger.info(`Get Account Balance endpoint `);

      //const amountFormatted = parseFloat(amount).toFixed(2);
  
      const requestTokenString = `${AFFCODE}${requestId}${AGENT_CODE}${SOURCE_CODE}${sourceIp}`;
      const requestToken = CryptoJS.SHA512(requestTokenString).toString();
      const tokenString = sourceIp + requestId + AGENT_CODE + PIN;
      const transactionToken = CryptoJS.SHA512(tokenString).toString();

  const data = {
    header: {
      affcode:AFFCODE,
      requestId,
      requestToken,
      sourceCode:SOURCE_CODE,
      sourceIp,
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
      return res.status(200).json({
        success: true,
        message: "Account balance retrieved successfully",
        data: response.data
      });
    }

    logger.warn("Failed to retrieve balance", response.data?.header?.responsemessage);
    return res.status(400).json({
      success: false,
      message: response.data?.header?.responsemessage
    });

  } catch (e) {
    logger.error("Get Account Balance error occurred", e?.response?.data || e.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: e?.response?.data || e.message
    });
  }
};


export const validateIdentity = async (req, res) => {
  const { idNumber } = req.body;

  if (!idNumber) {
    logger.warn('Missing required field: idNumber', req.body);
    return res.status(400).json({
      success: false,
      message: 'Missing required field: idNumber',
    });
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
      sourceIp,
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
      return res.status(200).json({
        success: true,
        message: 'Identity validation successful',
        data: responseData,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: responseData?.header?.responsemessage || 'Validation failed',
        code: responseData?.header?.responsecode,
      });
    }
  } catch (error) {
    logger.error(' Identity validation failed', {
      requestId,
      error: error?.response?.data || error.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during identity validation',
      error: error?.response?.data || error.message,
    });
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
    sourceIp: sourceIp, // Make sure sourceIp is defined
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
      return res.status(200).json({
        success: true,
        message: "Customer details retrieved successfully",
        data: responseData
      });
    } else {
      logger.error("Validation failed", responseData?.header);
      return res.status(400).json({
        success: false,
        message: responseData?.header?.responsemessage || "Validation failed",
        code: responseData?.header?.responsecode
      });
    }
  } catch (error) {
    logger.error("Request failed", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.response?.data || error.message
    });
  }
};
