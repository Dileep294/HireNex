import { getGeminiClient, getGeminiModelName, isGeminiConfigured } from '../config/gemini.js';
import { cleanJsonText, withTimeout } from './aiInterviewService.js';

const RESUME_OPTIMIZATION_SYSTEM_INSTRUCTION = `You are HireNex's expert ATS (Applicant Tracking System) Specialist and Senior Technical Resume Writer.
Your job is to optimize a candidate's resume for a specific target job description.

CRITICAL INTEGRITY RULES:
1. NEVER invent, fabricate, or hallucinate skills, employment history, degrees, or achievements not found in the candidate's data.
2. Only suggest emphasizing skills that the candidate ACTUALLY has in their profile or resume.
3. Suggest stronger action verbs and quantifiable framing for existing achievements.
4. Identify real ATS keywords from the target job description that align with the candidate's actual background.
5. Provide output strictly as a valid JSON object matching the requested schema. Do not use markdown wrappers or outside text.`;

export async function optimizeResumeForJobDescription({
  resumeData,
  jobDescription,
  customAiClient = null,
}) {
  if (!isGeminiConfigured() && !customAiClient) {
    throw new Error('Gemini AI API key is not configured on the backend.');
  }

  const client = customAiClient || getGeminiClient();
  const modelName = getGeminiModelName();

  const userPrompt = `Analyze and optimize the following resume against the target job description:

<<<TARGET_JOB_DESCRIPTION>>>
${jobDescription.trim()}
<<<END_JOB_DESCRIPTION>>>

<<<CANDIDATE_RESUME_DATA>>>
${JSON.stringify(resumeData, null, 2)}
<<<END_CANDIDATE_RESUME_DATA>>>

Generate a JSON object with this exact structure:
{
  "atsScore": <number between 0 and 100 representing how well the current resume matches the job requirements>,
  "matchedKeywords": ["<keyword1>", "<keyword2>"],
  "missingKeywords": ["<critical keyword from job description that candidate should consider addressing if they have the experience>"],
  "skillsToHighlight": ["<existing candidate skill that directly matches the job>"],
  "improvedSummary": "<a refined, high-impact professional summary written specifically for this target role, using only the candidate's verified background>",
  "contentImprovements": [
    {
      "section": "<e.g. Experience or Projects>",
      "current": "<snippet of current phrasing or area for improvement>",
      "suggested": "<clear, metric-driven phrasing using active verbs based strictly on candidate's real context>",
      "rationale": "<why this improves ATS parsing and recruiter attention>"
    }
  ]
}`;

  const generatePromise = client.models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction: RESUME_OPTIMIZATION_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const response = await withTimeout(generatePromise, 45000);

  const responseText = response.text ? response.text.trim() : '';
  const cleanedJson = cleanJsonText(responseText);

  try {
    const parsed = JSON.parse(cleanedJson);
    return {
      atsScore: typeof parsed.atsScore === 'number' ? Math.max(0, Math.min(100, parsed.atsScore)) : 75,
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      skillsToHighlight: Array.isArray(parsed.skillsToHighlight) ? parsed.skillsToHighlight : [],
      improvedSummary: typeof parsed.improvedSummary === 'string' ? parsed.improvedSummary : '',
      contentImprovements: Array.isArray(parsed.contentImprovements) ? parsed.contentImprovements : [],
    };
  } catch (parseErr) {
    throw new Error(`Failed to parse AI ATS optimization output: ${parseErr.message}`);
  }
}
