import express from 'express';
import {
  uploadResume,
  deleteResume,
} from '../controllers/resumeController.js';
import {
  generateResumePdf,
  optimizeResume,
} from '../controllers/resumeBuilderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeUpload } from '../middleware/uploadMiddleware.js';
import { aiLimiter, pdfLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../validations/authValidation.js';
import {
  generatePdfSchema,
  aiOptimizeSchema,
} from '../validations/resumeBuilderValidation.js';

const router = express.Router();

// All resume routes are protected by JWT authentication
router.use(protect);

router.post('/upload', handleResumeUpload, uploadResume);
router.post('/generate-pdf', pdfLimiter, validateBody(generatePdfSchema), generateResumePdf);
router.post('/ai-optimize', aiLimiter, validateBody(aiOptimizeSchema), optimizeResume);
router.delete('/:fileName', deleteResume);

export default router;
