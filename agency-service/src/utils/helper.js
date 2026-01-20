
import CryptoJS from 'crypto-js';
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { loadTariffs } from "../utils/loadTariffs.js";

dotenv.config()

export const  getBillerCharge=async(amount,billerCode)=> {
   const tariffs = await loadTariffs();
  const taxTariffs = tariffs.billPayment.filter(
    (t) => t.transaction_type.toLowerCase() === billerCode.toString()
  );

  const match = taxTariffs.find(
    (t) => amount >= t.range_from && amount <= t.range_to
  );

  // If tariff found, return it; otherwise use tax service pricing
  if (match) {
    return Number(match.customer_charges);
  }

  // Tax service customer charge tiers
  if (billerCode.toLowerCase() === 'tax') {
    if (amount >= 1 && amount <= 1000) {
      return 160;
    } else if (amount >= 1001 && amount <= 10000) {
      return 300;
    } else if (amount >= 10001 && amount <= 40000) {
      return 500;
    } else if (amount >= 40001 && amount <= 75000) {
      return 1000;
    } else if (amount >= 75001 && amount <= 150000) {
      return 1500;
    } else if (amount >= 150001 && amount <= 500000) {
      return 2000;
    } else if (amount >= 500001) {
      return 3000;
    }
  }

  return 0;
}
export const generateRequestId=() =>{
    let id = 'A';
    for (let i = 0; i < 15; i++) {
        id += Math.floor(Math.random() * 10); 
    }
    return id;
}

export const generateRequestToken=(AFFCODE,requestId,AGENT_CODE,SOURCE_CODE,sourceIp)=> {
     const requestTokenString = `${AFFCODE}${requestId}${AGENT_CODE}${SOURCE_CODE}${sourceIp}`;
     const requestToken = CryptoJS.SHA512(requestTokenString).toString();
  
  return requestToken;
}

export const findNetAmount =(amount)=> {
    if (amount >= 1 && amount <= 1000) {
      return parseFloat(amount) + 160;
    } else if (amount >= 1001 && amount <= 10000) {
      return parseFloat(amount)+300;
    } else if (amount >= 10001 && amount <= 40000) {
      return parseFloat(amount)+500;
    } else if (amount >= 40001 && amount <= 75000) {
      return parseFloat(amount)+1000;
    } else if (amount >= 75001 && amount <= 150000) {
      return parseFloat(amount)+1500;
    } else if (amount >= 150001 && amount <= 500000) {
      return parseFloat(amount)+2000;
    } else if (amount >= 500001) {
      return parseFloat(amount)+3000;
    } else {
      return 0;
    }
  };
export const generate20DigitToken=() =>{
  let token = '';
  for (let i = 0; i < 20; i++) {
    token += Math.floor(Math.random() * 10);
  }
  return token;
}

export const generateFDIAccessToken = async(req,res)=>{
    let data = JSON.stringify({
        "api_key": "fec6eb42-30e0-4868-ab6c-46dfa78718b4",
        "api_secret": "74a0dd2d-ee5c-4067-aa81-fb5eb8400102"
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sb-api.efashe.com/rw/v2/auth',
        headers: { 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
    const accesstoken=await  axios.request(config)
      .then((response) => {
        
        const token=JSON.stringify(response.data.data.accessToken)
        //console.log(JSON.stringify(response.data.data.accessToken));
        return token
       
      })
      .catch((error) => {
        return JSON.stringify({
            responseCodeCode:error.response.status,
            communicationStatus:"FAILED",
            error: error.message,
          });  
      });
      
      return  accesstoken
};

export const callPollEndpoint = async (responseData,trxId) => {
  const accessToken = await generateFDIAccessToken();
  //let URL=`https://sb-api.efashe.com/rw${responseData.data.data.pollEndpoint}`
  let URL = `https://sb-api.efashe.com/rw/v2/trx/${trxId}/status`
  
 
  try {
    const response = await axios.get(URL.replace(/\/$/, ''),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.replace(/['"]+/g, '')}`
        },
      }
      );
      if(response.status === 200)return response
    // console.log('Response from poll endpoint:', response.data);
    // Handle response as needed
  } catch (error) {
    console.error('Error calling poll endpoint:', error);
    // Handle error
  }
  return response
};

export const Chargeback = async (transferId) => {
    let URL =process.env.CYCLOS_URL+'/services/payment'
    let data = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://payments.webservices.cyclos.strohalm.nl/">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <pay:chargeback>\r\n         <!--Optional:-->\r\n         <transferId>${transferId}</transferId>\r\n      </pay:chargeback>\r\n   </soapenv:Body>\r\n</soapenv:Envelope>`;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: URL,
        headers: {
            'Content-Type': 'application/xml'
        },
        data: data
    };

   await axios.request(config)
        .then((response) => {
            //console.log("Chargeback",JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        })
};

export const billercategories = {
    "Travel": [
        {
            "billername": "Ethiopia Airline",
            "billercode": "ETLINE",
            "category": "Travel",
            "serialNo": 1
        }
    ],
    "Utilities": [
        {
            "billername": "Prepaid Electricity",
            "billercode": "electricity",
            "category": "Utilities",
            "serialNo": 1
        },
        {
            "billername": "EUCL repaid Electricity",
            "billercode": "EUCL_ERW",
            "category": "Utilities",
            "serialNo": 1
        },
        {
            "billername": "Startimes Paytv",
            "billercode": "paytv",
            "category": "Utilities",
            "serialNo": 2
        },
        {
            "billername": "PREPAID CARD LOADING",
            "billercode": "GTP-LOAD",
            "category": "Utilities",
            "serialNo": 3
        },
        {
            "billername": "RWANDA WATER WASAC",
            "billercode": "RWANDA_WASAC",
            "category": "Utilities",
            "serialNo": 4
        }
    ],
    "Government": [
        {
            "billername": "RWANDA REVENUE AUTHORITY",
            "billercode": "tax",
            "category": "Government",
            "serialNo": 1
        }
    ],
    "Donation": [
        {
            "billername": "Kigali Genocide Memorial",
            "billercode": "KGL",
            "category": "Donation",
            "serialNo": 1
        }
    ],
    "Schools": [
        {
            "billername": "Green Hills Academy",
            "billercode": "GHA",
            "category": "Schools",
            "serialNo": 1
        },
        {
            "billername": "Ecole Francophone Antoine De Saint Exupery Pr",
            "billercode": "FRANCOPM",
            "category": "Schools",
            "serialNo": 2
        },
        {
            "billername": "Ecole Francophone Antoine De Saint Exupery Sec",
            "billercode": "FRANCOSM",
            "category": "Schools",
            "serialNo": 3
        }
    ],
    "Investment": [
        {
            "billername": "Rwanda National Investment Trust Ltd",
            "billercode": "RNIT",
            "category": "Investment",
            "serialNo": 1
        }
    ],
    "Airtime": [
        {
            "billername": "MTN Airtime Topup",
            "billercode": "airtime",
            "category": "Airtime",
            "serialNo": 1
        },
        {
            "billername": "Airtel Airtime Topup",
            "billercode": "airtime",
            "category": "Airtime",
            "serialNo": 2
        }
    ]
};

/**
 * Decode JWT token
 * @param {string} token - JWT token to decode
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error.message);
    return null;
  }
};
