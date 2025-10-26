import dotenv from "dotenv";
import axios from "axios";
import logger from "../utils/logger.js";
import { insertLogs, updateLogs } from "../utils/logsData.js";
import { Chargeback } from "../utils/helper.js";

dotenv.config();

const PINDO_API_URL = 'https://api.pindo.io/v1/sms/';

// Get token from environment variables for security
const PINDO_AUTH_TOKEN = process.env.PINDO_AUTH_TOKEN || 'Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4NTA4OTc1NTgsImlhdCI6MTc1NjIwMzE1OCwiaWQiOiI3NTEiLCJyZXZva2VkX3Rva2VuX2NvdW50Ijo3fQ.15LsZWJSl2hkHqumYkTKmBGM0_i_-6ttI1ZwMPSMGRWMt0fLVtPwt3bun_59kf2iqHnNR3-5gjju0swph0c9tA';

// Validate token on startup
if (!PINDO_AUTH_TOKEN || !PINDO_AUTH_TOKEN.startsWith('Bearer ')) {
    logger.error("Invalid or missing Pindo authentication token");
    throw new Error("Pindo authentication token is required and must start with 'Bearer '");
}

// Utility function to validate token and handle authentication
const validateAndRefreshToken = async () => {
    // Add token validation logic here if needed
    // You might want to check token expiration and refresh it
    return PINDO_AUTH_TOKEN;
};

// Common function to make Pindo API requests
const makePindoRequest = async (config, serviceType = 'sms') => {
    try {
        // Ensure token is valid
        const authToken = await validateAndRefreshToken();
        
        // Update headers with valid token
        config.headers = {
            ...config.headers,
            'Authorization': authToken,
            'Content-Type': 'application/json'
        };

        const response = await axios.request(config);
        
        logger.info(`Pindo ${serviceType} API request successful`, {
            status: response.status,
            url: config.url,
            method: config.method
        });

        return response;
    } catch (error) {
        logger.error(`Pindo ${serviceType} API request failed`, {
            status: error.response?.status,
            error: error.response?.data || error.message,
            url: config.url
        });
        throw error;
    }
};

// Corporate service
export const bulkSmsPaymentServiceForCorporate = async (
    req, 
    res, 
    response, 
    total_amount, 
    recipients, 
    description, 
    senderId, 
    smsMessage, 
    service_name, 
    agent_name, 
    agent_id
) => {
    const amount = total_amount;

   
    const data = JSON.stringify({
        sender: senderId,
        text: smsMessage,
        recipients: recipients
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: PINDO_API_URL + 'bulk',
        data: data
    };

    try {
        const resp = await makePindoRequest(config, 'Corporate Bulk SMS');
        
        if (resp.status === 201) {
            const transactionId = response.data.id;
            const thirdpart_status = resp.status;
            const trxId = "";
            const status = "successful";
            
            // Log successful transaction
            await insertLogs( 
                transactionId,
                thirdpart_status,
                description,
                amount,
                0,
                agent_id,
                agent_name,
                status,
                service_name,
                trxId,
                senderId,
                null
            );
            
            return res.status(200).json({
                success: true,
                message: "Bulk SMS sent successfully",
                data: {
                    transactionId: response.data.id,
                    amount: amount,
                    description: description,
                }
            });
        }

        // Handle unexpected success status
        logger.warn("Unexpected success status from Pindo Corporate API", { status: resp.status });
        return res.status(502).json({
            success: false,
            message: "Unexpected response from SMS service provider. Please try again later."
        });

    } catch (error) {
        const transactionId = response.data.id;
        const thirdpart_status = error?.response?.status || 404;
        const trxId = "";
        let token = null;
        const status = "failed";
        
        // Log failed transaction and initiate chargeback
        await updateLogs(transactionId, status, thirdpart_status, token);
        await Chargeback(transactionId);

        const statusCode = error?.response?.status;
        const errorMessage = error?.response?.data?.message;

        if (statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: errorMessage || "Bad request to SMS service"
            });
        }

        if (statusCode === 401) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed with SMS service. Please check API credentials."
            });
        }

        if (statusCode === 409) {
            return res.status(409).json({
                success: false,
                message: "Unknown sender Id"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Dear client, we're unable to complete your transaction right now. Please try again later",
            error: errorMessage || error.message
        });
    }
};

export const singleSmsPaymentServiceForCorporate = async (
    req, 
    res, 
    response, 
    total_amount, 
    recipient, 
    description, 
    senderId, 
    smsMessage, 
    service_name, 
    agent_name, 
    agent_id
) => {
    const amount = total_amount;

    const data = JSON.stringify({
        sender: senderId,
        text: smsMessage,
        to: recipient // Wrap single recipient in array for API compatibility
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: PINDO_API_URL,
        data: data
    };

    try {
        const resp = await makePindoRequest(config, 'Corporate Single SMS');
        
        if (resp.status === 201) {
            const transactionId = response.data.id;
            const thirdpart_status = resp.status;
            const trxId = "";
            const status = "successful";
            
            // Log successful transaction
            await insertLogs( 
                transactionId,
                thirdpart_status,
                description,
                amount,
                0,
                agent_id,
                agent_name,
                status,
                service_name,
                trxId,
                senderId,
                null
            );
            
            return res.status(200).json({
                success: true,
                message: "SMS sent successfully",
                data: {
                    transactionId: response.data.id,
                    amount: amount,
                    description: description,
                   
                }
            });
        }

        // Handle unexpected success status
        logger.warn("Unexpected success status from Pindo Corporate Single SMS API", { status: resp.status });
        return res.status(502).json({
            success: false,
            message: "Unexpected response from SMS service provider. Please try again later."
        });

    } catch (error) {
        const transactionId = response.data.id;
        const thirdpart_status = error?.response?.status || 404;
        const trxId = "";
        let token = null;
        const status = "failed";
        
        logger.error("Pindo Corporate Single SMS API failed", {
            status: thirdpart_status,
            error: error.response?.data || error.message,
            recipient: recipient
        });

        // Log failed transaction
        await updateLogs(transactionId, status, thirdpart_status, token);
         await Chargeback(transactionId); // Uncomment if you have chargeback functionality

        const statusCode = error?.response?.status;
        const errorMessage = error?.response?.data?.message;

        if (statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: errorMessage || "Bad request to SMS service"
            });
        }

        if (statusCode === 401) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed with SMS service. Please check API credentials."
            });
        }

        if (statusCode === 409) {
            return res.status(409).json({
                success: false,
                message: "Unknown sender Id"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Dear client, we're unable to complete your transaction right now. Please try again later",
            error: errorMessage || error.message
        });
    }
};

export default {
    bulkSmsPaymentServiceForCorporate,
    singleSmsPaymentServiceForCorporate
};