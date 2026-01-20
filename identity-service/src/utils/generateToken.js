import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";
//import RefreshToken from "../models/RefreshToken.js";

const generateTokens = async (token,id,name,username,agentCategory) => {
  const accessToken = jwt.sign(
    {
      userAuth:token,
      id:id,
      name:name,
      username:username,
      agentCategory
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires in 7 days

  await RefreshToken.create({
    token: refreshToken,
    userId: id,
    name,
    username,
    agentCategory,
    userAuth:token,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

/**
 * Decode JWT token
 * @param {string} token - JWT token to decode
 * @returns {object|null} - Decoded token payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error.message);
    return null;
  }
};

export { generateTokens as default, decodeToken }