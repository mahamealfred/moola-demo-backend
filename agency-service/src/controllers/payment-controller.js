import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import { billercategories, findNetAmount, generateRequestId } from '../utils/helper.js';
import { generateFDIAccessToken } from '../utils/helper.js';
import { insertLogs, selectAllLogs, selectTransactionById } from '../utils/logsData.js';
import { getBillerCharge } from '../utils/helper.js';
import jwt from "jsonwebtoken";
import { buildAirtimePayload, buildEcobankElecticityPayload, buildEcobankIremboPayPayload, buildEcobankRNITPayPayload, buildEcobankStartimePayload, buildEcobankWasacPayload, buildElecticityPayload, buildGenericBillerPayload, buildRRABillerPayload, buildRRAEcobankBillerPayload, buildStartimePayload } from '../utils/payloadBuilder.js';
import { ecobankBillPayamentService, fdiBillPayamentService } from '../services/billPayamentService.js';
import https from "https";
dotenv.config();


const AGENT_CODE = process.env.AGENT_CODE;
const PIN = process.env.AGENT_PIN;
const AFFCODE = 'ERW';
const SOURCE_CODE = 'DDIN';

const agent = new https.Agent({
    rejectUnauthorized: false,  // WARNING: disables SSL verification
});
// Router function: decides which validator to use
export const validateBiller = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    if (!billerCode || !productCode || !customerId) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: billerCode, productCode, or customerId',
        });
    }

    // Billers that go through FDI
    const fdiBillers = ['tax', 'airtime', 'paytv', 'electricity'];
    // Billers that go through FDI
    const ecoBillers = ['RRA', 'RWANDA_WASAC', 'IREMBOPAY', 'EUCL_ERW', 'ELEC', 'STTV', 'RNIT', 'GTP-LOAD'];
    try {
        if (fdiBillers.includes(billerCode)) {

            return await ValidateBillerFdi(req, res);
        }

        else if (ecoBillers.includes(billerCode)) {

            return await validateBillEcobank(req, res);

        }
        else {
            logger.error('Validation routing failed: Bill cord not found', billerCode);
            return res.status(404).json({
                success: false,
                message: 'Validation routing failed: Bill cord not found',

            });
        }
    } catch (error) {
        logger.error('Validation routing failed f', { error: error.message });
        return res.status(500).json({
            success: false,
            message: 'Internal server error during biller validation',
            error: error.message,
        });
    }
};

// Falidate biller from FDI 
export const ValidateBillerFdi = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    // if (!billerCode || !productCode || !customerId) {
    //     logger.warn('Missing required fields', { billerCode, productCode, customerId });
    //     return res.status(400).json({
    //         success: false,
    //         message: 'Missing required fields: billerCode, productCode, or customerId',
    //     });
    // }

    let accessToken;
    try {
        accessToken = await generateFDIAccessToken();
    } catch (err) {
        logger.error('Failed to generate access token', { error: err.message });
        return res.status(500).json({
            success: false,
            message: 'Failed to generate access token',
            error: err.message,
        });
    }

    if (!accessToken) {
        logger.warn('Missing access token');
        return res.status(401).json({
            success: false,
            message: 'A token is required for authentication',
        });
    }

    const payload = {
        verticalId: billerCode,
        customerAccountNumber: customerId,
    };

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.EFASHE_URL}/rw/v2/vend/validate`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`,
        },
        data: JSON.stringify(payload),
    };

    try {
        const response = await axios.request(config);
        const responseData = response.data;
        logger.info(' validation response', { responseData });
        if (response.status === 200 && responseData?.data) {
            return res.status(200).json({
                success: true,
                message: 'Details validated successfully',
                data: {
                    productId: billerCode,
                    productName: responseData.data.pdtName,
                    customerId: customerId,
                    customerName: responseData.data.customerAccountName,
                    maxAmount: responseData.data.vendMax,
                    requestId: responseData.data.trxId,

                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to complete your transaction at this time. Please try again later.",
        });
    } catch (error) {
        console.log("error:", error)
        const status = error?.response?.status;
        const errorMessage = error?.response?.data?.msg || error.message;

        logger.error('Phone number validation failed', {
            status,
            error: error?.response?.data || errorMessage,
        });

        if (status === 404) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        if (status === 400 || status === 422) {
            return res.status(status).json({
                success: false,
                message: errorMessage,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            error: errorMessage,
        });
    }
}



// Validate Bill Payment ecobank
export const validateBillEcobank = async (req, res) => {
    const { billerCode, productCode, customerId, amount } = req.body;

    if (!billerCode || !productCode || !customerId) {
        logger.warn('Missing required fields', { billerCode, productCode, customerId });
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: billerCode, productCode, or customerId',
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
            return res.status(200).json({
                success: true,
                message: 'Bill payment validated successfully',
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

        logger.error('Bill payment validation failed', {
            error: error?.response?.data || error.message,
        });
        if (error.response?.header?.responsecode) {
            return res.status(400).json({
                success: false,
                message: error.response?.header?.responsemessage,
                code: error.response?.header?.responsecode,
            });
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
    // Billers that go through FDI
    const fdiBillers = ['tax', 'airtime', 'paytv', 'electricity'];
    // Billers that go through FDI
    const ecoBillers = ['RRA', 'RWANDA_WASAC', 'EUCL_ERW', 'IREMBOPAY', 'ELEC', 'STTV', 'RNIT', 'GTP-LOAD'];
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

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0
    let customer_charge = 0;
    let netAmount = findNetAmount(amount)
    if (billerCode.toLowerCase() === "RRA") {
        customer_charge = getBillerCharge(amount, billerCode);
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

            // Call ecobank service and return its result
            return await ecobankBillPayamentService(
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
            );
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
            let message = "Unable to process payment due to invalid request.";

            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                message = "Your transaction password is incorrect. Please try again.";
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                message = "Your transaction password has been blocked. Please contact support.";
            }

            return res.status(400).json({ success: false, message });
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

    let agent_name = "UnknownAgent";
    let userAuth = null;
    let agent_id = 0
    let customer_charge = 0;
    let netAmount = findNetAmount(amount)
    if (billerCode.toLowerCase() === "tax") {
        customer_charge = getBillerCharge(amount, billerCode);
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
            ? buildAirtimePayload({ amount, requestId, ccy, customerId, clientPhone })
            : billerCode.toLowerCase() === "electricity"
                ? buildElecticityPayload({ amount, requestId, ccy, customerId, clientPhone })
                : billerCode.toLowerCase() === "paytv"
                    ? buildStartimePayload({ amount, requestId, ccy, customerId, clientPhone })
                    : billerCode.toLowerCase() === "tax"
                        ? buildRRABillerPayload({ amount, requestId, ccy, customerId, clientPhone, netAmount })
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
            await insertLogs(
                response.data.id,            // transactionId
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
            //call third-party endpoint
            return await fdiBillPayamentService(req,
                res,
                response,
                amount,
                billerCode,
                requestId,
                customerId,
                agent_name,
                agent_id
            )


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
            let message = "Unable to process payment due to invalid request.";

            if (errorDetails === "INVALID_TRANSACTION_PASSWORD") {
                message = "Your transaction password is incorrect. Please try again.";
            } else if (errorDetails === "BLOCKED_TRANSACTION_PASSWORD") {
                message =
                    "Your transaction password has been blocked. Please contact support.";
            }

            return res.status(400).json({ success: false, message });
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

