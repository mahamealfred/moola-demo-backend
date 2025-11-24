import jwt from "jsonwebtoken";
import axios from "axios";
import xml2js from "xml2js";
import trustAccountToAgentFloat from "../service/trustAccountToAgentFloat.js";
import logger from "../utils/logger.js";
import { createResponse, createErrorResponse } from "@moola/shared";

// Self serve commission
export const withdrawalCommission = async (req, res) => {
    logger.info("Self Serve Commission endpoint hit...");

    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            logger.warn("No token provided!");
            return res.status(401).json(createErrorResponse('authentication.required', req.language, 401));
        }

        const userTokenDetails = await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                logger.warn("Invalid token!");
                return res.status(401).json(createErrorResponse('authentication.invalid_token', req.language, 401));
            }
            return user;
        });

        const { amount } = req.body;
        const agent_name = userTokenDetails.username;

        // Input validation
        if (!amount || isNaN(amount)) {
            logger.warn("Invalid amount provided");
            return res.status(400).json(createErrorResponse('validation.amount_required', req.language, 400));
        }

        if (amount < 5000) {
            logger.warn("Amount must be at least 5000 RWF.");
            return res.status(400).json(createErrorResponse('validation.minimum_amount_5000', req.language, 400));
        }

        const url = process.env.CYCLOS_URL + '/services/payment';
        
        // Enhanced SOAP request with better formatting
        const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://payments.webservices.cyclos.strohalm.nl/">
    <soapenv:Header/>
    <soapenv:Body>
        <pay:doPayment>
            <params>
                <toSystem>true</toSystem>  
                <fromMemberPrincipalType>USER</fromMemberPrincipalType>
                <fromMember>${agent_name}</fromMember>
                <amount>${amount}</amount>
                <description>Agent Commission Withdrawal</description>
                <transferTypeId>100</transferTypeId>        
            </params>
        </pay:doPayment>
    </soapenv:Body>
</soapenv:Envelope>`;

        const headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
        };

        logger.info(`Making SOAP request for agent: ${agent_name}, amount: ${amount}`);
        
        // Log the request for debugging (remove sensitive data in production)
        logger.debug(`SOAP Request: ${soapRequest.replace(/<fromMember>.*<\/fromMember>/, '<fromMember>***</fromMember>')}`);

        const response = await axios.post(url, soapRequest, { 
            headers,
            timeout: 30000 
        });

        try {
            const result = await xml2js.parseStringPromise(response.data, { 
                explicitArray: false,
                trim: true 
            });
            
            logger.debug("SOAP response received and parsed successfully");
            logger.debug(`Raw SOAP Response: ${JSON.stringify(result, null, 2)}`);

            // Enhanced response parsing with better error handling
            const soapBody = result?.["soap:Envelope"]?.["soap:Body"];
            const paymentResponse = soapBody?.['ns2:doPaymentResponse']?.return;

            if (!paymentResponse) {
                logger.error("Invalid SOAP response structure", { response: result });
                return res.status(500).json(createErrorResponse('banking.invalid_payment_response', req.language, 500));
            }

            const { status, transactionNumber, errors } = paymentResponse;

            logger.info(`SOAP Response Status: ${status} for agent: ${agent_name}`);

            if (status === "PROCESSED") {
                logger.info(`Payment processed successfully for agent: ${agent_name}, transaction: ${transactionNumber}`);
                await trustAccountToAgentFloat(req, res, agent_name, amount);
            } else if (status === "INVALID_PARAMETERS") {
                logger.warn(`Invalid parameters in SOAP response for agent: ${agent_name}`, { 
                    errors: errors || 'No detailed error information'
                });
                
                // More specific error message based on common issues
                let errorMessage = "Invalid transaction parameters. Please check your account balance and try again.";
                
                if (errors) {
                    if (typeof errors === 'string') {
                        errorMessage = errors;
                    } else if (errors._) {
                        errorMessage = errors._;
                    } else if (errors.message) {
                        errorMessage = errors.message;
                    }
                }
                
                return res.status(400).json({
                    success: false,
                    message: errorMessage,
                    
                   // details: "Please ensure you have sufficient balance and your account is active."
                });
            } else {
                logger.warn(`Unexpected SOAP response status: ${status} for agent: ${agent_name}`);
                return res.status(400).json({
                    success: false,
                    message: "Transaction failed. Please try again later.",
                   
                });
            }

        } catch (parseError) {
            logger.error("Error parsing SOAP response", { 
                error: parseError.message,
                responseData: response.data 
            });
            return res.status(500).json({
                success: false,
                message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
                
            });
        }

    } catch (error) {
        logger.error("Self Serve Commission error occurred", { 
            error: error.message,
            stack: error.stack 
        });

        if (error.response) {
            logger.error(`SOAP API error: ${error.response.status} - ${error.response.data}`);
            
            if (error.response.status === 400) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request to payment service",
                    
                });
            }
            
            return res.status(500).json({
                 success: false,
                message: "Service temporarily unavailable. Please try again later.",
               
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: "Request timeout. Please try again.",
                
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            
        });
    }
};