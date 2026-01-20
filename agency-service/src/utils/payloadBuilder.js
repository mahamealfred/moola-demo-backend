//Airtime
export const buildAirtimePayload = ({ amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory
}) => {
    
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "106";
  let toMemberId = '34';
  if (agentCategory === 'Corporate') {
    transferTypeId = "83";
    toMemberId = '34';
  } else if (agentCategory === 'Client') {
    transferTypeId = "116";
    toMemberId = '34';
  }

  return {
    amount,
    toMemberId: toMemberId,
    transferTypeId: transferTypeId,
    currencySymbol: ccy,
    description: 'Airtime Purchase',
    customValues: [
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      },
      
    ],
  };
};
//Electricity
export const buildElecticityPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "128";
  let toMemberId = "34";
  if (agentCategory === 'Corporate') {
    transferTypeId = "81";
    toMemberId = "34";
  } else if (agentCategory === 'Client') {
    transferTypeId = "117";
    toMemberId = "34";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: ccy,
    description: "Electricity Payment",
    customValues: [
      {
        internalName: "meterNumber",
        fieldId: "117",
        value: customerId
      },
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};

//Startime
export const buildStartimePayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory 
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "53";
  let toMemberId = "34";
  if (agentCategory === 'Corporate') {
    transferTypeId = "79";
    toMemberId = "34";
  } else if (agentCategory === 'Client') {
    transferTypeId = "118";
    toMemberId = "34";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Startimes Subscription",
    
  };
};

//Startime
export const buildBulkSMSPindoPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({

  toMemberId: "3",
  amount: amount,
  transferTypeId: "31",
  currencySymbol: "Rwf",
  description: "Bulk SMS"

});


//RRA
export const buildRRABillerPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  billerCode,
  netAmount,
  agentCategory 
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "85";
  let toMemberId = "34";
  if (agentCategory === 'Corporate') {
    transferTypeId = "86";
    toMemberId = "34";
  } else if (agentCategory === 'Client') {
    transferTypeId = "119";
    toMemberId = "34";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: ccy,
    description: "RRA Payment",
    customValues: [
    {
    internalName : "tax_identification_number",
    fieldId : "82",
    value : requestId
    },
        {
    internalName : "validation_id",
    fieldId : "83",
    value : customerId
        },
        {
    internalName : "tax_document_id",
    fieldId : "84",
    value : customerId
        },
        {
    internalName : "tax_center",
    fieldId : "85",
    value : "Kigali"
        },
        {
    internalName : "declaration_date",
    fieldId : "86",
    value : "2024-02-09"
        },
        {
    internalName : "full_payment_status",
    fieldId : "87",
    value : "Successful"
        },
        {
    internalName : "tax_type",
    fieldId : "88",
    value : "Cleaning Fee"
        },
        {
    internalName : "taxpayer",
    fieldId : "89",
    value : customerId
        },
        {
    internalName : "createdat",
    fieldId : "90",
    value : "2024-02-09"
        },
        {
    internalName : "updatedat",
    fieldId : "91",
    value : "2024-02-09"
        },
        {
    internalName : "receiptNo",
    fieldId : "92",
    value : requestId
        },
         {
    internalName : "clientphone",
    fieldId : "121",
    value : clientPhone
        }
    ]
  };
};

//Ecobank Cash In
export const buildEcoCashInPayload = ({
 amount,
    sendername,
    senderphone,
    senderaccount,
    narration,
    ccy,
    description
}) => ({
  toMemberId: "142",
  amount: amount,
  transferTypeId: "121",
  currencySymbol: ccy,
  description: description
});

//Ecobank Cash Out

export const buildEcoCashOutPayload = ({
   amount,
    sendername,
    senderphone,
    senderaccount,
    ccy,
    subagentcode
}) => ({
  toMemberId: subagentcode,
  amount: amount,
  transferTypeId: "122",
  currencySymbol: ccy,
  description: "Agency Banking Client Account Withdrawal"
});

//Generic
export const buildGenericBillerPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  billerCode,
  agentCategory 
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "78";
  let toMemberId = '56';
  if (agentCategory === 'corporate') {
    transferTypeId = "79";
    toMemberId = '57';
  } else if (agentCategory === 'client') {
    transferTypeId = "80";
    toMemberId = '58';
  }

  return {
    amount,
    toMemberId: toMemberId,
    transferTypeId: transferTypeId,
    currencySymbol: ccy,
    description: `${billerCode.toUpperCase()} Payment`,
    customValues: [
      {
        internalName: 'trans_id',
        fieldId: '118',
        value: requestId,
      },
      {
        internalName: 'bill_account',
        fieldId: '120',
        value: customerId,
      },
      {
        internalName: 'phone_number',
        fieldId: '121',
        value: clientPhone,
      },
    ],
  };
};
//Bulk sms 

export const buildBulkSmsBillerPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  billerCode,
  description
}) => ({
 toMemberId: "35",
  amount: amount,
transferTypeId: "51",
  currencySymbol: ccy,
description: description
});
//Agency Banking Ecobank
export const agencyBankingDepositPayLoad =({
 amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  billerCode,
  description
})=>(
  {
    toMemberId: "142",
    amount: amount,
    transferTypeId: "121",
    currencySymbol: ccy,
    description: description
}
)
export const agencyBankingWithdrawPayLoad =({
 amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  billerCode,
  description
})=>(
  {
    toMemberId: "142",
    amount: amount,
    transferTypeId: "121",
    currencySymbol: ccy,
    description: description
}
)

//RRA Ecobank
export const buildRRAEcobankBillerPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  netAmount
}) => ({
    toMemberId: "34",
    amount: amount,
    transferTypeId: "85",
    currencySymbol: "Rwf",
    description: "RRA Tax Payment",
    customValues: [
    {
    internalName : "tax_identification_number",
    fieldId : "82",
    value : "11986801789765"
    },
        {
    internalName : "validation_id",
    fieldId : "83",
    value : "12345"
        },
        {
    internalName : "tax_document_id",
    fieldId : "84",
    value: customerId
        },
        {
    internalName : "tax_center",
    fieldId : "85",
    value : "Kigali"
        },
        {
    internalName : "declaration_date",
    fieldId : "86",
    value : "2024-02-09"
        },
        {
    internalName : "full_payment_status",
    fieldId : "87",
    value : "Successful"
        },
        {
    internalName : "tax_type",
    fieldId : "88",
    value : "Cleaning Fee"
        },
        {
    internalName : "taxpayer",
    fieldId : "89",
    value : "Remy KWIZERA"
        },
        {
    internalName : "createdat",
    fieldId : "90",
    value : "2024-02-09"
        },
        {
    internalName : "updatedat",
    fieldId : "91",
    value : "2024-02-09"
        },
        {
    internalName : "receiptNo",
    fieldId : "92",
    value : "DDIN123456789"
        },
         {
    internalName : "clientphone",
    fieldId : "121",
    value : "0785644568"
        }
    ]
});

  //Electricity
export const buildEcobankElecticityPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "125";
  let toMemberId = "142";
  if (agentCategory === 'corporate') {
    transferTypeId = "126";
    toMemberId = "143";
  } else if (agentCategory === 'client') {
    transferTypeId = "126";
    toMemberId = "144";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Agency Banking Electricity Payment",
    customValues: [
      {
        internalName: "meterNumber",
        fieldId: "117",
        value: customerId
      },
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};

  //Wasac
export const buildEcobankWasacPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory = 'agent'
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "129";
  let toMemberId = "142";
  if (agentCategory === 'corporate') {
    transferTypeId = "130";
    toMemberId = "143";
  } else if (agentCategory === 'client') {
    transferTypeId = "130";
    toMemberId = "144";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Agency Banking Water Payment",
    customValues: [
      {
        internalName: "meterNumber",
        fieldId: "117",
        value: customerId
      },
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};

//Startime
export const buildEcobankStartimePayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "127";
  let toMemberId = "142";
  if (agentCategory === 'corporate') {
    transferTypeId = "128";
    toMemberId = "143";
  } else if (agentCategory === 'client') {
    transferTypeId = "128";
    toMemberId = "144";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Agency Banking Startimes Subcription",
    customValues: [
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};


//ECOBANK IREMBO PAY
export const buildEcobankIremboPayPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory 
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "130";
  let toMemberId = "142";
  if (agentCategory === 'corporate') {
    transferTypeId = "131";
    toMemberId = "143";
  } else if (agentCategory === 'client') {
    transferTypeId = "131";
    toMemberId = "144";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Agency Banking IREMBO Payment",
    customValues: [
      {
        internalName: "bill_id",
        fieldId: "117",
        value: customerId
      },
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};

//ECOBANK RNIT PAY
export const buildEcobankRNITPayPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone,
  agentCategory = 'agent'
}) => {
  // Determine transfer type ID and member ID based on agent category
  let transferTypeId = "127";
  let toMemberId = "142";
  if (agentCategory === 'corporate') {
    transferTypeId = "128";
    toMemberId = "143";
  } else if (agentCategory === 'client') {
    transferTypeId = "128";
    toMemberId = "144";
  }

  return {
    toMemberId: toMemberId,
    amount: amount,
    transferTypeId: transferTypeId,
    currencySymbol: "Rwf",
    description: "Agency Banking RNIT Payment",
    customValues: [
      {
        internalName: "client_firstname",
        fieldId: "104",
        value: "Kwizera"
      },
      {
        internalName: "client_lastname",
        fieldId: "105",
        value: "Remy"
      },
      {
        internalName: "phone_number",
        fieldId: "107",
        value: "0785253102"
      },
      {
        internalName: "national_id_number",
        fieldId: "108",
        value: customerId
      },
      {
        internalName: "trans_id",
        fieldId: "118",
        value: requestId
      },
      {
        internalName: "net_amount",
        fieldId: "119",
        value: amount
      }
    ]
  };
};



