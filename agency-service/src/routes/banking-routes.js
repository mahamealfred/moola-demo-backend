import express from "express";
import { getCustomerDetails, getEcoBankAccountBalance, validateIdentity } from "../controllers/account-controller.js";
import { executeBillerPayment, executeBillPaymentEcoBank, getAllAgentTransactions, getBillerDetails, getBillerList, getBillers, getBillPaymentFee, getTransactionsById,  validateBillEcobank, validateBiller } from "../controllers/payment-controller.js";
import { executeEcoCashIn, executeEcoCashOut, openAccount } from "../controllers/banking-controller.js";
import tariffs from "../utils/tariffs.json" assert { type: "json" };



const router = express.Router();

//Account Routes
router.get("/thirdpartyagency/services/getbalance",getEcoBankAccountBalance);
router.post("/thirdpartyagency/services/validateidentity",validateIdentity);
router.post("/thirdpartyagency/services/getcustomerdetails",getCustomerDetails);
//banking
router.post("/thirdpartyagency/services/account-openning",openAccount);
router.post("/thirdpartyagency/services/execute/cash-in",executeEcoCashIn);
router.post("/thirdpartyagency/services/execute/withdraw",executeEcoCashOut);

//Bill validation and pyment routes
router.post("/thirdpartyagency/services/validate/biller",validateBiller);
router.post("/thirdpartyagency/services/execute/bill-payment",executeBillerPayment);

router.post("/eco/services/validate/biller",validateBillEcobank);
router.post("/eco/services/biller-details",getBillerDetails);
router.get("/eco/services/agent-billers",getBillers);
router.post("/eco/services/bill-payment-fee",getBillPaymentFee);
router.post("/eco/services/execute-bill-payment",executeBillPaymentEcoBank);


//Get billers 
router.get("/thirdpartyagency/services/billers/details",getBillerList);
//Bulk -sms
//router.post("/thirdpartyagency/services/execute/bulk-sms",bulkSmsPayment);

//get transactions details
router.get("/thirdpartyagency/services/transaction/details/:id",getTransactionsById);
router.get("/thirdpartyagency/services/transactions/history",getAllAgentTransactions);

router.get("/thirdpartyagency/services/tariffs", (req, res) => {
  res.json({
    success:true,
    data:tariffs
  });
});

// Specific endpoint
router.get("/thirdpartyagency/services/tariffs/bill", (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Missing required query parameter: type"
    });
  }

  const matchingTariffs = tariffs.billPayment.filter(t => {
    return t.transaction_type && t.transaction_type.toLowerCase() === type.toLowerCase();
  });

  if (matchingTariffs.length > 0) {
    res.json({
      success: true,
      data: matchingTariffs
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Tariff type not found"
    });
  }
});
//Rapid transafer
router.get("/thirdpartyagency/services/tariffs/rapidtransfer", (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Missing required query parameter: type"
    });
  }

  const matchingTariffs = tariffs.rapidTransferSendTariffs.filter(t => {
    return t.transaction_type && t.transaction_type.toLowerCase() === type.toLowerCase();
  });

  if (matchingTariffs.length > 0) {
    res.json({
      success: true,
      data: matchingTariffs
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Tariff type not found"
    });
  }
});



export default router