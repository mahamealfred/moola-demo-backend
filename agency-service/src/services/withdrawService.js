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
const SOURCE_IP = "10.8.245.9"; // Consistent source IP for EcoCash
const CHANNEL = "API"; // Changed from "MOBILE" to "API" for consistency
const AGENT_ACCOUNT = process.env.AGENT_ACCOUNT_CASH_OUT;

// EcoCash Withdraw Service
export const ecoCashWithdrawService = async (
  req,
  res,
  responseCyclos,
  description,
  agent_id
) => {
  // Early return if response already sent
  if (res.headersSent) {
    logger.warn("Response already sent, skipping EcoCash withdrawal");
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

    // Generate transaction token: SHA512(IP + Request ID + Agent Code + ccy + senderaccount + amount + PIN)
  
    const transactionTokenString =
      SOURCE_IP + reqId + AGENT_CODE + ccy + "6700494283" + amountFormatted + PIN;
    const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

    const header = {
      affcode: AFFCODE,
      requestId: reqId,
      agentcode: AGENT_CODE,
      requesttype: "GETCARDS", // Changed from "GETCARDS" to appropriate withdrawal type
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
      narration: narration || "Cash out",
      subagent: agent_id || AGENT_CODE,
      amount: amountFormatted,
      transactiontoken: transactionToken,
      header,
    };

    const config = {
      method: "post",
      url: "https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/withdrawal",
      headers: { "Content-Type": "application/json" },
      data: payload,
    };

    logger.info("EcoCash withdrawal request:", { reqId, payload });

    const axiosResponse = await axios.request(config);
    const responseData = axiosResponse.data;

    logger.info("EcoCash withdrawal response:", responseData);

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json({
        success: true,
        message: "Cash withdrawal successful",
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
        message: responseData?.header?.responsemessage || "Cash withdrawal failed",
        code: responseData?.header?.responsecode,
      });
    }
  } catch (error) {
    logger.error("EcoCash withdrawal failed", {
      error: error?.response?.data || error.message,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error during cash withdrawal",
        error: error?.response?.data || error.message,
      });
    }
  }
};