import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  validateBody,
  registerSchema,
  loginSchema,
} from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;

