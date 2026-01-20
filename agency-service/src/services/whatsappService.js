import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const COMPANY_WHATSAPP_NUMBER = process.env.COMPANY_WHATSAPP_NUMBER;

/**
 * Send WhatsApp message using Facebook Graph API
 * For WhatsApp Business API setup, you need:
 * 1. Facebook Business Account
 * 2. WhatsApp Business API access
 * 3. Phone Number ID and Access Token
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      logger.warn('WhatsApp credentials not configured. Message not sent.');
      logger.info('WhatsApp Message (would be sent):', { phoneNumber, message });
      return { success: false, error: 'WhatsApp not configured' };
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/[\s+]/g, '');

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('WhatsApp message sent successfully', {
      phoneNumber: formattedPhone,
      messageId: response.data.messages?.[0]?.id
    });

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      data: response.data
    };
  } catch (error) {
    logger.error('Failed to send WhatsApp message', {
      error: error.message,
      response: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

/**
 * Send transaction report to company WhatsApp
 */
export const sendTransactionReport = async (reportMessage, reportType = 'Hourly') => {
  try {
    if (!COMPANY_WHATSAPP_NUMBER) {
      logger.warn('Company WhatsApp number not configured');
      logger.info(`${reportType} Report (would be sent):`, reportMessage);
      return { success: false, error: 'Company WhatsApp number not configured' };
    }

    const result = await sendWhatsAppMessage(COMPANY_WHATSAPP_NUMBER, reportMessage);
    
    if (result.success) {
      logger.info(`${reportType} transaction report sent to company WhatsApp`, {
        messageId: result.messageId
      });
    }

    return result;
  } catch (error) {
    logger.error(`Failed to send ${reportType} report`, { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Send alert for high failure rate
 */
export const sendFailureAlert = async (stats, threshold = 20) => {
  try {
    const failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100) : 0;

    if (failureRate >= threshold) {
      const alertMessage = `
🚨 *HIGH FAILURE RATE ALERT* 🚨

⚠️ Transaction failure rate is ${failureRate.toFixed(2)}%

📊 Statistics:
• Total: ${stats.total}
• Failed: ${stats.failed}
• Successful: ${stats.successful}

🕐 Period: ${stats.period.start} - ${stats.period.end}

⚡ Immediate action may be required!
      `.trim();

      return await sendTransactionReport(alertMessage, 'ALERT');
    }

    return { success: true, message: 'Failure rate within acceptable range' };
  } catch (error) {
    logger.error('Failed to send failure alert', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Alternative: Send via Twilio WhatsApp API
 * Uncomment and configure if using Twilio instead of Facebook
 */
/*
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

export const sendWhatsAppViaTwilio = async (phoneNumber, message) => {
  try {
    const twilio = require('twilio');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const result = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });

    logger.info('WhatsApp message sent via Twilio', { sid: result.sid });
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error('Failed to send WhatsApp via Twilio', { error: error.message });
    return { success: false, error: error.message };
  }
};
*/

export default {
  sendWhatsAppMessage,
  sendTransactionReport,
  sendFailureAlert
};
