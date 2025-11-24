import axios from "axios";
import xml2js  from 'xml2js';

import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { createResponse, createErrorResponse } from "@moola/shared";
dotenv.config();

const trustAccountToAgentFloat = async (req, res, agent_name, amount) => {
    logger.info(`Trust Account to Agent Float transfer for agent: ${agent_name}, amount: ${amount}`);
    
    const url = process.env.CYCLOS_URL + '/services/payment';
    const soapRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://payments.webservices.cyclos.strohalm.nl/">
    <soapenv:Header/>
    <soapenv:Body>
       <pay:doPayment>
          <!--Optional:-->
          <params>
             <fromSystem>true</fromSystem>  
             <toMemberPrincipalType>USER</toMemberPrincipalType>
             <toMember>${agent_name}</toMember>
             <amount>${amount}</amount>
             <description>Agent Commission Payment</description>
             <transferTypeId>101</transferTypeId>        
          </params>
       </pay:doPayment>
    </soapenv:Body>
 </soapenv:Envelope>
    `;
    
    const headers = {
        'Content-Type': 'text/xml',
        'SOAPAction': ''
    };
    
    try {
        const response = await axios.post(url, soapRequest, { headers });
        
        try {
            const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
            logger.info(`Successfully transferred amount to agent float account for: ${agent_name}`);
            
            if (result) {
                return res.status(200).json(createResponse(true, 'banking.commission_request_processed', result, req.language));
            }
            
        } catch (parseError) {
            logger.error("Error parsing SOAP response in trustAccountToAgentFloat", parseError);
            return res.status(500).json(createErrorResponse('banking.transfer_to_agent_float_failed', req.language, 500));
        }
    } catch (error) {
        logger.error("Error making request in trustAccountToAgentFloat", error);
        return res.status(500).json(createErrorResponse('banking.transfer_to_agent_float_failed', req.language, 500));
    }
};

export default trustAccountToAgentFloat;