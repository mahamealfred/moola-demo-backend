import axios from "axios";
import logger from "../utils/logger.js";
import { generateRequestId, generateRequestToken } from "../utils/helper.js";
import dotenv from "dotenv";
import CryptoJS from "crypto-js";

dotenv.config();

const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = "ERW";
const SOURCE_CODE = "DDIN";
const AGENT_ACCOUNT = process.env.AGENT_ACCOUNT;
const SOURCE_IP = "10.8.245.9"; // Consistent source IP for EcoCash
const CHANNEL = "API";

// EcoCash Deposit Service
export const ecoCashDepositService = async (
  req,
  res,
  responseCyclos,
  description,
  agent_id
) => {
  // Early return if response already sent
  if (res.headersSent) {
    logger.warn("Response already sent, skipping EcoCash deposit");
    return;
  }

  const { sendername, senderphone, senderaccount, ccy, narration, amount } =
    req.body;

  // Validate required fields
  const requiredFields = [
    "sendername",
    "senderphone",
    "senderaccount",
    "ccy",
    "amount",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    logger.warn("Missing required fields", { missingFields });
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const amountFormatted = parseFloat(amount).toFixed(2);
  const reqId = generateRequestId();

  try {
    const requestToken = generateRequestToken(
      AFFCODE,
      reqId,
      AGENT_CODE,
      SOURCE_CODE,
      SOURCE_IP
    );

    // Generate transaction token
    const transactionTokenString =
      SOURCE_IP + reqId + AGENT_CODE + ccy + senderaccount + amountFormatted + PIN;
    const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

    const header = {
      affcode: AFFCODE,
      requestId: reqId,
      agentcode: AGENT_CODE,
      requesttype: "CASH_IN",
      sourceIp: SOURCE_IP,
      sourceCode: SOURCE_CODE,
      channel: CHANNEL,
      requestToken,
    };

    const payload = {
      sendername,
      senderphone,
      senderaccount,
      thirdpartyphonenumber: senderphone,
      ccy,
      narration: narration || "Cash deposit",
      subagent: agent_id || AGENT_CODE,
      amount: amountFormatted,
      transactiontoken: transactionToken,
      header,
    };

    const config = {
      method: "post",
      url: "https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/cashin",
      headers: { "Content-Type": "application/json" },
      data: payload,
    };

    logger.info("EcoCash deposit request:", { reqId, payload });

    const axiosResponse = await axios.request(config);
    const responseData = axiosResponse.data;

    logger.info("EcoCash deposit response:", responseData);

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json({
        success: true,
        message: "Cash deposit successful",
        data: {
          transactionId: responseCyclos?.data?.id,
          amount: amountFormatted,
          description,
          ecoResponse: responseData,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          responseData?.header?.responsemessage || "Cash deposit failed",
        code: responseData?.header?.responsecode,
      });
    }
  } catch (error) {
    logger.error("EcoCash deposit failed", {
      error: error?.response?.data || error.message,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error during cash deposit",
        error: error?.response?.data || error.message,
      });
    }
  }
};
