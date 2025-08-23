
import CryptoJS from 'crypto-js';
import axios from "axios";

import tariffs from "./tariffs.json" assert { type: "json" }; 

export const  getBillerCharge=(amount,billerCode)=> {
  const taxTariffs = tariffs.billPayment.filter(
    (t) => t.transaction_type.toLowerCase() === billerCode.toString()
  );

  const match = taxTariffs.find(
    (t) => amount >= t.range_from && amount <= t.range_to
  );

  return match ? Number(match.customer_charges) : 0;
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
