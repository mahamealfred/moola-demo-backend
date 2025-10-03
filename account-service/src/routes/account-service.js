import express from "express";
import { clientMomoTopUp, getAccountBalance, getAccountHistory, getAccountsBalance } from "../controllers/account-controller.js";
import { withdrawalCommission } from "../controllers/commission-controller.js";



const router = express.Router();


router.post("/client-topup", clientMomoTopUp);

router.get("/main/balance", getAccountBalance);
router.get("/all/accounts/info/balance", getAccountsBalance);
router.get("/main/account/history", getAccountHistory);

//commission routes will be added here later
router.post("/self-serve/withdrawals/commissions", withdrawalCommission);

export default router