import axios from 'axios';
import logger from '../utils/logger.js';
import { generateRequestId, generateRequestToken } from '../utils/helper.js';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';

dotenv.config();

const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';
const sourceIp = "10.8.245.9";
const CHANNEL = "MOBILE";

export const ecoCashWithdrawService = async (req, res,responseCyclos,description,agent_id) => {
  const {
    sendername,
    senderphone,
    senderaccount,
    ccy,
    narration,
    amount
  } = req.body;

  let  thirdpartyphonenumber=senderphone
  let subagent=agent_id

  // Validate required fields
  const requiredFields = ['sendername', 'senderphone', 'senderaccount', 'ccy', 'amount'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    logger.warn('Missing required fields', { missingFields });
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  try {
    const requestId = generateRequestId();
    const requestToken = generateRequestToken(AFFCODE, requestId, AGENT_CODE, SOURCE_CODE, sourceIp);
    
    // Generate transaction token as per requirements: SHA512(IP + Request ID + Agent Code + ccy + destination Account + amount + PIN)
    const transactionTokenString = sourceIp + requestId + AGENT_CODE + ccy  + amount + PIN;
    const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

    const header = {
      affcode: AFFCODE,
      requestId,
      requestToken,
      sourceCode: SOURCE_CODE,
      sourceIp,
      channel: CHANNEL,
      requesttype: "GETCARDS",
      agentcode: AGENT_CODE
    };

    const payload = {
      sendername,
      senderphone,
      senderaccount,
      thirdpartyphonenumber,
      ccy,
      narration: narration || "Cash out",
      subagent: subagent || AGENT_CODE, // Use subagent if provided, otherwise fallback to agent code
      amount: parseFloat(amount).toFixed(2), // Format amount to 2 decimal places
      transactiontoken: transactionToken,
      header
    };

    logger.info("EcoCash cash out request payload", { requestId, payload });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/withdrawal',
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };

    const response = await axios.request(config);
    const responseData = response.data;

    logger.info("EcoCash cash out response received", { requestId, responseData });

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json({
        success: true,
        message: "Cash cash out successful",
        data: {
            transactionId:responseCyclos.data.id,
            amount,
            description,
            ecoResponse:responseData

        }
      });
    }

    logger.warn("Cash out failed", { 
      requestId, 
      responseCode: responseData?.header?.responsecode,
      responseMessage: responseData?.header?.responsemessage 
    });

    return res.status(400).json({
      success: false,
      message: responseData?.header?.responsemessage || "Cash cout failed",
      code: responseData?.header?.responsecode
    });

  } catch (error) {
    logger.error("EcoCash out error occurred", {
      error: error?.response?.data || error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error during cash out",
      error: error?.response?.data || error.message
    });
  }
};