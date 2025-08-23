import express from "express";
import { getCustomerDetails, getEcoBankAccountBalance, validateIdentity } from "../controllers/account-controller.js";
import { executeBillerPayment, getBillerDetails, getBillers, getBillPaymentFee, postBillPayment, ValidateBillerFdi, validateBillPayment } from "../controllers/payment-controller.js";
import { openAccount } from "../controllers/banking-controller.js";




const router = express.Router();

//Account Routes
router.get("/eco/services/getbalance",getEcoBankAccountBalance);
router.post("/eco/services/validateidentity",validateIdentity);
router.post("/eco/services/getcustomerdetails",getCustomerDetails);
router.post("/eco/services/account-openning",openAccount);


//Bill validation and pyment routes
router.post("/thirdpartyagency/services/validate/biller",ValidateBillerFdi);
router.post("/thirdpartyagency/services/execute/bill-payment",executeBillerPayment);

router.post("/eco/services/validate/biller",validateBillPayment);
router.post("/eco/services/biller-details",getBillerDetails);
router.get("/eco/services/agent-billers",getBillers);
router.post("/eco/services/bill-payment-fee",getBillPaymentFee);
router.post("/eco/services/execute-bill-payment",postBillPayment);



export default router