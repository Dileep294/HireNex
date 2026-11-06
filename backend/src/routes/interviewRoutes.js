import express from 'express';
import {
  createReport,
  generateReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
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

// AI Generation endpoint
router.post('/generate', validateBody(generateInterviewSchema), generateReport);

router
  .route('/')
  .post(validateBody(createInterviewSchema), createReport)
  .get(getReports);

router
  .route('/:id')
  .get(validateObjectId('id'), getReportById)
  .patch(validateObjectId('id'), validateBody(updateInterviewSchema), updateReport)
  .delete(validateObjectId('id'), deleteReport);

export default router;

