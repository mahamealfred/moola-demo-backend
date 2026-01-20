// models/refreshToken.js
import { DataTypes } from "sequelize";
import sequelize from "../db/config.js";


const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
     name: {
      type: DataTypes.STRING,
      allowNull: false
    },
     username: {
      type: DataTypes.STRING,
      allowNull: false
    },
     agentCategory: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userAuth: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["expiresAt"],
      },
    ],
  }
);

export default RefreshToken;
