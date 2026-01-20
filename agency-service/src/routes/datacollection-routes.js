import express from 'express';
import { getExternalForms, submitFormData } from '../controllers/datacollection-controller.js';

const router = express.Router();

/**
 * Data Collection Routes
 * Base path: /external
 */

// GET endpoint - Retrieve available forms
router.get('/external/forms', getExternalForms);

// POST endpoint - Submit form data
router.post('/external/forms', submitFormData);

export default router;
