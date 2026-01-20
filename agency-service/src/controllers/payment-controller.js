import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import { billercategories, decodeToken, findNetAmount, generateRequestId } from '../utils/helper.js';
import { generateFDIAccessToken } from '../utils/helper.js';
import { insertLogs, selectAllLogs, selectTransactionById, updateLogs } from '../utils/logsData.js';
import { getBillerCharge } from '../utils/helper.js';
import jwt from "jsonwebtoken";
import { createResponse, createErrorResponse } from '@moola/shared';
import { buildAirtimePayload, buildEcobankElecticityPayload, buildEcobankIremboPayPayload, buildEcobankRNITPayPayload, buildEcobankStartimePayload, buildEcobankWasacPayload, buildElecticityPayload, buildGenericBillerPayload, buildRRABillerPayload, buildRRAEcobankBillerPayload, buildStartimePayload } from '../utils/payloadBuilder.js';
import { ecobankBillPayamentService, fdiBillPayamentService } from '../services/billPayamentService.js';
import https from "https";
import { mockValidateBiller, mockExecutePayment, mockValidateEcobankBiller, isMockMode } from '@moola/shared/mock-payment-service';
dotenv.config();


const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';

const agent = new https.Agent({
    rejectUnauthorized: false,  // WARNING: disables SSL verification
});

// Map internal biller codes to FDI verticalId values
const FDI_VERTICAL_ID_MAP = {
    'electricity': 'ELEC',
    'airtime': 'airtime',
    'tax': 'tax',
    'paytv': 'paytv',
    'water': 'water',
};

const getFDIVerticalId = (billerCode) => {
    return FDI_VERTICAL_ID_MAP[billerCode?.toLowerCase()] || billerCode;
};
// Router function: decides which validator to use
export const validateBiller = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    if (!billerCode || !productCode || !customerId) {
        return res.status(400).json(createErrorResponse('validation.missing_biller_fields', req.language, 400));
    }

    // Check if mock mode is enabled
    if (isMockMode()) {
        logger.info(`[MOCK MODE] validateBiller called for ${billerCode}`);
        return await mockValidateBiller(req, res, billerCode, customerId);
    }

    // Billers that go through FDI
    const fdiBillers = ['tax', 'airtime', 'paytv', 'electricity', 'rra', 'water', 'rnit', 'irembopay'];
    // Billers that go through EcoBank
    const ecoBillers = ['RWANDA_WASAC', 'EUCL_ERW', 'ELEC', 'STTV', 'GTP-LOAD'];
    try {
        if (fdiBillers.includes(billerCode)) {

            return await ValidateBillerFdi(req, res);
        }

        else if (ecoBillers.includes(billerCode)) {

            return await validateBillEcobank(req, res);

        }
        else {
            logger.error('Validation routing failed: Bill cord not found', billerCode);
            return res.status(404).json(createErrorResponse('billing.biller_not_found', req.language, 404));
        }
    } catch (error) {
        logger.error('Validation routing failed f', { error: error.message });
        return res.status(500).json(createErrorResponse('common.server_error', req.language, 500, {
            error: error.message,
        }));
    }
};

// Falidate biller from FDI 
export const ValidateBillerFdi = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    logger.info('FDI Validation Request (Mock Mode - No API Call)', { 
        billerCode,
        productCode,
        customerId,
        amount
    });

    // Mock validation data with 3 samples per service
    const mockValidationSamples = {
        'electricity': [
            {
                customerId: '0123456789',
                pdtName: 'EWSA Electricity',
                customerAccountName: 'Jean Nshimiyimana - Kigali',
                vendMax: 200000,
                vendMin: 5000,
                meterNumber: 'MTR-123456',
                trxId: 'TRX-ELEC-001',
            },
            {
                customerId: '0987654321',
                pdtName: 'EWSA Electricity',
                customerAccountName: 'Uwishake Marie - Huye',
                vendMax: 200000,
                vendMin: 5000,
                meterNumber: 'MTR-654321',
                trxId: 'TRX-ELEC-002',
            },
            {
                customerId: '1122334455',
                pdtName: 'EWSA Electricity',
                customerAccountName: 'Pierre Kabushesha - Musanze',
                vendMax: 200000,
                vendMin: 5000,
                meterNumber: 'MTR-112233',
                trxId: 'TRX-ELEC-003',
            },
        ],
        'airtime': [
            {
                customerId: '250788123456',
                pdtName: 'MTN Airtime',
                customerAccountName: 'Jean Nshimiyimana',
                vendMax: 100000,
                vendMin: 1000,
                provider: 'MTN',
                trxId: 'TRX-AIR-001',
            },
            {
                customerId: '250701234567',
                pdtName: 'Airtel Airtime',
                customerAccountName: 'Uwishake Marie',
                vendMax: 100000,
                vendMin: 1000,
                provider: 'AIRTEL',
                trxId: 'TRX-AIR-002',
            },
            {
                customerId: '250712345678',
                pdtName: 'RURA Airtime',
                customerAccountName: 'Pierre Kabushesha',
                vendMax: 100000,
                vendMin: 1000,
                provider: 'RURA',
                trxId: 'TRX-AIR-003',
            },
        ],
        'tax': [
            {
                customerId: '0123456789',
                pdtName: 'RRA VAT Payment',
                customerAccountName: 'Business A Ltd - Kigali',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-123456789',
                taxType: 'VAT',
                trxId: 'TRX-TAX-001',
            },
            {
                customerId: '9876543210',
                pdtName: 'RRA Income Tax Payment',
                customerAccountName: 'Enterprise Corp - Huye',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-987654321',
                taxType: 'INCOME_TAX',
                trxId: 'TRX-TAX-002',
            },
            {
                customerId: '1122334455',
                pdtName: 'RRA Business Tax Payment',
                customerAccountName: 'Trading Company - Musanze',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-112233445',
                taxType: 'BUSINESS_TAX',
                trxId: 'TRX-TAX-003',
            },
        ],
        'rra': [
            {
                customerId: '0123456789',
                pdtName: 'RRA VAT Payment',
                customerAccountName: 'Business A Ltd - Kigali',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-123456789',
                taxType: 'VAT',
                trxId: 'TRX-RRA-001',
            },
            {
                customerId: '9876543210',
                pdtName: 'RRA Income Tax Payment',
                customerAccountName: 'Enterprise Corp - Huye',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-987654321',
                taxType: 'INCOME_TAX',
                trxId: 'TRX-RRA-002',
            },
            {
                customerId: '1122334455',
                pdtName: 'RRA Business Tax Payment',
                customerAccountName: 'Trading Company - Musanze',
                vendMax: 5000,
                vendMin: 100,
                tinNumber: 'TIN-112233445',
                taxType: 'BUSINESS_TAX',
                trxId: 'TRX-RRA-003',
            },
        ],
        'paytv': [
            {
                customerId: '1234567890',
                pdtName: 'MyTV Basic Package',
                customerAccountName: 'MyTV Subscriber - Basic Plan',
                vendMax: 50000,
                vendMin: 5000,
                subscriberNumber: 'SUB-001234',
                packageType: 'BASIC',
                trxId: 'TRX-TV-001',
            },
            {
                customerId: '9876543210',
                pdtName: 'MyTV Standard Package',
                customerAccountName: 'MyTV Subscriber - Standard Plan',
                vendMax: 50000,
                vendMin: 5000,
                subscriberNumber: 'SUB-987654',
                packageType: 'STANDARD',
                trxId: 'TRX-TV-002',
            },
            {
                customerId: '5555555555',
                pdtName: 'MyTV Premium Package',
                customerAccountName: 'MyTV Subscriber - Premium Plan',
                vendMax: 50000,
                vendMin: 5000,
                subscriberNumber: 'SUB-PREM01',
                packageType: 'PREMIUM',
                trxId: 'TRX-TV-003',
            },
        ],
        'rnit': [
            {
                customerId: '1000000000000001',
                pdtName: 'Rwanda National ID Service',
                customerAccountName: 'Jean Nshimiyimana - Kigali',
                vendMax: 50000,
                vendMin: 1000,
                nationalId: '1000000000000001',
                idStatus: 'ACTIVE',
                trxId: 'TRX-RNIT-001',
            },
            {
                customerId: '1000000000000002',
                pdtName: 'Rwanda National ID Service',
                customerAccountName: 'Marie Uwishake - Huye',
                vendMax: 50000,
                vendMin: 1000,
                nationalId: '1000000000000002',
                idStatus: 'ACTIVE',
                trxId: 'TRX-RNIT-002',
            },
            {
                customerId: '1000000000000003',
                pdtName: 'Rwanda National ID Service',
                customerAccountName: 'Pierre Kabushesha - Musanze',
                vendMax: 50000,
                vendMin: 1000,
                nationalId: '1000000000000003',
                idStatus: 'ACTIVE',
                trxId: 'TRX-RNIT-003',
            },
        ],
        'irembopay': [
            {
                customerId: 'IREMBO001001',
                pdtName: 'Irembo - Business License',
                customerAccountName: 'Business A Ltd - Kigali',
                vendMax: 500000,
                vendMin: 10000,
                serviceType: 'BUSINESS_LICENSE',
                referenceNumber: 'REF-IREMBO-001',
                trxId: 'TRX-IREMBO-001',
            },
            {
                customerId: 'IREMBO002002',
                pdtName: 'Irembo - Land Lease',
                customerAccountName: 'Enterprise Corp - Huye',
                vendMax: 500000,
                vendMin: 10000,
                serviceType: 'LAND_LEASE',
                referenceNumber: 'REF-IREMBO-002',
                trxId: 'TRX-IREMBO-002',
            },
            {
                customerId: 'IREMBO003003',
                pdtName: 'Irembo - Building Permit',
                customerAccountName: 'Construction Ltd - Musanze',
                vendMax: 500000,
                vendMin: 10000,
                serviceType: 'BUILDING_PERMIT',
                referenceNumber: 'REF-IREMBO-003',
                trxId: 'TRX-IREMBO-003',
            },
        ],
    };

    const billerKey = billerCode.toLowerCase();
    const samples = mockValidationSamples[billerKey];

    if (!samples) {
        logger.warn('No mock samples found for biller', { billerCode });
        return res.status(404).json(createErrorResponse('billing.biller_not_found', req.language, 404));
    }

    // Find matching sample by customerId
    const matchingSample = samples.find(s => s.customerId === customerId);

    if (!matchingSample) {
        logger.warn('Invalid customer ID provided', { billerCode, customerId });
        
        // Service-specific error messages
        const serviceMessages = {
            'electricity': 'Electricity meter account not found',
            'airtime': 'Airtime account not found',
            'tax': 'Tax account not found',
            'paytv': 'PayTV subscriber account not found',
            'rnit': 'National ID record not found',
            'irembopay': 'Irembo service account not found',
        };
        
        const errorMessage = serviceMessages[billerKey] || 'Customer account not found';
        const validIds = samples.map(s => s.customerId).join(', ');
        
        return res.status(400).json({
            success: false,
            message: errorMessage,
            details: `Valid customer IDs: ${validIds}`,
            code: 'CUSTOMER_NOT_FOUND'
        });
    }

    logger.info('Mock validation response returned', { 
        billerCode, 
        customerId, 
        matchingSample,
        totalSamples: samples.length,
        amount
    });

    // Build response object
    const responseData = {
        productId: billerCode,
        productName: matchingSample.pdtName,
        customerId: matchingSample.customerId,
        customerName: matchingSample.customerAccountName,
        maxAmount: matchingSample.vendMax,
        minAmount: matchingSample.vendMin,
        requestId: matchingSample.trxId,
        samples: samples.map(s => ({
            customerId: s.customerId,
            customerName: s.customerAccountName,
            ...Object.fromEntries(
                Object.entries(s).filter(([key]) => !['customerId', 'customerAccountName'].includes(key))
            )
        }))
    };

    // Add tax-specific fields if this is a tax or RRA service and amount is provided
    if ((billerKey === 'tax' || billerKey === 'rra') && amount) {
        try {
            const customerCharge = await getBillerCharge(amount, billerKey);
            const totalToPay = amount + customerCharge;
            responseData.amountRequested = amount;
            responseData.customerCharge = customerCharge;
            responseData.amountToPay = totalToPay;
            logger.info('Tax charges calculated', { amountRequested: amount, customerCharge, totalToPay });
        } catch (error) {
            logger.warn('Failed to calculate tax charges', { error: error.message });
        }
    }

    return res.status(200).json(createResponse(true, 'billing.details_validated_successfully', responseData, req.language));
}



// Validate Bill Payment ecobank
export const validateBillEcobank = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    if (!billerCode || !productCode || !customerId) {
        logger.warn('Missing required fields', { billerCode, productCode, customerId });
        return res.status(400).json(createErrorResponse('validation.missing_biller_fields', req.language, 400));
    }

    // Check if mock mode is enabled
    if (isMockMode()) {
        logger.info(`[MOCK MODE] validateBillEcobank called for ${billerCode}`);
        return await mockValidateEcobankBiller(req, res);
    }

    const header = {
        sourceCode: 'DDIN',
        affcode: 'ERW',
        requestId: 'A' + Date.now(),
        agentcode: AGENT_CODE,
        requesttype: 'VALIDATE',
        sourceIp: '10.8.245.9',
        channel: 'API',
    };

    const tokenString =
        header.affcode +
        header.requestId +
        header.agentcode +
        header.sourceCode +
        header.sourceIp;

    const requestToken = crypto.createHash('sha512').update(tokenString).digest('hex');
    header.requestToken = requestToken;

    const payload = {
        formData: [
            {
                fieldName: 'EMAIL',
                fieldValue: 'osei@gmail.com', // Can be made dynamic if needed
            },
            {
                fieldName: 'CUSTOMERID',
                fieldValue: customerId,
            },
            {
                fieldName: 'LAST4DIGITS',
                fieldValue: '1234', // Also can be dynamic if needed
            },
        ],
        billerCode,
        productCode,
        amount: amount, // Make dynamic if needed
        header,
    };

    const config = {
        method: 'post',
        url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/validatebillpayment',
        headers: {
            'Content-Type': 'application/json',
        },
        data: payload,
        httpsAgent: agent
    };

    try {
        const response = await axios.request(config);
        const responseData = response.data;

        logger.info('Bill payment validation response', { responseData });

        if (responseData?.header?.responsecode === '000') {
            return res.status(200).json(createResponse(true, 'billing.payment_validated_successfully', responseData, req.language));
        } else {
            return res.status(400).json({
                success: false,
                message: responseData?.header?.responsemessage,
                code: responseData?.header?.responsecode,
            });
        }
    } catch (error) {

        logger.error('Bill payment validation failed', {
            error: error?.response?.data || error.message,
        });
        if (error.response?.header?.responsecode) {
            return res.status(400).json(createErrorResponse('billing.payment_validation_failed', req.language, 400, {
                code: error.response?.header?.responsecode,
                apiMessage: error.response?.header?.responsemessage
            }));
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error?.response?.data || error.message,
        });
    }
};
//biller payment 
// Router function: decides which validator to use
export const executeBillerPayment = async (req, res) => {
    const {
        email,
        customerId,
        billerCode,
        productCode,
        amount,
        ccy,
        requestId,
        clientPhone
    } = req.body;

    if (!email || !customerId || !billerCode || !productCode || !amount) {
        logger.warn('Missing required fields for bill payment', req.body);
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: email, customerNumber, billerCode, productCode, amount ',
        });
    }

    // Check if mock mode is enabled
    if (isMockMode()) {
        logger.info(`[MOCK MODE] executeBillerPayment called for ${billerCode}`);
        return await mockExecutePayment(req, res, billerCode, amount);
    }

    // Billers that go through FDI
    const fdiBillers = ['tax', 'airtime', 'paytv', 'electricity', 'rra', 'water', 'rnit', 'irembopay'];
    // Billers that go through EcoBank
    const ecoBillers = ['RWANDA_WASAC', 'EUCL_ERW', 'ELEC', 'STTV', 'GTP-LOAD'];
    try {
        if (fdiBillers.includes(billerCode)) {

            return await executeBillerPaymentFDI(req, res);
        }

        else if (ecoBillers.includes(billerCode)) {

            return await executeBillPaymentEcoBank(req, res);

        }
        else {
            logger.error('Payment routing failed: Bill cord not found', billerCode);
            return res.status(404).json({
                success: false,
                message: 'Execute biller routing failed: Bill cord not found',

            });
        }
    } catch (error) {
        logger.error('Execute routing failed', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Internal server error during executing biller ',
            error: error.message,
        });
    }
};

export const executeBillPaymentEcoBank = async (req, res) => {
    // Early return check
    if (res.headersSent) {
        logger.warn('Response already sent, skipping bill payment');
        return;
    }

    const {
        email,
        customerId,
        billerCode,
        clientPhone,
        productCode,
        amount,
        ccy,
        requestId
    } = req.body;

    if (!email || !customerId || !billerCode || !productCode || !amount) {
        logger.warn('Missing required fields for bill payment', req.body);
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: email, customerId, billerCode, productCode, amount ',
        });
    }

    // Check if mock mode is enabled
    if (isMockMode()) {
        logger.info(`[MOCK MODE] executeBillPaymentEcoBank called for ${billerCode}`);
        return await mockExecutePayment(req, res, billerCode, amount);
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0
    let customer_charge = 0;
    let netAmount = findNetAmount(amount)
    if (billerCode.toLowerCase() === "RRA") {
        customer_charge = await getBillerCharge(amount, billerCode);
    }

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

    if (!process.env.CYCLOS_URL) {
        logger.error("CORE_URL is not defined in environment variables");
        return res.status(500).json({
            success: false,
            message: "A configuration error occurred. Please contact support or try again later.",
        });
    }

    const payload = billerCode === "ELEC"
        ? buildEcobankElecticityPayload({ amount, requestId, ccy, customerId, clientPhone })
        : billerCode === "EUCL_ERW"
            ? buildEcobankElecticityPayload({ amount, requestId, ccy, customerId, clientPhone })
            : billerCode === "STTV"
                ? buildEcobankStartimePayload({ amount, requestId, ccy, customerId, clientPhone })
                : billerCode === "RWANDA_WASAC"
                    ? buildEcobankWasacPayload({ amount, requestId, ccy, customerId, clientPhone })
                    : billerCode === "IREMBOPAY"
                        ? buildEcobankIremboPayPayload({ amount, requestId, ccy, customerId, clientPhone })
                        : billerCode === "RNIT"
                            ? buildEcobankRNITPayPayload({ amount, requestId, ccy, customerId, clientPhone })
                            : billerCode === "RRA"
                                ? buildRRAEcobankBillerPayload({ amount, requestId, ccy, customerId, clientPhone, netAmount })
                                : buildGenericBillerPayload({
                                    amount,
                                    requestId,
                                    ccy,
                                    customerId,
                                    clientPhone,
                                    billerCode,
                                });

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${userAuth}`,
        },
        data: JSON.stringify(payload),
    };


    try {
        const cyclosResp = await axios.request(config);

        logger.info("Biller payment response from core system", {
            status: cyclosResp.status,
            data: cyclosResp.data,
        });

        if (cyclosResp.status === 200) {
            let electricityToken = null

            await insertLogs(
                cyclosResp.data.id,            // transactionId
                null,                   // thirdpart_status
                "Payment processed",         // description
                amount,
                customer_charge,
                agent_id,                  // amount
                agent_name,                  // agent_name
                "pending",                  // status
                billerCode,                   // service_name
                requestId,                   // trxId
                customerId,                  // customerId
                electricityToken             // token
            );

            // Return mock response without calling EcoBank third-party service
            const token = billerCode.toLowerCase() === "elec" || billerCode.toLowerCase() === "eucl_erw" ? "MOCK20240106001234" : null;
            const units = billerCode.toLowerCase() === "elec" || billerCode.toLowerCase() === "eucl_erw" ? 150 : null;
            
            // Build comprehensive description with all transaction details
            const description = `${billerCode.toUpperCase()} payment - Customer ID: ${customerId} - Amount: ${amount} - Agent: ${agent_name} (${agent_id}) - Request ID: ${requestId}${units ? ` - Units: ${units}` : ''}${token ? ` - Token: ${token}` : ''}`.trim();
            
            // Update logs with successful status (non-blocking)
            updateLogs(
              cyclosResp.data.id,      // transactionId
              "successful",            // status
              "successful",            // thirdpart_status
              token,                   // token
              description              // description
            ).catch(err => {
              logger.error("Failed to update logs after successful payment", { error: err.message });
            });
            
            return res.status(200).json({
              success: true,
              message: "Your payment was successful.",
              data: {
                transactionId: cyclosResp.data.id,
                requestId,
                amount,
                subagentCode: agent_id,
                agentName: agent_name,
                token: token,
                units: units,
                deliveryMethod: billerCode.toLowerCase() === "elec" || billerCode.toLowerCase() === "eucl_erw" ? "SMS" : "NOTIFICATION",
                billerCode: billerCode,
                customerId: customerId,
                timestamp: new Date().toISOString()
              },
            });
        } else {
            // Handle non-200 responses from cyclos
            return res.status(502).json({
                success: false,
                message: "Unexpected response from the payment server. Please try again later.",
            });
        }

    } catch (error) {
        const status = error?.response?.status;
        const errorDetails = error?.response?.data?.errorDetails;
        const coreError = error?.response?.data;

        logger.error("Biller payment failed", {
            status,
            errorDetails,
            coreError,
        });

        if (status === 400) {
            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                return res.status(400).json(createErrorResponse('banking.invalid_transaction_password', req.language, 400));
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                return res.status(400).json(createErrorResponse('banking.blocked_transaction_password', req.language, 400));
            }

            return res.status(400).json(createErrorResponse('validation.invalid_payment_data', req.language, 400, {
                details: errorDetails
            }));
        }

        if (status === 401) {
            return res.status(401).json({ success: false, message: "Authentication failed." });
        }

        if (status === 404) {
            console.log("Error details:", errorDetails);
            return res.status(404).json({ success: false, message: "Account not found." });
        }

        return res.status(500).json({
            success: false,
            message: "We're unable to process your transaction right now. Please try again later.",
            error: coreError || error.message,
        });
    }
};


//FDI Execute Biller
//execute bill 
export const executeBillerPaymentFDI = async (req, res) => {
    const {
        amount,
        requestId,
        email,
        clientPhone,
        billerCode,
        productCode,
        ccy,
        customerId,
    } = req.body;

    if (!amount || !requestId || !ccy || !billerCode || !productCode) {
        logger.warn("Missing required fields in biller payment request", req.body);
        return res.status(400).json({
            success: false,
            message:
                "Missing required fields: amount, requestId, ccy, billerCode, and productCode are all required.",
        });
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const decodedToken = decodeToken(token);
    const agentCategory = decodedToken.agentCategory;
    
    let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0
    let customer_charge = 0;
    let netAmount = amount;
    if (billerCode.toLowerCase() === "tax" || billerCode.toLowerCase() === "rra") {
        customer_charge = await getBillerCharge(amount, billerCode);
        netAmount = amount;
    }

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

    if (!process.env.CYCLOS_URL) {
        logger.error("CORE_URL is not defined in environment variables");
        return res.status(500).json({
            success: false,
            message:
                "A configuration error occurred. Please contact support or try again later.",
        });
    }


    const payload =
        billerCode.toLowerCase() === "airtime"
            ? buildAirtimePayload({ amount, requestId, ccy, customerId, clientPhone,agentCategory })
            : billerCode.toLowerCase() === "electricity"
                ? buildElecticityPayload({ amount, requestId, ccy, customerId, clientPhone,agentCategory })
                : billerCode.toLowerCase() === "paytv"
                    ? buildStartimePayload({ amount, requestId, ccy, customerId, clientPhone,agentCategory })
                    : (billerCode.toLowerCase() === "tax" || billerCode.toLowerCase() === "rra")
                        ? buildRRABillerPayload({ amount, requestId, ccy, customerId, clientPhone, netAmount, agentCategory })
                        : buildGenericBillerPayload({
                            amount,
                            requestId,
                            ccy,
                            customerId,
                            clientPhone,
                            billerCode,
                        });

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${process.env.CYCLOS_URL}/rest/payments/confirmMemberPayment`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${userAuth}`,
        },
        data: JSON.stringify(payload),
    };
console.log("config:",config)
 
    try {
          const response = await axios.request(config);

        logger.info("Biller payment response from core system", {
            status: response.status,
            data: response.data,
        });

        if (response.status === 200) {
            // Generate token if electricity
            let electricityToken = null
            // billerCode.toLowerCase() === "electricity"
            //   ? generate20DigitToken()
            //   : null;

            // Save log to DB
            logger.info('Saving transaction log', { 
                amount, 
                customer_charge, 
                billerCode,
                customerId
            });
            await insertLogs(
                response.data.id,            // transactionId
                null,                   // thirdpart_status
                "Payment processed",         // description
                amount,
                customer_charge,        // Save the calculated charge separately
                agent_id,                  // agent_id
                agent_name,                  // agent_name
                "pending",                  // status
                billerCode,                   // service_name
                requestId,                   // trxId
                customerId,                  // customerId
                electricityToken             // token
            );
            // Return dummy/mock response without calling FDI service
            const token = billerCode.toLowerCase() === "electricity" ? "MOCK20240106001234" : null;
            const units = billerCode.toLowerCase() === "electricity" ? 150 : null;
            
            // Build comprehensive description with all transaction details
            const description = `${billerCode.toUpperCase()} payment - Customer ID: ${customerId} - Amount: ${amount} - Agent: ${agent_name} (${agent_id}) - Request ID: ${requestId}${units ? ` - Units: ${units}` : ''}${token ? ` - Token: ${token}` : ''}`.trim();
            
            // Update logs with successful status (non-blocking)
            updateLogs(
              response.data.id,      // transactionId
              "successful",          // status
              "successful",          // thirdpart_status
              token,                 // token
              description            // description
            ).catch(err => {
              logger.error("Failed to update logs after successful payment", { error: err.message });
            });
            
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
                deliveryMethod: billerCode.toLowerCase() === "electricity" ? "SMS" : "NOTIFICATION",
                billerCode: billerCode,
                customerId: customerId,
                timestamp: new Date().toISOString()
              },
            });


        }


        return res.status(502).json({
            success: false,
            message:
                "Unexpected response from the payment server. Please try again later.",
        });
    } catch (error) {
       
        const status = error?.response?.status;
        const errorDetails = error?.response?.data?.errorDetails;
        const coreError = error?.response?.data;

        logger.error("Biller payment failed", {
            status,
            errorDetails,
            coreError,
        });



        if (status === 400) {
            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                return res.status(400).json(createErrorResponse('banking.invalid_transaction_password', req.language, 400));
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                return res.status(400).json(createErrorResponse('banking.blocked_transaction_password', req.language, 400));
            }

            return res.status(400).json(createErrorResponse('validation.invalid_payment_data', req.language, 400, {
                details: errorDetails
            }));
        }

        if (status === 401) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication failed." });
        }

        if (status === 404) {
            return res
                .status(404)
                .json({ success: false, message: "Account not found." });
        }

        return res.status(500).json({
            success: false,
            message:
                "We're unable to process your transaction right now. Please try again later.",
            error: coreError || error.message,
        });
    }
};

//Get billers
export const getBillerList = async (req, res) => {
    try {
        const { category } = req.query;

        let billers = [];

        if (category) {
            if (billercategories[category]) {
                billers = billercategories[category];
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Category "${category}" not found`,
                });
            }
        } else {
            // Flatten all billers into one array
            for (const key in billercategories) {
                billers = billers.concat(billercategories[key]);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Biller list retrieved successfully',
            data: billers,
        });
    } catch (error) {
        logger.error('Failed to fetch biller list', {
            error: error?.message,
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error?.message,
        });
    }
};


//transaction by Id
export const getTransactionsById = async (req, res) => {
    const { id } = req.params
    try {
        const result = await selectTransactionById(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found. Please verify transaction ID details.',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Transaction Details',
            data: result
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "We're unable to complete the transaction right now. Please try again later.",
            error: coreError || error.message,
        });
    }
}
//GET TRNASACTIONS
//transaction by Id
export const getAllAgentTransactions = async (req, res) => {

    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        let id = 0

        try {
            const userTokenDetails = await new Promise((resolve, reject) =>
                jwt.verify(token, process.env.JWT_SECRET, (err, user) =>
                    err ? reject(err) : resolve(user)
                )
            );
            id = userTokenDetails.id;

        } catch (err) {
            logger.warn("Invalid token", { error: err.message });
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please log in again.",
            });
        }






        const result = await selectAllLogs(id);
        if (result.length < 1) {
            return res.status(404).json({
                success: false,
                message: 'Transactions not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Transactions Details',
            data: result
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "We're unable to complete the transaction right now. Please try again later.",
            error: error.message,
        });
    }
}



// Get Biller Details
export const getBillerDetails = async (req, res) => {
    const { billerCode } = req.body;

    if (!billerCode) {
        logger.warn('Missing billerCode in request body');
        return res.status(400).json({
            success: false,
            message: 'Missing required field: billerCode',
        });
    }

    const header = {
        sourceCode: 'DDIN',
        affcode: 'ERW',
        requestId: 'A' + Date.now(),
        agentcode: AGENT_CODE,
        requesttype: 'VALIDATE',
        sourceIp: '10.8.245.9',
        channel: 'API',
    };

    const tokenString =
        header.affcode +
        header.requestId +
        header.agentcode +
        header.sourceCode +
        header.sourceIp;

    const requestToken = crypto.createHash('sha512').update(tokenString).digest('hex');
    header.requestToken = requestToken;

    const payload = {
        billercode: billerCode,
        header,
    };

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/getbillerdetails',
        headers: {
            'Content-Type': 'application/json',
        },
        data: payload,
    };

    try {
        const response = await axios.request(config);
        const responseData = response.data;

        logger.info('Biller details fetched successfully', { responseData });

        if (responseData?.header?.responsecode === '000') {
            return res.status(200).json({
                success: true,
                message: 'Biller details retrieved successfully',
                data: responseData,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: responseData?.header?.responsemessage,
                code: responseData?.header?.responsecode,
            });
        }
    } catch (error) {
        logger.error('Failed to fetch biller details', {
            error: error?.response?.data || error.message,
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error?.response?.data || error.message,
        });
    }
};

// Get List of Agent Billers
export const getBillers = async (req, res) => {
    const header = {
        sourceCode: 'DDIN',
        affcode: 'ERW',
        requestId: 'A' + Date.now(),
        agentcode: AGENT_CODE,
        requesttype: 'VALIDATE',
        sourceIp: '10.8.245.9',
        channel: 'API',
    };

    const tokenString =
        header.affcode +
        header.requestId +
        header.agentcode +
        header.sourceCode +
        header.sourceIp;

    const requestToken = crypto.createHash('sha512').update(tokenString).digest('hex');
    header.requestToken = requestToken;

    const payload = { header };

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/agentbillers',
        headers: {
            'Content-Type': 'application/json',
        },
        data: payload,
    };

    try {
        const response = await axios.request(config);
        const responseData = response.data;

        logger.info('Fetched agent billers', { responseData });

        if (responseData?.header?.responsecode === '000') {
            return res.status(200).json({
                success: true,
                message: 'Billers fetched successfully',
                data: responseData,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: responseData?.header?.responsemessage,
                code: responseData?.header?.responsecode,
            });
        }
    } catch (error) {
        logger.error('Failed to fetch agent billers', {
            error: error?.response?.data || error.message,
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error?.response?.data || error.message,
        });
    }
};


// Get Bill Payment Fee
export const getBillPaymentFee = async (req, res) => {
    const { billerCode, amount } = req.body;

    if (!billerCode || !amount) {
        logger.warn('Missing billerCode or amount in request body', { billerCode, amount });
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: billerCode or amount',
        });
    }

    const header = {
        sourceCode: 'DDIN',
        affcode: 'ERW',
        requestId: 'A' + Date.now(),
        agentcode: AGENT_CODE,
        requesttype: 'VALIDATE',
        sourceIp: '10.8.245.9',
        channel: 'API',
    };

    const tokenString =
        header.affcode +
        header.requestId +
        header.agentcode +
        header.sourceCode +
        header.sourceIp;

    const requestToken = crypto.createHash('sha512').update(tokenString).digest('hex');
    header.requestToken = requestToken;

    const payload = {
        billercode: billerCode,
        amount,
        header,
    };

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://mule.ecobank.com/agencybanking/services/thirdpartyagencybanking/getbillpaymentfee',
        headers: {
            'Content-Type': 'application/json',
        },
        data: payload,
    };

    try {
        const response = await axios.request(config);
        const responseData = response.data;

        logger.info('Fetched bill payment fee', { responseData });

        if (responseData?.header?.responsecode === '000') {
            return res.status(200).json({
                success: true,
                message: 'Payment fee retrieved successfully',
                data: responseData,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: responseData?.header?.responsemessage,
                code: responseData?.header?.responsecode,
            });
        }
    } catch (error) {
        logger.error('Failed to fetch bill payment fee', {
            error: error?.response?.data || error.message,
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error?.response?.data || error.message,
        });
    }
};

