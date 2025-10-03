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
        
        const id = response.data.id;
        const name = response.data.name;
        
        // Extract agent category and phone number from customValues
        const customValues = response.data.customValues || [];
        let agentCategory = null;
        let phoneNumber = null;

        customValues.forEach(field => {
            if (field.internalName === 'agent_category') {
                agentCategory = field.value;
            }
            if (field.internalName === 'Phone_User_ID') {
                phoneNumber = field.value;
            }
        });

        const { accessToken, refreshToken } = await generateTokens(token, id, name,username);

        logger.warn("Successfully logged in", { 
            userId: id, 
            name: name, 
            agentCategory, 
            phoneNumber 
        });

        return res.status(200).json({
            success: true,
            data: {
                id,
                name: response.data.name,
                email: response.data.email,
                category: agentCategory,
                phoneNumber,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        logger.error("Error during login:", {
            error: error.response?.data || error.message,
            username: username
        });
        
        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                message: error.response?.data?.errorDetails || "Invalid Credentials",
            });
        }

        if (error.response?.status === 401) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while processing login",
        });
    }
};

export { loginService };