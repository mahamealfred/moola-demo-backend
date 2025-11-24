import express from "express";
import { getCustomerDetails, getEcoBankAccountBalance, validateExpressCashToken, validateIdentity } from "../controllers/account-controller.js";
import { executeBillerPayment, executeBillPaymentEcoBank, getAllAgentTransactions, getBillerDetails, getBillerList, getBillers, getBillPaymentFee, getTransactionsById,  validateBillEcobank, validateBiller } from "../controllers/payment-controller.js";
import { executeEcoCashIn, executeEcoCashOut, executeEcoCashOutExpressCashToken, openAccount } from "../controllers/banking-controller.js";
import { loadTariffs } from "../utils/loadTariffs.js";
import {  ddinPindoBulkSmsPaymentForCorporate, ddinPindoSingleSmsPaymentForCorporate } from "../controllers/smsController.js";
import {  selectBrokerTransactions } from "../controllers/logsController.js";
import { advancedTransactionLimiter } from "../middleware/advancedTransactionLimiter.js";



const router = express.Router();

//Account Routes
router.get("/thirdpartyagency/services/getbalance",getEcoBankAccountBalance);
router.post("/thirdpartyagency/services/validateidentity",validateIdentity);
router.post("/thirdpartyagency/services/getcustomerdetails",getCustomerDetails);

router.post("/thirdpartyagency/services/validate/cash-token",validateExpressCashToken);
//banking
router.post("/thirdpartyagency/services/account-openning",openAccount);
router.post("/thirdpartyagency/services/execute/cash-in",executeEcoCashIn);
router.post("/thirdpartyagency/services/execute/withdraw",executeEcoCashOut);
router.post("/thirdpartyagency/services/execute/redeemtoken",executeEcoCashOutExpressCashToken);

//Bill validation and pyment routes
router.post("/thirdpartyagency/services/validate/biller",validateBiller);
router.post("/thirdpartyagency/services/execute/bill-payment",advancedTransactionLimiter() ,executeBillerPayment);
//Bulk -sms
router.post("/thirdpartyagency/services/execute/bulk-sms",ddinPindoBulkSmsPaymentForCorporate);
router.post("/thirdpartyagency/services/execute/single-sms",ddinPindoSingleSmsPaymentForCorporate);

router.post("/eco/services/validate/biller",validateBillEcobank);
router.post("/eco/services/biller-details",getBillerDetails);
router.get("/eco/services/agent-billers",getBillers);
router.post("/eco/services/bill-payment-fee",getBillPaymentFee);
router.post("/eco/services/execute-bill-payment",executeBillPaymentEcoBank);


//Get billers 
router.get("/thirdpartyagency/services/billers/details",getBillerList);


//get transactions details
router.get("/thirdpartyagency/services/transaction/details/:id",getTransactionsById);
router.get("/thirdpartyagency/services/transactions/history",getAllAgentTransactions);

router.get("/thirdpartyagency/services/transactions/history/:brokerId/broker", async (req, res) => {
  try {
    const brokerId = req.params.brokerId; 
    console.log("Fetching transactions for brokerId:", brokerId);
    const data = await selectBrokerTransactions(brokerId);
  console.log("Transactions data:", data);
    if (!data.length) {
      return res.status(404).json({ success:false, message: "No transactions found." });
    }

    res.status(200).json({
      success:true,
      message:"Transactions fetched successfully",
      data});
  } catch (error) {
    console.error("Error in transactions API:", error.message);
    res.status(500).json({success:false, error: "Internal server error" });
  }
});
router.get("/thirdpartyagency/services/tariffs", (req, res) => {
  res.json({
    success:true,
    data:tariffs
  });
});

// Specific endpoint
router.get("/thirdpartyagency/services/tariffs/bill",async (req, res) => {
  const { type } = req.query;
   const tariffs = await loadTariffs();

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