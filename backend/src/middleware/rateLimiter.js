import rateLimit from 'express-rate-limit';

/**
 * Check if the request should bypass rate limiting (e.g. in test environment)
 */
const shouldSkip = () => {
  return process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';
};

/**
 * General API Rate Limiter
 * 300 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Authentication Rate Limiter
 * 25 requests per 15 minutes to prevent brute-force attacks on login and registration
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * AI Generation Rate Limiter
 * 15 expensive AI generation calls per 15 minutes per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    success: false,
    message: 'AI generation quota exceeded for your session. Please wait a few minutes before generating more reports.',
  },
});

/**
 * Resume PDF Generation Limiter
 * 30 PDF generation requests per 15 minutes per IP
 */
export const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  message: {
    success: false,
    message: 'PDF generation rate limit reached. Please wait a moment before downloading another PDF.',
  },
});
