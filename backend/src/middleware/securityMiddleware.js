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

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  const isAllowed = allowedOrigins.some((allowed) => {
    try {
      const allowedUrl = new URL(allowed).origin;
      return origin === allowedUrl;
    } catch {
      return false;
    }
  });

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request rejected for security reasons.',
    });
  }

  next();
};
