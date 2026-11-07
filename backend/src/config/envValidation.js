/**
 * Validates essential environment variables on backend startup
 */
export const validateEnvironment = () => {
  const issues = [];
  const warnings = [];

  // Critical for database
  if (!process.env.MONGO_URI) {
    issues.push('MONGO_URI is missing. MongoDB connection will fail.');
  }

  // Critical for JWT authentication
  if (!process.env.JWT_SECRET) {
    issues.push('JWT_SECRET is missing. Authentication cannot function securely.');
  } else if (process.env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET is shorter than 16 characters. Consider using a stronger key.');
  }

  // Critical for AI Services
  const geminiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    warnings.push('GOOGLE_GENAI_API_KEY is not set or using placeholder. AI generation features will require a valid key.');
  }

  // Client URL
  if (!process.env.CLIENT_URL) {
    warnings.push('CLIENT_URL is not set. Defaulting to http://localhost:5173 for CORS.');
  }

  // Report issues
  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`⚠️  [Env Config] ${w}`));
  }

  if (issues.length > 0) {
    issues.forEach((err) => console.error(`❌ [Env Config] ${err}`));
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production startup aborted due to missing configuration: ${issues.join(', ')}`);
    }
  }

  return { isValid: issues.length === 0, issues, warnings };
};
