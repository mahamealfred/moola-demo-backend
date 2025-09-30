import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import { xml2js } from "xml2js";
import trustAccountToAgentFloat from "../service/trustAccountToAgentFloat.js";

// Self serve commission
export const withdrawalCommission = async (req, res) => {
    logger.info("Self Serve Commission endpoint hit...");
    
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        
        const userTokenDetails = await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                logger.warn("Invalid token!");
                return res.status(401).json({
                    message: "Invalid token!",
                    success: false,
                });
            }
            return user;
        });

        const { amount } = req.body;
        const agent_name = userTokenDetails.username; // Adjust based on your token structure

        const url = process.env.CYCLOS_URL + '/services/payment';
        const soapRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://payments.webservices.cyclos.strohalm.nl/">
                <soapenv:Header/>
                <soapenv:Body>
                    <pay:doPayment>
                        <!--Optional:-->
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
            </soapenv:Envelope>
        `;

        const headers = {
            'Content-Type': 'text/xml',
            'SOAPAction': ''
        };

        logger.info(`Making SOAP request for agent: ${agent_name}, amount: ${amount}`);
        const response = await axios.post(url, soapRequest, { headers });

        try {
            const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
            logger.debug("SOAP response received and parsed successfully");

            if (result && result["soap:Envelope"]["soap:Body"]['ns2:doPaymentResponse'].return.status === "PROCESSED") {
                logger.info(`Payment processed successfully for agent: ${agent_name}`);
                await trustAccountToAgentFloat(req, res, agent_name, amount);
            } else if (result && result["soap:Envelope"]["soap:Body"]['ns2:doPaymentResponse'].return.status === "INVALID_PARAMETERS") {
                logger.warn(`Invalid parameters in SOAP response for agent: ${agent_name}`);
                return res.status(400).json({
                    message: "Something went wrong. Please get in touch with DDIN support!",
                    success: false,
                });
            } else {
                logger.warn(`Unexpected SOAP response status for agent: ${agent_name}`);
                return res.status(400).json({
                    message: "Transaction failed. Please try again later.",
                    success: false,
                });
            }

        } catch (parseError) {
            logger.error("Error parsing SOAP response", parseError);
            return res.status(500).json({
                message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
                success: false,
            });
        }

    } catch (error) {
        logger.error("Self Serve Commission error occurred", error);
        
        if (error.response) {
            logger.error(`SOAP API error: ${error.response.status} - ${error.response.data}`);
            return res.status(500).json({
                message: "Service temporarily unavailable. Please try again later.",
                success: false,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

