/**
 * Validates essential environment variables on backend startup
 */
export const validateEnvironment = () => {
  const issues = [];
  const warnings = [];

  // Critical for database
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    issues.push('MONGODB_URI (or MONGO_URI) is missing. MongoDB connection will fail.');
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

  // Gemini Model Validation
  const geminiModel = process.env.GEMINI_MODEL;
  if (!geminiModel) {
    warnings.push('GEMINI_MODEL is not set. Defaulting to gemini-3.8-flash.');
  } else if (geminiModel.trim() === 'gemini-2.5-flash') {
    warnings.push('GEMINI_MODEL is set to deprecated "gemini-2.5-flash". Automatically using gemini-3.8-flash.');
  }

  // Frontend Client URL
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  if (!frontendUrl) {
    warnings.push('FRONTEND_URL (or CLIENT_URL) is not set. Defaulting to http://localhost:5173 for CORS.');
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
