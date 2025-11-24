import dotenv from "dotenv";
import axios from "axios";
import { callPollEndpoint, Chargeback, generateFDIAccessToken, generateRequestId, generateRequestToken } from "../utils/helper.js";
import { updateLogs, updateTransfersTable } from "../utils/logsData.js";
import CryptoJS from 'crypto-js';
import logger from "../utils/logger.js";

dotenv.config();
const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';
const ccy = 'RWF';
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
      return "generic";
  }
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to check if response is already sent
const isResponseSent = (res) => res.headersSent || res.writableEnded;

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
    let transactionId = response.data.id;
    let id = response.data.id;
    let description = null;

    if (resp.status === 202) {
      // Start continuous polling with timeout protection
      let status = "failed";
      let token = null;
      let units = null;

      let pollingAttempts = 0;
      const maxPollingAttempts = 10; // ~30 seconds total

      while (pollingAttempts < maxPollingAttempts) {
        pollingAttempts++;

        // Check if response already sent before polling
        if (isResponseSent(res)) {
          logger.warn("Response already sent, stopping polling");
          return;
        }

        const responseData = await callPollEndpoint(resp, requestId);
        let thirdpart_status = responseData.data.data.trxStatusId;

        if (thirdpart_status === "successful") {
          status = "successful";
          token = billerCode.toLowerCase() === "electricity" ? responseData.data.data.spVendInfo.voucher : null;
          units = billerCode.toLowerCase() === "electricity" ? responseData.data.data.spVendInfo.units : null;
          description = `${billerCode} payment - Customer ID: ${customerId} - Amount: ${amount}${units ? ` - Units: ${units}` : ''}${token ? ` - Token: ${token}` : ''}`.trim();
          await updateLogs(transactionId, status, thirdpart_status, token, description);
          await updateTransfersTable(description, id);
          // Final check before sending response
          if (!isResponseSent(res)) {
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
          }
          return;

        } else if (thirdpart_status !== "pending") {
          // Handle other non-pending statuses
          status = "failed";
          await updateLogs(transactionId, status, thirdpart_status, token, null);
          await Chargeback(transactionId);

          // Final check before sending response
          if (!isResponseSent(res)) {
            return res.status(400).json({
              success: false,
              message: "Dear client, We're unable to complete your transaction right now. Please try again later",
            });
          }
          return;
        }

        // Delay before next polling attempt
        await delay(3000);
      }

      // Handle polling timeout
      if (!isResponseSent(res)) {
        await updateLogs(transactionId, "failed", "timeout", null, null);
        await Chargeback(transactionId);
        return res.status(408).json({
          success: false,
          message: "Transaction timeout. Please check status later.",
        });
      }
    }
  } catch (error) {
    let transactionId = response.data?.id;
    let thirdpart_status = error.response ? error.response.status : "404";
    let status = "failed";
    let token = null;

    await updateLogs(transactionId, status, thirdpart_status, token, null);
    // Check if response already sent before error handling
    if (isResponseSent(res)) {
      logger.warn("Response already sent, skipping error response");
      return;
    }

    if (error.response && (error.response.status === 400 || error.response.status === 422)) {
      await Chargeback(transactionId);
      return res.status(400).json({
        success: false,
        message: error.response.data.msg,
      });
    }
    if (!error.response) {
      return res.status(404).json({
        success: false,
        message: "Dear client, Your transaction has been processed; please get in touch with DDIN Support for follow-up.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
    });
  }
};

// Ecobank bill payment (already good, but added extra safety)
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
  if (isResponseSent(res)) {
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

    // Final check before sending response
    if (!isResponseSent(res)) {
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
    }
  } catch (error) {
    logger.error("Bill payment failed", {
      error: error?.response?.data || error.message,
    });

    // Final check before sending error response
    if (!isResponseSent(res)) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error?.response?.data || error.message,
      });
    }
  }
};