import dotenv from "dotenv";
import axios from "axios";
import { callPollEndpoint, Chargeback, generateFDIAccessToken, generateRequestId, generateRequestToken } from "../utils/helper.js";
import { updateLogs } from "../utils/logsData.js";
import CryptoJS from 'crypto-js';
import logger from "../utils/logger.js";

dotenv.config();
const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';
const ccy = 'RWF'
// Helper function: choose delivery method based on biller code
const getDeliveryMethod = (billerCode) => {
  switch (billerCode.toLowerCase()) {
    case "airtime":
      return "direct_topup";
    case "electricity":
      return "sms";
    case "paytv":
      return "direct_topup";
    case "tax":
      return "sms";
    case "water":
      return "invoice";
    default:
      return "generic"; // fallback if unknown billerCode
  }
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fdiBillPayamentService = async (
  req,
  res,
  response,
  amount,
  billerCode,
  requestId,
  customerId,
  agent_name,
  agent_id
) => {
  const accessToken = await generateFDIAccessToken();
  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "A Token is required for authentication",
    });
  }



  let data = JSON.stringify({
    trxId: requestId,
    customerAccountNumber: customerId,
    amount: amount,
    verticalId: billerCode.toLowerCase(),
    deliveryMethodId: getDeliveryMethod(billerCode),
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: process.env.EFASHE_URL + "/rw/v2/vend/execute",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.replace(/['"]+/g, "")}`,
    },
    data: data,
  };

  try {
    const resp = await axios.request(config);

    if (resp.status === 202) {
      // Start continuous polling
      let transactionId = response.data.id;
      let status = "failed";
      let token = null;
      let units = null;

      while (true) {
        const responseData = await callPollEndpoint(resp, requestId);
        let thirdpart_status = responseData.data.data.trxStatusId;

        if (thirdpart_status === "successful") {
          status = "successful";
          token = billerCode.toLowerCase() === "electricity" ? responseData.data.data.spVendInfo.voucher : null;
          units = billerCode.toLowerCase() === "electricity" ? responseData.data.data.spVendInfo.units : null;
          updateLogs(transactionId, status, thirdpart_status, token);
          return res.status(200).json({
            success: true,
            message: "Your payment was successful.",
            data: {
              transactionId: response.data.id,
              requestId,
              amount,
              subagentCode: agent_id,
              agentName: agent_name,
              token: token,
              units: units,
              deliveryMethod: getDeliveryMethod(billerCode)
            },
          });

        } else if (thirdpart_status !== "pending") {
          // Handle other non-pending statuses
          status = "failed";
          updateLogs(transactionId, status, thirdpart_status, token);
          Chargeback(transactionId);

          return res.status(400).json({
            success: false,
            message:
              "Dear client, We're unable to complete your transaction right now. Please try again later",
          });
        }

        // Delay before next polling attempt (e.g., 3 seconds)
        await delay(3000);
      }
    }
  } catch (error) {
    let transactionId = response.data?.id;
    let thirdpart_status = error.response ? error.response.status : "404";
    let status = "failed";
    let token = null;

    updateLogs(transactionId, status, thirdpart_status, token);

    if (error.response && error.response.status === 400) {
      Chargeback(transactionId);
      return res.status(400).json({
        success: false,
        message: error.response.data.msg,
      });
    }
    if (error.response && error.response.status === 422) {
      Chargeback(transactionId);
      return res.status(400).json({
        success: false,
        message: error.response.data.msg,
      });
    }
    if (!error.response) {
      return res.status(404).json({
        success: false,
        message:
          "Dear client, Your transaction has been processed; please get in touch with DDIN Support for follow-up.",
      });
    }
    return res.status(500).json({
      success: false,
      message:
        "Dear client, we're unable to complete your transaction right now. Please try again later.",
    });
  }
};


// Ecobank bill payment
export const ecobankBillPayamentService = async (
  req,
  res,
  cyclosResp,
  amount,
  billerCode,
  requestId,
  customerId,
  agent_name,
  agent_id,
  email
) => {
  // Early return if response already sent
  if (res.headersSent) {
    logger.warn("Response already sent, skipping bill payment processing");
    return;
  }

  const sourceIp = "192.168.0.237";
  const amountFormatted = parseFloat(amount).toFixed(2);
  const reqId = generateRequestId();

  const requestToken = generateRequestToken(
    AFFCODE,
    reqId,
    AGENT_CODE,
    SOURCE_CODE,
    sourceIp
  );

  const transactionTokenString =
    sourceIp + reqId + AGENT_CODE + ccy + billerCode + amountFormatted + PIN;
  const transactionToken = CryptoJS.SHA512(transactionTokenString).toString();

  const header = {
    affcode: AFFCODE,
    requestId: reqId,
    agentcode: AGENT_CODE,
    requesttype: "VALIDATE",
    sourceIp,
    sourceCode: SOURCE_CODE,
    channel: "API",
    requestToken,
  };

  const payload = {
    formData: [
      { fieldName: "EMAIL", fieldValue: email },
      { fieldName: "Customer No/Smart Card No", fieldValue: customerId },
    ],
    billerCode,
    productCode: billerCode,
    amount: amountFormatted,
    ccy,
    subagent: agent_id,
    transactiontoken: transactionToken,
    header,
  };

  const config = {
    method: "post",
    url: "https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/postbillpayment",
    headers: { "Content-Type": "application/json" },
    data: payload,
  };

  try {
    const axiosResponse = await axios.request(config);
    const responseData = axiosResponse.data;

    logger.info("Bill payment response:", responseData);

    if (responseData?.header?.responsecode === "000") {
      return res.status(200).json({
        success: true,
        message: "Bill payment successful",
        data: responseData,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: responseData?.header?.responsemessage || "Unknown error",
        code: responseData?.header?.responsecode,
      });
    }
  } catch (error) {
    logger.error("Bill payment failed", {
      error: error?.response?.data || error.message,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error?.response?.data || error.message,
      });
    }
  }
};