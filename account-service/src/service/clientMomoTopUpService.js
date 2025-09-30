import axios from "axios";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const clientMomoTopUpService = async (req, res, amount, currencySymbol, tokenId) => {
  try {
    const response = await axios.post(
     process.env.CYCLOS_URL+"/rest/payments/confirmMemberPayment",
      {
        toMemberId: "136",
        amount: amount,
        transferTypeId: "114",
        currencySymbol: currencySymbol,
        description: "Mobile Money Top Up"
      },
      {
        headers: {
          Authorization: `Basic ${tokenId}`,
          "Content-Type": "application/json"
        }
      }
    );

    logger.warn("Successfully TopUp Client Account");
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.log("error:", error);
    logger.error("Error while saving in Cyclos:");

    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.response?.data?.errorDetails || "Invalid Credentials"
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing"
    });
  }
};

export { clientMomoTopUpService };
