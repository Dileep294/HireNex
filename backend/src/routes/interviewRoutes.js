import express from 'express';
import {
  createReport,
  generateReport,
  getReports,
  getReportStats,
  getReportById,
  updateReport,
  deleteReport,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../validations/authValidation.js';
import {
  validateObjectId,
  createInterviewSchema,
  updateInterviewSchema,
  generateInterviewSchema,
} from '../validations/interviewValidation.js';

const router = express.Router();

// Apply authentication middleware to all interview routes
router.use(protect);

// AI Generation endpoint (rate-limited)
router.post('/generate', aiLimiter, validateBody(generateInterviewSchema), generateReport);

router
  .route('/')
  .post(validateBody(createInterviewSchema), createReport)
  .get(getReports);

// Report Statistics endpoint
router.get('/stats', getReportStats);

router
  .route('/:id')
  .get(validateObjectId('id'), getReportById)
  .patch(validateObjectId('id'), validateBody(updateInterviewSchema), updateReport)
  .delete(validateObjectId('id'), deleteReport);

export default router;

