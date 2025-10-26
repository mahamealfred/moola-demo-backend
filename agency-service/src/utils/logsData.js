// services/logService.js
import sequelize from "../db/config.js";
import TransactionStatus from "../models/TransactionStatus.js";
import { format } from "date-fns";
// Insert log entry
export const insertLogs = async (
  transactionId,
  thirdpart_status,
  description,
  amount,
  customer_charge,
  agent_id,
  agent_name,
  status,
  service_name,
  trxId,
  customerId,
  token
) => {
  try {
    await TransactionStatus.create({
      transactionId,
      thirdpart_status,
      service_name,
      status,
      description,
      amount,
      customer_charge,
      agent_id,
      agent_name,
      transaction_reference: trxId,
      customerId,
      token,
    });
    console.log(" Data inserted into logs");
  } catch (error) {
    console.error("Error inserting into logs:", error.message);
  }
};

// Update log entry
export const updateLogs = async (transactionId, status, thirdpart_status, token) => {
  try {
    const [updated] = await TransactionStatus.update(
      { transactionId, thirdpart_status, status, token },
      { where: { transactionId: transactionId } }
    );
    if (updated > 0) {
      console.log(" Update successful");
    } else {
      console.log(" No matching record found to update");
    }
  } catch (error) {
    console.error("Error updating logs:", error.message);
  }
};

// Select all completed logs
export const selectAllLogs = async (id) => {
  try {
    const results = await TransactionStatus.findAll({
      where: { agent_id: id },
      attributes: [
        "transactionId",
        "agent_name",
        "agent_id",
        "service_name",
        "amount",
        "customer_charge",
        "status",
        "description",
        "token",
        "date",
      ],
      raw: true,
    });

    if (!results || results.length === 0) return [];

    // Map over each transaction
    return results.map((row) => {
      const formattedDate = row.date
        ? format(new Date(row.date), "dd/MM/yyyy")
        : null;

      const formattedAmount = `${Number(row.amount).toFixed(2)} Rwf`;

      return {
        id: row.transactionId,
        date: row.date,
        formattedDate,
        processDate: row.date,
        formattedProcessDate: formattedDate,
        amount: Number(row.amount),
        formattedAmount,
        customerCharge: Number(row.customer_charge),
        token: row.token,
        status: row.status,
        description: row.description,
        serviceName: row.service_name,
      };
    });
  } catch (error) {
    console.error("Error fetching logs:", error.message);
    return [];
  }
};

// Select all completed logs
export const selectTransactionById = async (id) => {
  try {
    const result = await TransactionStatus.findOne({
      where: { transactionId: id },
      attributes: [
        "transactionId",
        "agent_name",
        "agent_id",
        "service_name",
        "amount",
        "customer_charge",
        "status",
        "description",
        "token",
        "date",
      ],
      raw: true,
    });

    if (!result) return null;

    // Format date
    const formattedDate = result.date
      ? format(new Date(result.date), "dd/MM/yyyy")
      : null;

    // amount formatting (negative for charges, if needed)
    const formattedAmount = `${Number(result.amount).toFixed(2)} Rwf`;

    // build response
    return {
      id: result.transactionId,
      date: result.date,
      formattedDate,
      processDate: result.date, // you can use another column if processDate differs
      formattedProcessDate: formattedDate,
      amount: Number(result.amount),
      formattedAmount,
      customerCharge: Number(result.customer_charge),
      status: result.status,
      description: result.description,
      serviceName: result.serviceName

    };
  } catch (error) {
    console.error("Error fetching logs:", error.message);
    return null;
  }
};


// Insert into bulk service payment results (still raw SQL for now)
export const insertInBulkServicePayment = async (
  service_name,
  agent_name,
  amount,
  successCount,
  failureCount,
  description,
  status
) => {
  try {
    await sequelize.query(
      "INSERT INTO bulkservicepaymentresults (service_name, agent_name, amount, successCount, failureCount, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          service_name,
          agent_name,
          amount,
          successCount,
          failureCount,
          description,
          status,
        ],
      }
    );
    console.log("Bulk service payment result inserted");
  } catch (error) {
    console.error("Error inserting bulk service payment:", error.message);
  }
};
