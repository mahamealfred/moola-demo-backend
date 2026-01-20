import express from 'express';
import { createResponse, createErrorResponse } from '@moola/shared';
import {
  getHourlyStats,
  getDailyStats,
  getTransactionStats,
  getFailedTransactions,
  formatStatsForWhatsApp,
  formatFailedTransactionsForWhatsApp
} from '../services/transactionStatsService.js';
import { sendTransactionReport } from '../services/whatsappService.js';
import { triggerManualReport } from '../jobs/reportScheduler.js';
import { subHours, subDays, startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

/**
 * GET /api/reports/stats/hourly
 * Get hourly transaction statistics
 */
router.get('/stats/hourly', async (req, res) => {
  try {
    const stats = await getHourlyStats();
    return res.json(createResponse('common.success', req.language, stats));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/stats/daily
 * Get daily transaction statistics
 */
router.get('/stats/daily', async (req, res) => {
  try {
    const stats = await getDailyStats();
    return res.json(createResponse('common.success', req.language, stats));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/stats/custom
 * Get custom period transaction statistics
 * Query params: startDate, endDate (ISO format)
 */
router.get('/stats/custom', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        createErrorResponse('validation.missing_required_fields', req.language, 400)
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json(
        createErrorResponse('validation.invalid_request', req.language, 400, {
          message: 'Invalid date format. Use ISO format (YYYY-MM-DD)'
        })
      );
    }

    const stats = await getTransactionStats(start, end);
    return res.json(createResponse('common.success', req.language, stats));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/failed/hourly
 * Get failed transactions from last hour
 */
router.get('/failed/hourly', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const endDate = new Date();
    const startDate = subHours(endDate, 1);

    const failedTxns = await getFailedTransactions(startDate, endDate, limit);
    return res.json(createResponse('common.success', req.language, {
      count: failedTxns.length,
      transactions: failedTxns
    }));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/failed/daily
 * Get failed transactions from today
 */
router.get('/failed/daily', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const startDate = startOfDay(new Date());
    const endDate = endOfDay(new Date());

    const failedTxns = await getFailedTransactions(startDate, endDate, limit);
    return res.json(createResponse('common.success', req.language, {
      count: failedTxns.length,
      transactions: failedTxns
    }));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * POST /api/reports/send/manual
 * Manually trigger report sending to WhatsApp
 * Body: { type: 'hourly' | 'daily' }
 */
router.post('/send/manual', async (req, res) => {
  try {
    const { type = 'hourly' } = req.body;

    if (!['hourly', 'daily'].includes(type)) {
      return res.status(400).json(
        createErrorResponse('validation.invalid_request', req.language, 400, {
          message: 'Type must be either "hourly" or "daily"'
        })
      );
    }

    await triggerManualReport(type);

    return res.json(createResponse('common.success', req.language, {
      message: `${type} report sent successfully`
    }));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/preview/hourly
 * Preview hourly report message (without sending)
 */
router.get('/preview/hourly', async (req, res) => {
  try {
    const stats = await getHourlyStats();
    const message = formatStatsForWhatsApp(stats, 'Hourly');

    const endDate = new Date();
    const startDate = subHours(endDate, 1);
    const failedTxns = await getFailedTransactions(startDate, endDate, 5);
    const failedMessage = formatFailedTransactionsForWhatsApp(failedTxns, 'Hourly');

    return res.json(createResponse('common.success', req.language, {
      statsReport: message,
      failedReport: failedMessage,
      stats
    }));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

/**
 * GET /api/reports/preview/daily
 * Preview daily report message (without sending)
 */
router.get('/preview/daily', async (req, res) => {
  try {
    const stats = await getDailyStats();
    const message = formatStatsForWhatsApp(stats, 'Daily');

    const startDate = startOfDay(new Date());
    const endDate = endOfDay(new Date());
    const failedTxns = await getFailedTransactions(startDate, endDate, 10);
    const failedMessage = formatFailedTransactionsForWhatsApp(failedTxns, 'Daily');

    return res.json(createResponse('common.success', req.language, {
      statsReport: message,
      failedReport: failedMessage,
      stats
    }));
  } catch (error) {
    return res.status(500).json(
      createErrorResponse('common.server_error', req.language, 500, {
        error: error.message
      })
    );
  }
});

export default router;
