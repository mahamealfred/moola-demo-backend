import dotenv from "dotenv";
import axios from "axios";
import { bulkSmsPaymentServiceForCorporate, singleSmsPaymentServiceForCorporate } from "../services/smsService.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { createResponse, createErrorResponse } from '@moola/shared';
dotenv.config();


export const ddinPindoBulkSmsPaymentForCorporate = async (req, res) => {
    const {
        amount,
        recipients,
        senderId,
        smsMessage,
        ccy
    } = req.body;

    // Validate required fields
    if (!amount || !recipients || !senderId || !smsMessage || !ccy) {
        logger.warn("Missing required fields in corporate bulk SMS payment request", req.body);
        return res.status(400).json({
            success: false,
            message: "Missing required fields: amount, recipients, senderId, smsMessage, and ccy are all required."
        });
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
     let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0


    try {
        const decodedToken = await new Promise((resolve, reject) =>
            jwt.verify(token, process.env.JWT_SECRET, (err, user) =>
                err ? reject(err) : resolve(user)
            )
        );

        agent_name = decodedToken.name;
        agent_id = decodedToken.id;
        userAuth = decodedToken.userAuth;
    } catch (err) {
        logger.warn("Invalid token", { error: err.message });
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again. h",
        });
    }



    const service_name = "Bulk_SMS";

    const total_amount = 15 * recipients.length;
    const total_recipients = recipients.length;
    const description = `Bulk SMS Vending TX by Agent:${agent_name}, Total Recipients:${total_recipients}, Total SMS Per Recipient:1. Total Paid amount:${total_amount}`;

    
    if (!process.env.CYCLOS_URL) {
        logger.error("CYCLOS_URL is not defined in environment variables");
        return res.status(500).json({
            success: false,
            message: "A configuration error occurred. Please contact support or try again later."
        });
    }
console.log("User Auth:", userAuth); // Debugging line
    const data = JSON.stringify({
        toMemberId: "3",
        amount: total_amount,
        transferTypeId: "38",
        currencySymbol: ccy,
        description: description
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${userAuth}`,
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        
        logger.info("Corporate bulk SMS payment response from core system", {
            status: response.status,
            data: response.data
        });

        if (response.status === 200) {
            // Call SMS service for corporate
            return await bulkSmsPaymentServiceForCorporate(
                req, res, response, total_amount, recipients, description, 
                senderId, smsMessage, service_name, agent_name,agent_id
            );
        }

        return res.status(502).json({
            success: false,
            message: "Unexpected response from the payment server. Please try again later."
        });

    } catch (error) {
        const status = error?.response?.status;
        const errorDetails = error?.response?.data?.errorDetails;
        const coreError = error?.response?.data;

        logger.error("Corporate bulk SMS payment failed", {
            status,
            errorDetails,
            coreError
        });

        if (status === 401) {
            return res.status(401).json({
                success: false,
                message: "Username and Password are required for authentication"
            });
        }

        if (status === 400) {
            let message = "Invalid Username or Password";
            
            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                message = "Your transaction password is incorrect. Please try again.";
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                message = "Your transaction password has been blocked. Please contact support.";
            }

            return res.status(400).json({
                success: false,
                message: message
            });
        }

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message: "Account Not Found"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
            error: coreError || error.message
        });
    }
}

export const ddinPindoSingleSmsPaymentForCorporate = async (req, res) => {
    const {
        amount,
        recipient,
        senderId,
        smsMessage,
        ccy
    } = req.body;

    // Validate required fields
    if (!amount || !recipient || !senderId || !smsMessage || !ccy) {
        logger.warn("Missing required fields in corporate single SMS payment request", req.body);
        return res.status(400).json({
            success: false,
            message: "Missing required fields: amount, recipient, senderId, smsMessage, and ccy are all required."
        });
    }

    // Validate recipient format (basic phone number validation)
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(recipient)) {
        logger.warn("Invalid recipient phone number format", { recipient });
        return res.status(400).json({
            success: false,
            message: "Invalid recipient phone number format. Please provide a valid phone number."
        });
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0;

    try {
        const decodedToken = await new Promise((resolve, reject) =>
            jwt.verify(token, process.env.JWT_SECRET, (err, user) =>
                err ? reject(err) : resolve(user)
            )
        );

        agent_name = decodedToken.name;
        agent_id = decodedToken.id;
        userAuth = decodedToken.userAuth;
    } catch (err) {
        logger.warn("Invalid token", { error: err.message });
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }

    const service_name = "Single_SMS";
    const total_amount = 15; // Fixed amount for single SMS
    const total_recipients = 1;
    const description = `Single SMS Vending TX by Agent:${agent_name}, Recipient:${recipient}, Total SMS:1. Total Paid amount:${total_amount}`;

    if (!process.env.CYCLOS_URL) {
        logger.error("CYCLOS_URL is not defined in environment variables");
        return res.status(500).json({
            success: false,
            message: "A configuration error occurred. Please contact support or try again later."
        });
    }

    const data = JSON.stringify({
        toMemberId: "3",
        amount: total_amount,
        transferTypeId: "38",
        currencySymbol: ccy,
        description: description
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${userAuth}`,
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        
        logger.info("Corporate single SMS payment response from core system", {
            status: response.status,
            data: response.data
        });

        if (response.status === 200) {
            // Call SMS service for single SMS
            return await singleSmsPaymentServiceForCorporate(
                req, res, response, total_amount, recipient, description, 
                senderId, smsMessage, service_name, agent_name, agent_id
            );
        }

        return res.status(502).json({
            success: false,
            message: "Unexpected response from the payment server. Please try again later."
        });

    } catch (error) {
        const status = error?.response?.status;
        const errorDetails = error?.response?.data?.errorDetails;
        const coreError = error?.response?.data;

        logger.error("Corporate single SMS payment failed", {
            status,
            errorDetails,
            coreError
        });

        if (status === 401) {
            return res.status(401).json({
                success: false,
                message: "Username and Password are required for authentication"
            });
        }

        if (status === 400) {
            let message = "Invalid Username or Password";
            
            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                message = "Your transaction password is incorrect. Please try again.";
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                message = "Your transaction password has been blocked. Please contact support.";
            }

            return res.status(400).json({
                success: false,
                message: message
            });
        }

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message: "Account Not Found"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
            error: coreError || error.message
        });
    }
};
