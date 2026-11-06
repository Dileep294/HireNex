import { getGeminiClient, getGeminiModelName } from '../config/gemini.js';
import {
  INTERVIEW_SYSTEM_INSTRUCTION,
  buildInterviewAnalysisPrompt,
} from '../prompts/interviewAnalysisPrompt.js';
import { validateAiResponse } from '../validations/aiResponseValidation.js';

const MAX_JOB_DESC_CHARS = 12000;
const MAX_RESUME_CHARS = 30000;
const MAX_SELF_DESC_CHARS = 10000;
const REQUEST_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;

/**
 * Remove markdown code blocks if wrapped by Gemini
 */
export const cleanJsonText = (rawText) => {
  if (!rawText) return '';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

/**
 * Identify transient failures suitable for exponential backoff retry
 */
export const isTransientError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode;

  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('timed out') ||
    msg.includes('econnreset')
  );
};

/**
 * Promise wrapper enforcing a timeout
 */
export const withTimeout = (promise, ms = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`AI analysis request timed out after ${ms / 1000} seconds.`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

/**
 * Execute Gemini model call with exponential backoff for transient errors
 */
const callGeminiWithRetry = async (aiClient, modelName, prompt, systemInstruction) => {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const generatePromise = aiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for consistent, factual output
        },
      });

      const response = await withTimeout(generatePromise, REQUEST_TIMEOUT_MS);
      const textOutput =
        response?.text ||
        response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error('Gemini API returned an empty response.');
      }

      return textOutput;
    } catch (err) {
      const isTransient = isTransientError(err);

      if (isTransient && attempt < MAX_RETRIES) {
        attempt++;
        const backoffDelay = attempt * 1500;
        console.warn(
          `[Gemini AI] Transient error encountered (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${backoffDelay}ms... Error: ${err.message}`
        );
        await new Promise((res) => setTimeout(res, backoffDelay));
        continue;
      }

      // Non-transient or retries exhausted: sanitize error message
      if (err.message?.includes('API_KEY_INVALID') || err.status === 400 && err.message?.includes('API key')) {
        throw new Error('Invalid Gemini API Key. Please verify your credentials.');
      }

      if (isTransient) {
        throw new Error(
          'Gemini AI rate limit reached or service temporarily unavailable. Please try again shortly.'
        );
      }

      throw err;
    }
  }
};

/**
 * Main AI Interview Strategy Generation Function
 *
 * @param {Object} params
 * @param {string} params.jobTitle
 * @param {string} [params.companyName]
 * @param {string} params.jobDescription
 * @param {string} [params.resumeText]
 * @param {string} [params.selfDescription]
 * @param {Object} [params.customAiClient] Optional custom client for testing
 * @returns {Promise<Object>} Validated interview analysis report
 */
export const generateInterviewStrategy = async ({
  jobTitle,
  companyName = '',
  jobDescription,
  resumeText = '',
  selfDescription = '',
  customAiClient = null,
}) => {
  // 1. Validate inputs
  if (!jobTitle || jobTitle.trim().length === 0) {
    throw new Error('Job title is required for AI interview strategy generation.');
  }

  if (!jobDescription || jobDescription.trim().length < 10) {
    throw new Error('Job description must be at least 10 characters long.');
  }

  const hasResume = resumeText && resumeText.trim().length > 0;
  const hasSelfDescription = selfDescription && selfDescription.trim().length > 0;

  if (!hasResume && !hasSelfDescription) {
    throw new Error(
      'Candidate profile is missing. Please provide either resume text or a self-description.'
    );
  }

  // 2. Sanitize and bound input character sizes
  const sanitizedJobDescription = jobDescription.trim().slice(0, MAX_JOB_DESC_CHARS);
  const sanitizedResumeText = (resumeText || '').trim().slice(0, MAX_RESUME_CHARS);
  const sanitizedSelfDescription = (selfDescription || '').trim().slice(0, MAX_SELF_DESC_CHARS);

  // 3. Acquire Gemini Client
  const aiClient = customAiClient || getGeminiClient();
  const modelName = getGeminiModelName();

  // 4. Construct Prompt
  const prompt = buildInterviewAnalysisPrompt({
    jobTitle: jobTitle.trim(),
    companyName: (companyName || '').trim(),
    jobDescription: sanitizedJobDescription,
    resumeText: sanitizedResumeText,
    selfDescription: sanitizedSelfDescription,
  });

  // 5. Invoke Gemini API
  const rawTextOutput = await callGeminiWithRetry(
    aiClient,
    modelName,
    prompt,
    INTERVIEW_SYSTEM_INSTRUCTION
  );

  // 6. Clean and parse JSON
  const cleanedJson = cleanJsonText(rawTextOutput);
  let parsedJson;
  try {
    parsedJson = JSON.parse(cleanedJson);
  } catch (parseErr) {
    throw new Error(
      `Malformed JSON response returned by AI engine: ${parseErr.message}`
    );
  }

  // 7. Strictly Validate Schema
  const validatedReport = validateAiResponse(parsedJson);

  return validatedReport;
};

