// config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config()
// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Database name
  process.env.DB_USER,     // MySQL username
  process.env.DB_PASS,     // MySQL password

  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Set to console.log if you want SQL queries in the terminal
  }
);

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;
