// models/TransactionStatus.js
import { DataTypes } from "sequelize";
import sequelize from "../db/config.js";


const TransactionStatus = sequelize.define(
  "TransactionStatus",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    thirdpart_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    service_name: {
      type: DataTypes.STRING(25),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
      customer_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
        agent_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    agent_name: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    transaction_reference: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "transactions_status",
    timestamps: false,
  }
);

export default TransactionStatus;
