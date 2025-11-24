import axios from "axios";
import logger from "../utils/logger.js";
import generateTokens from "../utils/generateToken.js";
import { createResponse, createErrorResponse } from "@moola/shared";
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

        return res.status(200).json(createResponse(true, 'authentication.login_success', {
            id,
            name: response.data.name,
            email: response.data.email,
            category: agentCategory,
            phoneNumber,
            accessToken,
            refreshToken
        }, req.language));
    } catch (error) {
        logger.error("Error during login:", {
            error: error.response?.data || error.message,
            username: username
        });
        
        if (error.response?.status === 400) {
            return res.status(400).json(createErrorResponse('authentication.invalid_credentials', req.language, 400));
        }

        if (error.response?.status === 401) {
            return res.status(401).json(createErrorResponse('authentication.invalid_credentials', req.language, 401));
        }

        return res.status(500).json(createErrorResponse('common.server_error', req.language, 500));
    }
};

export { loginService };