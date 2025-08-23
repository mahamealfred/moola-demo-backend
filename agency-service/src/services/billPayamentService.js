import dotenv from "dotenv";
import axios from "axios";
import { callPollEndpoint, Chargeback, generateFDIAccessToken } from "../utils/helper.js";
import {  updateLogs } from "../utils/logsData.js";

dotenv.config();

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

      while (true) {
        const responseData = await callPollEndpoint(resp, requestId);
        let thirdpart_status = responseData.data.data.trxStatusId;

        if (thirdpart_status === "successful") {
          status = "successful";
          token = billerCode.toLowerCase() === "electricity"?responseData.data.data.spVendInfo.voucher:null;

          updateLogs(transactionId, status, thirdpart_status, token);
 return res.status(200).json({
        success: true,
        message: "Your payment was successful.",
        data: {
          transactionId: response.data.id,
          requestId,
          amount,
          subagentCode: agent_id,
          agentName:agent_name,
          token:token,
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
