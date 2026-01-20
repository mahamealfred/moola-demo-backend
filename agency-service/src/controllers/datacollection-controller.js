import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import { createResponse, createErrorResponse } from '@moola/shared';

dotenv.config();

const API_KEY = process.env.DATA_COLLECTION_API_KEY || 'ak_686b17e73ff609c38ade4afa536764032e04695cbc5fec3c14b23af15ee1b403';
const BASE_URL = process.env.DATA_COLLECTION_BASE_URL || 'https://afriqollect.com/api';

/**
 * Get External Forms Endpoint
 * GET /external/forms
 * Retrieves available forms from external data collection service
 * Supports language parameter for localized responses
 */
export const getExternalForms = async (req, res) => {
  try {
    const language = req.language || 'en'; // Language from middleware
    
    logger.info('Fetching external forms', {
      language,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Call external forms API
    const response = await axios.get(
      `${BASE_URL}/external/forms`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Accept-Language': language,
          'User-Agent': 'Moola-DataCollection-Service/1.0'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Format response with language support
    logger.info('Forms retrieved successfully', {
      language,
      formsCount: response.data?.forms?.length || 0
    });

    return res.status(200).json(createResponse(
      true,
      'data_collection.forms_retrieved_successfully',
      response.data,
      language
    ));

  } catch (error) {
    logger.error('Error fetching external forms', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json(
        createErrorResponse(
          'data_collection.authentication_failed',
          req.language || 'en',
          401
        )
      );
    }

    if (error.response?.status === 404) {
      return res.status(404).json(
        createErrorResponse(
          'data_collection.forms_not_found',
          req.language || 'en',
          404
        )
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json(
        createErrorResponse(
          'data_collection.service_unavailable',
          req.language || 'en',
          503
        )
      );
    }

    return res.status(500).json(
      createErrorResponse(
        'common.server_error',
        req.language || 'en',
        500,
        {
          error: error.message,
          requestId: req.id
        }
      )
    );
  }
};

/**
 * Submit Form Data Endpoint
 * POST /external/forms
 * Submits form data to external data collection service
 * Validates API key and supports multiple languages
 */
export const submitFormData = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { formId, formData } = req.body;

    logger.info('Submitting form data', {
      formId,
      language,
      ip: req.ip
    });

    // Validate required fields
    if (!formId || !formData) {
      return res.status(400).json(
        createErrorResponse(
          'validation.missing_form_fields',
          language,
          400,
          { 
            missingFields: ['formId', 'formData'].filter(
              field => !req.body[field]
            )
          }
        )
      );
    }

    // Prepare payload
    const payload = {
      formId,
      formData,
      submittedAt: new Date().toISOString(),
      language,
      agentId: req.user?.agentId || req.headers['x-agent-id'],
      sessionId: req.sessionId || req.headers['x-session-id']
    };

    // Submit to external API
    const response = await axios.post(
      `${BASE_URL}/external/forms`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          'Accept-Language': language,
          'User-Agent': 'Moola-DataCollection-Service/1.0'
        },
        timeout: 30000
      }
    );

    logger.info('Form submitted successfully', {
      formId,
      submissionId: response.data?.submissionId,
      language
    });

    return res.status(201).json(createResponse(
      true,
      'data_collection.form_submitted_successfully',
      {
        formId,
        submissionId: response.data?.submissionId,
        status: response.data?.status,
        message: response.data?.message
      },
      language
    ));

  } catch (error) {
    logger.error('Error submitting form data', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle validation errors from external service
    if (error.response?.status === 400) {
      return res.status(400).json(
        createErrorResponse(
          'data_collection.invalid_form_data',
          req.language || 'en',
          400,
          {
            details: error.response?.data?.details
          }
        )
      );
    }

    if (error.response?.status === 401) {
      return res.status(401).json(
        createErrorResponse(
          'data_collection.authentication_failed',
          req.language || 'en',
          401
        )
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json(
        createErrorResponse(
          'data_collection.service_unavailable',
          req.language || 'en',
          503
        )
      );
    }

    return res.status(500).json(
      createErrorResponse(
        'common.server_error',
        req.language || 'en',
        500,
        {
          error: error.message,
          requestId: req.id
        }
      )
    );
  }
};
