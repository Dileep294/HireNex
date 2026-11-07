import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { securityHeaders, verifyRequestOrigin } from './middleware/securityMiddleware.js';

const app = express();

// Security headers (nosniff, X-Frame-Options DENY, XSS protection, Referrer policy)
app.use(securityHeaders);

// Basic CSRF / Origin verification for state-modifying requests
app.use(verifyRequestOrigin);

// CORS configuration to allow frontend origin and credentials
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Standard JSON and urlencoded body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware for JWT auth tokens
app.use(cookieParser());

// Apply global rate limiting to all /api routes
app.use('/api', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to HireNex API. Use /api/health for system status.',
  });
});

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resumes', resumeRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
