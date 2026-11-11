/**
 * Security headers middleware
 * Sets defensive HTTP headers against clickjacking, MIME sniffing, and cross-site leaks
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Basic CSRF / Origin verification middleware for state-modifying requests
 * Ensures cross-site requests cannot perform unauthorized actions via forged credentials
 */
export const verifyRequestOrigin = (req, res, next) => {
  // Safe HTTP methods do not modify server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If Authorization header is provided (e.g. CLI or mobile client), token is explicitly attached
  if (req.headers.authorization) {
    return next();
  }

  // When request relies on ambient credentials (cookies), verify origin/referer if provided
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);

  if (!origin) {
    // Non-browser or server-to-server requests without Origin header
    return next();
  }

  const cleanOrigin = origin.replace(/\/+$/, '');

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'https://hire-nex.vercel.app',
    'https://hirenex.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ]
    .filter(Boolean)
    .flatMap((url) => url.split(',').map((u) => u.trim().replace(/\/+$/, '')));

  const isAllowed =
    allowedOrigins.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed).origin;
        return cleanOrigin === allowedUrl;
      } catch {
        return cleanOrigin === allowed;
      }
    }) ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1');

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request rejected for security reasons.',
    });
  }

  next();
};
