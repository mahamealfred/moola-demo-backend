import axios from 'axios';
import logger from '../utils/logger.js';
import { generateRequestId, generateRequestToken } from '../utils/helper.js';
import CryptoJS from 'crypto-js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { buildEcoCashInPayload, buildEcoCashOutPayload } from '../utils/payloadBuilder.js';
import { ecoCashDepositService } from '../services/depositService.js';
import { ecoCashWithdrawService } from '../services/withdrawService.js';


dotenv.config();


const AGENT_CODE = process.env.AGENT_CODE ;
const PIN = process.env.AGENT_PIN ; 
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';
const sourceIp = "10.8.245.9"
const ccy = "RWF";
const CHANNEL="API"
  const requestId = generateRequestId();



//Account opening
export const openAccount = async (req, res) => {
  const {
    firstname,
    lastname,
    middlename = null,
    dateOfBirth,
    identityType,
    identityNo,
    idIssueDate,
    idExpiryDate,
    mobileNo,
    email,
    gender,
    address,
    countryCode,
    transactionGuid,
    amount
  } = req.body;

  if (
    !firstname || !lastname || !dateOfBirth || !identityType || !identityNo ||
    !idIssueDate || !idExpiryDate || !mobileNo || !email || !gender || !address ||
    !countryCode || !transactionGuid
  ) {
    logger.warn('Missing required fields in account opening payload', req.body);
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
   const amountFormatted = parseFloat(amount).toFixed(2);
  const destinationAccount = identityNo;
  const requestId = generateRequestId();
  const requestToken = generateRequestToken(AFFCODE,requestId,AGENT_CODE,SOURCE_CODE,sourceIp);
  const tokenString = sourceIp + requestId + AGENT_CODE + ccy + destinationAccount+ amountFormatted + PIN;
  const transactiontoken = CryptoJS.SHA512(tokenString).toString();
  // Destination account is usually mobile number or identity number (adjust as per API docs)
  

  const payload = {
    header: {
      sourceCode: SOURCE_CODE,
      affcode: AFFCODE,
      requestId,
      agentcode: AGENT_CODE,
      requestToken,
      requesttype: REQUEST_TYPE,
      sourceIp: sourceIp,
      channel: CHANNEL,
    },
    firstname,
    lastname,
    middlename,
    dateOfBirth,
    identityType,
    identityNo,
    idIssueDate,
    idExpiryDate,
    mobileNo,
    email,
    gender,
    address,
    countryCode,
    transactionGuid,
    transactiontoken,
  };

  const config = {
    method: 'post',
    url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/accountopening',
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
    maxBodyLength: Infinity,
  };

  try {
    const response = await axios.request(config);
    const responseData = response.data;

    logger.info('Account opening response', { requestId, responseData });

    if (responseData?.header?.responsecode === '000') {
      return res.status(200).json({
        success: true,
        message: 'Account opened successfully',
        data: responseData,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: responseData?.header?.responsemessage || 'Account opening failed',
        code: responseData?.header?.responsecode,
      });
    }
  } catch (error) {
    logger.error(' Account opening error', {
      requestId,
      error: error?.response?.data || error.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during account opening',
      error: error?.response?.data || error.message,
    });
  }
};

//Cash In
export const executeEcoCashIn = async (req, res) => {
  const {
    amount,
    sendername,
    senderphone,
    senderaccount,
    ccy,
    narration,
  } = req.body;

  if (!amount || !sendername || !senderphone || !senderaccount || !ccy ) {
    logger.warn('Missing required fields in EcoCashIn request', req.body);
    return res.status(400).json({
      success: false,
      message:
        'Missing required fields: amount, sendername, senderphone, senderaccount, and ccy are all required.',
    });
  }

   const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let agent_name = 'UnknownAgent';
  let userAuth = null;
  let agent_id = 0

  try {
    const decodedToken = await new Promise((resolve, reject) =>
      jwt.verify(token, process.env.JWT_SECRET, (err, user) =>
        err ? reject(err) : resolve(user)
      )
    );

    agent_name = decodedToken.name;
    userAuth = decodedToken.userAuth;
    agent_id=decodedToken.id
  } catch (err) {
    logger.warn('Invalid token', { error: err.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
let description= `EcoCash Deposit - Amount: ${amount}, Sender: ${sendername}, Phone: ${senderphone}, Account: ${senderaccount}, Narration: ${narration}, Currency: ${ccy}`
  const payload = buildEcoCashInPayload({
    amount,
    sendername,
    senderphone,
    senderaccount,
    narration,
    ccy,
    description
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${userAuth}`,
    },
    data: JSON.stringify(payload),
  };

  try {
    const response = await axios.request(config);

    logger.info('EcoCashIn response from core system', {
      status: response.status,
      data: response.data,
    });

    if (response.status === 200) {
      await ecoCashDepositService(req,res,response,description,agent_id)
      
    }

    return res.status(502).json({
      success: false,
      message:
        'Unexpected response from the deposit. Please try again later.',
    });
  } catch (error) {
    const status = error?.response?.status;
    const errorDetails = error?.response?.data?.errorDetails;
    const coreError = error?.response?.data;

    logger.error('EcoCashIn failed', {
      status,
      errorDetails,
      coreError,
    });

    if (status === 400) {
      let message = 'Unable to process payment due to invalid request.';

      if (errorDetails === 'INVALID_TRANSACTION_PASSWORD') {
        message = 'Your transaction password is incorrect. Please try again.';
      } else if (errorDetails === 'BLOCKED_TRANSACTION_PASSWORD') {
        message =
          'Your transaction password has been blocked. Please contact support.';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please check your credentials.',
      });
    }

    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please verify the sender account.',
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "We're unable to process your EcoCash-In transaction right now. Please try again later.",
      error: coreError || error.message,
    });
  }
};

//CashOut 
//Cash Out n
export const executeEcoCashOut = async (req, res) => {
  const {
    amount,
    sendername,
    senderphone,
    senderaccount,
    ccy,
    narration,
  } = req.body;

  if (!amount || !sendername || !senderphone || !senderaccount || !ccy ) {
    logger.warn('Missing required fields in EcoCashIn request', req.body);
    return res.status(400).json({
      success: false,
      message:
        'Missing required fields: amount, sendername, senderphone, senderaccount, and ccy are all required.',
    });
  }

   const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
   const username = process.env.AGENCY_BANKING_USERNAME;
   const password = process.env.AGENCY_BANKING_USERPASS
   const agencyBankingUserAuth = Buffer.from(`${username}:${password}`).toString('base64');

  let agent_name = 'UnknownAgent';
  let userAuth = null;
 let userId=null;
  try {
    const decodedToken = await new Promise((resolve, reject) =>
      jwt.verify(token, process.env.JWT_SECRET, (err, user) =>
        err ? reject(err) : resolve(user)
      )
    );

    userId = decodedToken.id;
    userAuth = decodedToken.userAuth;
  } catch (err) {
    logger.warn('Invalid token', { error: err.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
  let description= `EcoCash withdraw - Amount: ${amount}, Sender: ${sendername}, Phone: ${senderphone}, Account: ${senderaccount}, Narration: ${narration}, Currency: ${ccy}`
  const payload = buildEcoCashOutPayload({
    amount,
    sendername,
    senderphone,
    senderaccount,
    narration,
    ccy,
    subagentcode:userId
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${agencyBankingUserAuth}`,
    },
    data: JSON.stringify(payload),
  };

  try {
    const response = await axios.request(config);

    logger.info('EcoCashOut response from core system', {
      status: response.status,
      data: response.data,
    });

    if (response.status === 200) {
       await ecoCashWithdrawService(req,res,response,description,userId)
      
    }

    return res.status(502).json({
      success: false,
      message:
        'Unexpected response from the withdraw server. Please try again later.',
    });
  } catch (error) {
    
    const status = error?.response?.status;
    const errorDetails = error?.response?.data?.errorDetails;
    const coreError = error?.response?.data;

    logger.error('EcoCashOut failed', {
      status,
      errorDetails,
      coreError,
    });

    if (status === 400) {
      let message = 'Unable to process payment due to invalid request.';

      if (errorDetails === 'INVALID_TRANSACTION_PASSWORD') {
        message = 'Your transaction password is incorrect. Please try again.';
      } else if (errorDetails === 'BLOCKED_TRANSACTION_PASSWORD') {
        message =
          'Your transaction password has been blocked. Please contact support.';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please check your credentials.',
      });
    }

    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please verify the sender account.',
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "We're unable to process your EcoCash-Out transaction right now. Please try again later.",
      error: coreError || error.message,
    });
  }
};