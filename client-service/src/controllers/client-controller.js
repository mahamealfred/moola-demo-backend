
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { generateAccessToken, generateMomoToken } from "../utils/generator.js";
import { uuid } from "uuidv4";
import axios from "axios";
import { callPollEndpoint } from "../utils/checkMomoTransactionStatus.js";
import { clientMomoTopup } from "../service/momoPullToCyclos.js";
import { airtimePaymentService } from "../service/airtimePayment.js";
import { createResponse, createErrorResponse } from '@moola/shared';
import { mockMomoTransaction, isMockMode } from '@moola/shared/mock-payment-service';

dotenv.config()
//user topup
const momoClientPull = async (req, res) => {
    logger.info("Client Momo Pull endpoint hit...");
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        
        // Check if mock mode is enabled
        if (isMockMode()) {
            logger.info("[MOCK MODE] Processing MoMo transaction with mock data");
            return await mockMomoTransaction(req, res);
        }

        const userTokenDeatails = await jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                logger.warn("Invalid token!");
                return res.status(429).json({
                    message: "Invalid token!",
                    success: false,
                });
            }

            return user;

        });
        const username = "topupuser";
        const password = "Topup@123"
        const topupUserAuth = Buffer.from(`${username}:${password}`).toString('base64');
        const { amount, currencySymbol, phoneNumber,serviceType,trxId } = req.body;
        const userId = userTokenDeatails.id
        const userAuth=userTokenDeatails.userAuth

        const accessToken = await generateMomoToken(req, res);

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "A Token is required for authentication"
            });
        }

        logger.info("Initiating MoMo Pull request...");
    
        let data = JSON.stringify({
            "trxRef": trxId,
            "channelId": "momo-mtn-rw",
            "accountId": "e94b2d15-7617-41f9-84d2-b936ab592cce",
            "msisdn": phoneNumber,
            "amount": amount,
            "callback": "https://your-callback.example-app.com"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://payments-api.fdibiz.com/v2/momo/pull',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
            },
            data: data
        };

        await axios.request(config)
            .then(async (response) => {

                if (response.status === 202) {
                    // Start continuous polling
                    while (true) {
                        const responseData = await callPollEndpoint(response, trxId);
                        let thirdpart_status = responseData.data.data.trxStatus;
                        if (thirdpart_status === "successful") {
                          

                            //Cyclos to topup user float account
                            await clientMomoTopup(req, res, userId, topupUserAuth,userAuth, amount, currencySymbol,serviceType,trxId, phoneNumber)

                        } else if (thirdpart_status !== "pending") {
                            // Handle other non-pending statuses

                            return res.status(400).json({
                                success: false,
                                message: "Dear client, We're unable to complete your transaction right now. Please try again later"
                            });
                        }
                        // Delay before next polling attempt (e.g., 3 seconds)
                        await delay(3000); // Delay for 3 seconds
                    }
                }

            })
            .catch((error) => {

                res.status(500).json({
                    success: false,
                    message: error.response.data?.data.message || "Internal Server Error"
                })
            });



    } catch (e) {
        logger.error("Client Momo Pull error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};




export const validatedVendor = async (req, res) => {
    
    const accessToken = await generateAccessToken();
    const {customerAccountNumber,serviceType} = req.body

    if (!accessToken) {
      return res.status(401).json({
       success:false,
       message: "A Token is required for authentication"
      });
    }
    // console.log("accesst:",accessToken.replace(/['"]+/g, ''))
    let data = JSON.stringify({
      verticalId: serviceType,
      customerAccountNumber: customerAccountNumber
    }
    );
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://sb-api.efashe.com/rw/v2/vend/validate',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
      },
      data: data
    };

    try {
      const response = await axios.request(config)

      if (response.status === 200) {
        return res.status(200).json({
           success:true,
          message:"SUCCESS-DDIN Customer Details",
          data: {
            pdtId: response.data.data.pdtId,
            pdtName: response.data.data.pdtName,
            pdtStatusId: response.data.data.pdtStatusId,
            verticalId: response.data.data.verticalId,
            customerAccountNumber: response.data.data.customerAccountNumber,
            svcProviderName: response.data.data.svcProviderName,
            vendUnitId: response.data.data.vendUnitId,
            vendMin: response.data.data.vendMin,
            vendMax: response.data.data.vendMax,
            selectAmount: response.data.data.selectAmount,
            localStockMgt: response.data.data.localStockMgt,
            stockedPdts: response.data.data.stockedPdts,
            stock: response.data.data.stock,
            trxResult: response.data.data.trxResult,
            trxId: response.data.data.trxId,
            availTrxBalance: response.data.data.availTrxBalance
          }

        });
      }
      return res.status(500).json({
     success:false,
      message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
      });

    } catch (error) {
      if (error.response.status === 404) {
        return res.status(404).json({
        success:false,
        message: " Not Found"
        });
      }
      if (error.response.status === 422) {
        return res.status(422).json({
          success:false,
          message: error.response.data.msg
        });
      }
      if (error.response.status === 400) {
        return res.status(400).json({
          success:false,
          message: error.response.data.msg
        });
      }
      return res.status(500).json({
       success:false,
        message: "Dear client, we're unable to complete your transaction right now. Please try again later.",
      });
    }

};




const executeAirtimeyVendor = async (req,res,topupUserAuth,userAuth,amount,currencySymbol,serviceType,trxId, phoneNumber) => {
    logger.info("Execute Airtime endpoint hit...");

     
    let data = JSON.stringify({
      "toMemberId": "34",
      "amount": amount,
      "transferTypeId": "116",
      "currencySymbol": currencySymbol,
      "description": "Aritim Payment",
      "customValues":[{
      "internalName" : "trans_id",
      "fieldId" : "118",
      "value" : trxId
      },
      {
        "internalName" : "net_amount",
        "fieldId" : "119",
        "value" : amount
      }
    ]
      
  
    });
  
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://test.ddin.rw/coretest/rest/payments/confirmMemberPayment',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${userAuth}`
      },
      data: data
    };
  
    try {
       const response = await axios.request(config)
      if (response.status === 200){
       //call third part
      
     await airtimePaymentService(req, res, response, amount, trxId, phoneNumber)
    }
    }   catch (error) {
          logger.error("Execute Airtime error occured", error);
        if (error.response.status === 401) {
        return res.status(401).json({
          success:false,
          message: "Username and Password are required for authentication"
        });
      }
      if (error.response.status === 400) {
 
        return res.status(400).json({
           success:false,
           message:  "Invalid Username or Password"
        });
      }
      if (error.response.status === 404) {
        return res.status(404).json({
           success:false,
           message:  "Account Not Found"
        });
    }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
      }
};
// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export { momoClientPull,executeAirtimeyVendor  }