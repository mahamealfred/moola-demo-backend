import axios from "axios";
import logger from "../utils/logger.js";
import generateTokens from "../utils/generateToken.js";
import dotenv from "dotenv";
dotenv.config()

const loginService = async (req, res, username, password) => {
    const token = Buffer.from(`${username}:${password}`).toString('base64');


    try {
        const response = await axios.get(process.env.CYCLOS_URL+'/rest/members/me', {
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json',
            },
        });
        const id=response.data.id
        const name=response.data.name
        const { accessToken, refreshToken } = await generateTokens(token,id,name);


        logger.warn("Successfully logged");
        return res.status(200).json({
            success: true,
            data:{
            id,
            name:response.data.name,
            email:response.data.email,
            accessToken,
            refreshToken
            }
          

        });
    } catch (error) {
        console.log("eeoeo:",error)
        logger.error("Error while saving in Cyclos:");
        if (error.response.status === 400) {
            return res.status(400).json({
                success: false,
                message: error.response?.data.errorDetails || "Invalid Credentials",
            });
        }

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while processing",
        });
    }

};

export { loginService };