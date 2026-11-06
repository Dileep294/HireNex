import express from 'express';
import {
  uploadResume,
  deleteResume,
} from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All resume routes are protected by JWT authentication
router.use(protect);

router.post('/upload', handleResumeUpload, uploadResume);
router.delete('/:fileName', deleteResume);

export default router;

