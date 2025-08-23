import axios from "axios";
import logger from "../utils/logger.js";
import generateTokens from "../utils/generateToken.js";
import { validateAgentRegistration, validatelogin, validateRegistration } from "../utils/validation.js";
import { agentRegistrationService, clientRegistrationService} from "../services/register-service.js";
import { loginService } from "../services/login-service.js";
import RefreshToken from "../models/RefreshToken.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()


//user registration
const resgiterUser = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        //validate the schema
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password, username, firstName, lastName, identity, phoneNumber } = req.body;

        await clientRegistrationService(req, res, email, password, username, firstName, lastName, identity, phoneNumber)


    } catch (e) {
        logger.error("Registration error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//user registration
const registerAgent = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        //validate the schema
        const { error } = validateAgentRegistration(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email,password,username,firstName,lastName,phoneNumber,area,district,sector,cell,agentCategory } = req.body;

        await agentRegistrationService(req,res,email,password,username,firstName,lastName,phoneNumber,area,district,sector,cell,agentCategory)


    } catch (e) {
        logger.error("Registration error occured:", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//Client login
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { username, password } = req.body;
        await loginService(req, res, username, password)

    } catch (e) {
        logger.error("Login error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



//Agent login
const agentLogin = async (req, res) => {
    logger.info("Agent Login endpoint hit...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { username, password } = req.body;
        await loginService(req, res, username, password)

    } catch (e) {
        logger.error("Agent Login error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
//Search User
const findUser = async (req, res) => {
    logger.info("FindUser endpoint hit...");
 const username = "topupuser";
        const password = "Topup@123"
        const topupUserAuth = Buffer.from(`${username}:${password}`).toString('base64');
    try {
        const userName = req.params.user

        const response = await axios.get(process.env.CYCLOS_URL+`rest/members/principal/${userName}`, {
            headers: {
                Authorization: `Basic ${topupUserAuth}`,
                'Content-Type': 'application/json',
            },
        });

        logger.warn("Successfully logged");
        return res.status(200).json({
            success: true,
            message:"User details",
            data: response.data

        });
    } catch (error) {

        logger.error("Error while saving in Cyclos:");
        if (error.response.status === 400) {
            return res.status(400).json({
                success: false,
                message: error.response?.data.errorDetails || "Invalid Credentials",
            });
        }
        if (error.response.status === 401) {
            return res.status(400).json({
                success: false,
                message: error.response?.data.errorDetails || "Invalid Credentials",
            });
        }
        if (error.response.status === 404) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while processing",
        });
    }
};

// refresh token
const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint hit...");
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        // Sequelize findOne
        const storedToken = await RefreshToken.findOne({
            where: { token: refreshToken },
        });


        if (!storedToken) {
            logger.warn("Invalid refresh token provided");
            return res.status(400).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        if (storedToken.expiresAt < new Date()) {
            logger.warn("Expired refresh token");
            return res.status(401).json({
                success: false,
                message: "Expired refresh token",
            });
        }

        // Verify the token (use storedToken.token, not the whole object)
        // const decodedToken = await new Promise((resolve, reject) =>
        //     jwt.verify(storedToken.token, process.env.JWT_SECRET, (err, user) =>
        //         err ? reject(err) : resolve(user)
        //     )
        // );
      const token=storedToken.userAuth
      const id=storedToken.userId

        // Generate new tokens
        const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        } = await generateTokens(
         token,id
        
        );

        // Delete the old refresh token
        await RefreshToken.destroy({
            where: { id: storedToken.id },
        });

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (e) {
        console.log("errorrr:",e)
      //  logger.error("Refresh token error occurred", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


//logout

const logoutUser = async (req, res) => {
    logger.info("Logout endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        const storedToken = await RefreshToken.findOneAndDelete({
            token: refreshToken,
        });
        if (!storedToken) {
            logger.warn("Invalid refresh token provided");
            return res.status(400).json({
                success: false,
                message: "Invalid refresh token",
            });
        }
        logger.info("Refresh token deleted for logout");

        res.json({
            success: true,
            message: "Logged out successfully!",
        });
    } catch (e) {
        logger.error("Error while logging out", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export { resgiterUser, loginUser, refreshTokenUser, logoutUser, findUser,registerAgent }