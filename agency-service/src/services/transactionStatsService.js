import { Op } from 'sequelize';
import TransactionStatus from '../models/TransactionStatus.js';
import logger from '../utils/logger.js';
import { format, subHours, startOfDay, endOfDay } from 'date-fns';

/**
 * Get transaction statistics for a given time period
 */
export const getTransactionStats = async (startDate, endDate) => {
  try {
    const transactions = await TransactionStatus.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['status', 'amount', 'service_name', 'date', 'description'],
      raw: true
    });

    // Calculate statistics
    const stats = {
      total: transactions.length,
      successful: 0,
      failed: 0,
      totalAmount: 0,
      successAmount: 0,
      failedAmount: 0,
      byService: {},
      period: {
        start: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
        end: format(endDate, 'yyyy-MM-dd HH:mm:ss')
      }
    };

    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      const status = txn.status?.toLowerCase();
      const service = txn.service_name || 'Unknown';

      // Initialize service stats if not exists
      if (!stats.byService[service]) {
        stats.byService[service] = {
          total: 0,
          successful: 0,
          failed: 0,
          amount: 0
        };
      }

      stats.byService[service].total++;
      stats.byService[service].amount += amount;

      if (status === 'success' || status === 'completed' || status === 'successful') {
        stats.successful++;
        stats.successAmount += amount;
        stats.byService[service].successful++;
      } else if (status === 'failed' || status === 'error' || status === 'declined') {
        stats.failed++;
        stats.failedAmount += amount;
        stats.byService[service].failed++;
      }

      stats.totalAmount += amount;
    });

    // Calculate success rate
    stats.successRate = stats.total > 0 
      ? ((stats.successful / stats.total) * 100).toFixed(2) 
      : 0;

    return stats;
  } catch (error) {
    logger.error('Error getting transaction stats', { error: error.message });
    throw error;
  }
};

/**
 * Get hourly transaction statistics (last hour)
 */
export const getHourlyStats = async () => {
  const endDate = new Date();
  const startDate = subHours(endDate, 1);
  return await getTransactionStats(startDate, endDate);
};

/**
 * Get daily transaction statistics (today)
 */
export const getDailyStats = async () => {
  const startDate = startOfDay(new Date());
  const endDate = endOfDay(new Date());
  return await getTransactionStats(startDate, endDate);
};

/**
 * Get failed transactions details for a period
 */
export const getFailedTransactions = async (startDate, endDate, limit = 10) => {
  try {
    const failedTxns = await TransactionStatus.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.in]: ['failed', 'error', 'declined', 'Failed', 'ERROR', 'DECLINED']
        }
      },
      attributes: [
        'transactionId', 
        'service_name', 
        'amount', 
        'description', 
        'date',
        'agent_name',
        'customerId'
      ],
      order: [['date', 'DESC']],
      limit,
      raw: true
    });

    return failedTxns.map(txn => ({
      id: txn.transactionId,
      service: txn.service_name,
      amount: parseFloat(txn.amount || 0),
      reason: txn.description,
      date: format(new Date(txn.date), 'dd/MM/yyyy HH:mm'),
      agent: txn.agent_name,
      customer: txn.customerId
    }));
  } catch (error) {
    logger.error('Error getting failed transactions', { error: error.message });
    return [];
  }
};

/**
 * Format stats for WhatsApp message
 */
export const formatStatsForWhatsApp = (stats, reportType = 'Hourly') => {
  const lines = [];
  
  lines.push(`📊 *${reportType} Transaction Report*`);
  lines.push(`⏰ ${stats.period.start} - ${stats.period.end}`);
  lines.push('');
  lines.push(`📈 *Overall Statistics*`);
  lines.push(`• Total Transactions: ${stats.total}`);
  lines.push(`• ✅ Successful: ${stats.successful}`);
  lines.push(`• ❌ Failed: ${stats.failed}`);
  lines.push(`• Success Rate: ${stats.successRate}%`);
  lines.push('');
  lines.push(`💰 *Financial Summary*`);
  lines.push(`• Total Amount: ${stats.totalAmount.toLocaleString('en-RW')} RWF`);
  lines.push(`• Success Amount: ${stats.successAmount.toLocaleString('en-RW')} RWF`);
  lines.push(`• Failed Amount: ${stats.failedAmount.toLocaleString('en-RW')} RWF`);
  
  if (Object.keys(stats.byService).length > 0) {
    lines.push('');
    lines.push(`🔧 *By Service*`);
    Object.entries(stats.byService).forEach(([service, data]) => {
      lines.push(`\n*${service}*`);
      lines.push(`  Total: ${data.total} | ✅ ${data.successful} | ❌ ${data.failed}`);
      lines.push(`  Amount: ${data.amount.toLocaleString('en-RW')} RWF`);
    });
  }
  
  return lines.join('\n');
};

/**
 * Format failed transactions for WhatsApp
 */
export const formatFailedTransactionsForWhatsApp = (failedTxns, reportType = 'Hourly') => {
  if (failedTxns.length === 0) {
    return `✅ *${reportType} Failed Transactions*\n\nNo failed transactions in this period. 🎉`;
  }

  const lines = [];
  lines.push(`❌ *${reportType} Failed Transactions (Last ${failedTxns.length})*`);
  lines.push('');

  failedTxns.forEach((txn, index) => {
    lines.push(`${index + 1}. *${txn.service}*`);
    lines.push(`   ID: ${txn.id}`);
    lines.push(`   Amount: ${txn.amount.toLocaleString('en-RW')} RWF`);
    lines.push(`   Time: ${txn.date}`);
    lines.push(`   Reason: ${txn.reason || 'Unknown'}`);
    if (index < failedTxns.length - 1) lines.push('');
  });

  return lines.join('\n');
};
