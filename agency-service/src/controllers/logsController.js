import sequelize from "../db/config.js";

export const selectBrokerTransactions = async (brokerId) => {
  try {
    // More specific query to reduce data transfer
    const query = `
      SELECT
    t.id,
    t.date,
    a.owner_name AS agent_login_name,
    m.name AS agent_name,
    mm.name AS receiver_account,
    t.amount,
    cfv.string_value AS net_amount,
    t.description
FROM transfers t
INNER JOIN accounts a ON a.id = t.from_account_id
INNER JOIN accounts aa ON aa.id = t.to_account_id
INNER JOIN users u ON u.username = a.owner_name
INNER JOIN users uu ON uu.username = aa.owner_name
INNER JOIN members m ON t.by_id = m.id
INNER JOIN members mm ON mm.id = uu.id
INNER JOIN custom_field_values cfv ON cfv.transfer_id = t.id
INNER JOIN brokerings br ON br.brokered_id = m.id
INNER JOIN members b ON br.broker_id = b.id
WHERE b.id = :brokerId
  AND cfv.field_id = 87
  AND mm.name NOT IN ('DDIN Business Commission Account')
ORDER BY t.date DESC;

    `;

    const results = await sequelize.query(query, {
      replacements: { brokerId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Simplified result handling
    const rows = Array.isArray(results) ? 
      (results.length === 2 && Array.isArray(results[0]) ? results[0] : results) : 
      (results ? [results] : []);

    if (rows.length === 0) {
      console.log('No transactions found for brokerId:', brokerId);
      return [];
    }

    // Single-pass processing
    return rows.map((row) => {
      const amount = Number(row.amount);
      // Remove "EFASHE" from description (case insensitive)
      const cleanedDescription = row.description ? 
        row.description.replace(/efashe/gi, '').trim() : 
        row.description;
      return {
        id: row.id,
        date: row.date,
        formattedDate: new Date(row.date).toLocaleDateString("en-GB"),
        agentName: row.agent_name,
        receiverAccount: row.receiver_account=='EFASHE'?'DDIN':row.receiver_account, // Since we filtered out EFASHE in query
        amount: amount,
        formattedAmount: `${amount.toFixed(2)} Rwf`,
        netAmount: Number(row.net_amount),
        description: cleanedDescription,
      };
    });

  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    throw error;
  }
};