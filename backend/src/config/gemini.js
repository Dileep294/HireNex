import { GoogleGenAI } from '@google/genai';

/**
 * Retrieve the active Gemini API key from environment variables
 */
export const getGeminiApiKey = () => {
  const key =
    process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (
    !key ||
    key === 'your_gemini_api_key_here' ||
    key.trim().length === 0
  ) {
    return null;
  }

  return key.trim();
};

/**
 * Retrieve configured Gemini model name
 */
export const getGeminiModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

/**
 * Check whether Gemini API is properly configured
 */
export const isGeminiConfigured = () => {
  return getGeminiApiKey() !== null;
};

/**
 * Factory to instantiate and return the official GoogleGenAI client
 */
export const getGeminiClient = () => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please define GOOGLE_GENAI_API_KEY or GEMINI_API_KEY in backend/.env.'
    );
  }

  return new GoogleGenAI({ apiKey });
};

