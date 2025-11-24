//Airtime
export const buildAirtimePayload = ({ amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({
  amount,
  toMemberId: '18',
  transferTypeId: '66',
  currencySymbol: ccy,
  description: 'Airtime Purchase',
  customValues: [
    {
      internalName: "trans_id",
      fieldId: "85",
      value: requestId
    },
    {
      internalName: "net_amount",
      fieldId: "87",
      value: amount
    },
    {
      internalName: "clientphone",
      fieldId: "90",
      value: customerId
    },

  ],
});
//Electricity
export const buildElecticityPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({

  toMemberId: "18",
  amount: amount,
  transferTypeId: "70",
  currencySymbol: ccy,
  description: "Electricity Payment",
  customValues: [
    {
      internalName: "meterNumber",
      fieldId: "86",
      value: customerId
    },
    {
      internalName: "trans_id",
      fieldId: "85",
      value: requestId
    },
    {
      internalName: "net_amount",
      fieldId: "87",
      value: amount
    },
    {
      internalName: "clientphone",
      fieldId: "90",
      value: clientPhone
    }

  ]
});

//Startime
export const buildStartimePayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({

  toMemberId: "18",
  amount: amount,
  transferTypeId: "74",
  currencySymbol: "Rwf",
  description: "Startimes Subscription",
  customValues: [{
    internalName: "trans_id",
    fieldId: "85",
    value: requestId
  },
  {
    internalName: "net_amount",
    fieldId: "87",
    value: amount
  },
  {
    internalName: "clientphone",
    fieldId: "90",
    value: clientPhone
  }

  ]

});

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
  netAmount
}) => ({

  toMemberId: "18",
  amount: amount,
  transferTypeId: "82",
  currencySymbol: ccy,
  description: "RRA Payment",
  customValues: [
    {
      internalName: "tax_identification_number",
      fieldId: "82",
      value: customerId
    },
    {
      internalName: "tax_document_id",
      fieldId: "84",
      value: customerId
    },
    {
      internalName: "taxpayer",
      fieldId: "89",
      value: clientPhone
    },
    {
      internalName: "trans_id",
      fieldId: "118",
      value: requestId
    },
    {
      internalName: "net_amount",
      fieldId: "119",
      value: netAmount
    }
  ]
});

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
}) => ({
  amount,
  toMemberId: '56', // Can vary by biller
  transferTypeId: '78', // Can vary by biller
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
});
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
  clientPhone
}) => ({
    toMemberId: "142",
    amount: amount,
    transferTypeId: "125",
    currencySymbol: "Rwf",
    description: "Agency Banking Electricity Payment",
    customValues: [
    {
    internalName : "meterNumber",
    fieldId : "117",
    value : customerId
    },
     {
    internalName : "trans_id",
    fieldId : "118",
    value : requestId
    },
             {
    internalName : "net_amount",
    fieldId : "119",
    value : amount
    }
    ]
});

  //Wasac
export const buildEcobankWasacPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({
    toMemberId: "142",
    amount: amount,
    transferTypeId: "129",
    currencySymbol: "Rwf",
    description: "Agency Banking Water Payment",
    customValues: [
    {
    internalName : "meterNumber",
    fieldId : "117",
    value : customerId
    },

        {
    internalName : "trans_id",
    fieldId : "118",
    value : requestId
        },
             {
    internalName : "net_amount",
    fieldId : "119",
    value : amount
             }
    ]
});

//Startime
export const buildEcobankStartimePayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({
    toMemberId: "142",
    amount: amount,
    transferTypeId: "127",
    currencySymbol: "Rwf",
    description: "Agency Banking Startimes Subcription",
    customValues: [
     {
    internalName : "trans_id",
    fieldId : "118",
    value : requestId
    },
             {
    internalName : "net_amount",
    fieldId : "119",
    value : amount
    }
    ]
});


//ECOBANK IREMBO PAY
export const buildEcobankIremboPayPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({
    toMemberId: "142",
    amount: amount,
    transferTypeId: "130",
    currencySymbol: "Rwf",
    description: "Agency Banking IREMBO Payment",
    customValues: [
    {
    internalName : "bill_id",
    fieldId : "117",
    value : customerId
    },

        {
    internalName : "trans_id",
    fieldId : "118",
    value :requestId
        },
             {
    internalName : "net_amount",
    fieldId : "119",
    value : amount
             }
    ]
});

//ECOBANK RNIT PAY
export const buildEcobankRNITPayPayload = ({
  amount,
  requestId,
  ccy,
  customerId,
  clientPhone
}) => ({
    toMemberId: "142",
    amount: amount,
    transferTypeId: "127",
    currencySymbol: "Rwf",
    description: "Agency Banking RNIT Payment",
    customValues: [
{
    internalName : "client_firstname",
    fieldId : "104",
    value : "Kwizera"
    },
        {
    internalName : "client_lastname",
    fieldId : "105",
    value : "Remy"
        },
        {
    internalName : "phone_number",
    fieldId : "107",
    value : "0785253102"
        },
        {
    internalName : "national_id_number",
    fieldId : "108",
    value : customerId
        },
        {
    internalName : "trans_id",
    fieldId : "118",
    value : requestId
    },
             {
    internalName : "net_amount",
    fieldId : "119",
    value : amount
    }
    ]
});



