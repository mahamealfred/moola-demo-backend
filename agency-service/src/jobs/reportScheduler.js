import cron from 'node-cron';
import logger from '../utils/logger.js';
import {
  getHourlyStats,
  getDailyStats,
  getFailedTransactions,
  formatStatsForWhatsApp,
  formatFailedTransactionsForWhatsApp
} from '../services/transactionStatsService.js';
import {
  sendTransactionReport,
  sendFailureAlert
} from '../services/whatsappService.js';
import { subHours, startOfDay, endOfDay } from 'date-fns';

/**
 * Send hourly transaction report
 */
const sendHourlyReport = async () => {
  try {
    logger.info('Starting hourly transaction report generation');

    const stats = await getHourlyStats();
    const reportMessage = formatStatsForWhatsApp(stats, 'Hourly');

    // Send the report
    await sendTransactionReport(reportMessage, 'Hourly');

    // Check if failure rate is high and send alert
    await sendFailureAlert(stats, 20); // Alert if failure rate > 20%

    // Also send failed transactions details if there are any
    if (stats.failed > 0) {
      const endDate = new Date();
      const startDate = subHours(endDate, 1);
      const failedTxns = await getFailedTransactions(startDate, endDate, 5);
      const failedMessage = formatFailedTransactionsForWhatsApp(failedTxns, 'Hourly');
      await sendTransactionReport(failedMessage, 'Hourly Failed');
    }

    logger.info('Hourly transaction report sent successfully', {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed
    });
  } catch (error) {
    logger.error('Failed to send hourly report', { error: error.message });
  }
};

/**
 * Send daily transaction report
 */
const sendDailyReport = async () => {
  try {
    logger.info('Starting daily transaction report generation');

    const stats = await getDailyStats();
    const reportMessage = formatStatsForWhatsApp(stats, 'Daily');

    // Send the report
    await sendTransactionReport(reportMessage, 'Daily');

    // Check if failure rate is high and send alert
    await sendFailureAlert(stats, 15); // Alert if failure rate > 15%

    // Send failed transactions details
    if (stats.failed > 0) {
      const startDate = startOfDay(new Date());
      const endDate = endOfDay(new Date());
      const failedTxns = await getFailedTransactions(startDate, endDate, 10);
      const failedMessage = formatFailedTransactionsForWhatsApp(failedTxns, 'Daily');
      await sendTransactionReport(failedMessage, 'Daily Failed');
    }

    logger.info('Daily transaction report sent successfully', {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed
    });
  } catch (error) {
    logger.error('Failed to send daily report', { error: error.message });
  }
};

/**
 * Initialize scheduled jobs
 */
export const initializeScheduledJobs = () => {
  logger.info('Initializing scheduled transaction reports');

  // Hourly report - runs at the start of every hour (e.g., 1:00, 2:00, 3:00)
  cron.schedule('0 * * * *', async () => {
    logger.info('Hourly report cron job triggered');
    await sendHourlyReport();
  });

  // Daily report - runs at 8:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    logger.info('Daily morning report cron job triggered');
    await sendDailyReport();
  });

  // Daily report - runs at 8:00 PM every day (end of day summary)
  cron.schedule('0 20 * * *', async () => {
    logger.info('Daily evening report cron job triggered');
    await sendDailyReport();
  });

  logger.info('Scheduled jobs initialized successfully', {
    hourly: 'Every hour at :00',
    dailyMorning: 'Every day at 8:00 AM',
    dailyEvening: 'Every day at 8:00 PM'
  });
};

/**
 * Manual trigger for testing
 */
export const triggerManualReport = async (type = 'hourly') => {
  if (type === 'hourly') {
    await sendHourlyReport();
  } else if (type === 'daily') {
    await sendDailyReport();
  }
};

export default {
  initializeScheduledJobs,
  triggerManualReport,
  sendHourlyReport,
  sendDailyReport
};
