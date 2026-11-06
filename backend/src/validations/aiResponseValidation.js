import { z } from 'zod';

export const strengthItemSchema = z.object({
  skillOrArea: z.string().min(1, 'Skill or area name is required'),
  evidence: z.string().min(1, 'Evidence from candidate background is required'),
  relevance: z.string().min(1, 'Relevance explanation is required'),
});

export const skillGapItemSchema = z.object({
  skill: z.string().min(1, 'Skill name is required'),
  importance: z.enum(['High', 'Medium', 'Low'], {
    errorMap: () => ({ message: "Importance must be 'High', 'Medium', or 'Low'" }),
  }),
  explanation: z.string().min(1, 'Explanation is required'),
  suggestedLearning: z
    .array(z.string().min(1))
    .min(1, 'At least one suggested learning topic is required'),
});

export const technicalQuestionItemSchema = z.object({
  question: z.string().min(5, 'Technical question must be at least 5 characters'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
    errorMap: () => ({ message: "Difficulty must be 'Easy', 'Medium', or 'Hard'" }),
  }),
  topic: z.string().min(1, 'Question topic is required'),
  detailedAnswer: z.string().min(10, 'Detailed answer must be at least 10 characters'),
  explanation: z.string().min(5, 'Explanation is required'),
  relatedSkills: z.array(z.string()).default([]),
});

export const starStructureSchema = z.union([
  z.object({
    situation: z.string().min(1, 'Situation is required'),
    task: z.string().min(1, 'Task is required'),
    action: z.string().min(1, 'Action is required'),
    result: z.string().min(1, 'Result is required'),
  }),
  z.string().min(10, 'STAR structure guidance must be provided'),
]);

export const behavioralQuestionItemSchema = z.object({
  question: z.string().min(5, 'Behavioral question must be at least 5 characters'),
  evaluates: z.string().min(1, 'Evaluation criteria is required'),
  suggestedStarStructure: starStructureSchema,
  exampleAnswer: z.string().min(10, 'Example answer must be at least 10 characters'),
  tips: z.string().min(1, 'Tips are required'),
});

export const roadmapDayItemSchema = z.object({
  day: z.number().int().min(1).max(30),
  topic: z.string().min(1, 'Day topic is required'),
  learningObjectives: z.union([
    z.array(z.string().min(1)).min(1),
    z.string().min(5),
  ]),
  tasks: z.array(z.string().min(1)).min(1, 'At least one task is required'),
  practiceActivities: z.array(z.string().min(1)).default([]),
  estimatedMinutes: z
    .number()
    .min(15, 'Estimated study time must be at least 15 minutes')
    .max(480, 'Estimated study time cannot exceed 480 minutes (8 hours)'),
});

/**
 * Root Zod schema for validating the full structured AI response
 */
export const aiResponseSchema = z.object({
  matchScore: z
    .number({ required_error: 'Match score is required' })
    .min(0, 'Match score cannot be less than 0')
    .max(100, 'Match score cannot exceed 100'),
  scoreExplanation: z
    .string({ required_error: 'Score explanation is required' })
    .min(10, 'Score explanation must be at least 10 characters'),
  strengths: z
    .array(strengthItemSchema)
    .min(1, 'At least one candidate strength must be identified'),
  skillGaps: z.array(skillGapItemSchema).default([]),
  technicalQuestions: z
    .array(technicalQuestionItemSchema)
    .min(5, 'At least 5 technical questions must be provided')
    .max(30, 'Cannot exceed 30 technical questions'),
  behavioralQuestions: z
    .array(behavioralQuestionItemSchema)
    .min(3, 'At least 3 behavioral questions must be provided')
    .max(25, 'Cannot exceed 25 behavioral questions'),
  preparationRoadmap: z
    .array(roadmapDayItemSchema)
    .min(3, 'At least 3 roadmap days must be provided')
    .max(14, 'Roadmap cannot exceed 14 days'),
  aiAnalysis: z.string().default(''),
});

/**
 * Parses and validates raw AI output against the schema
 */
export const validateAiResponse = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('AI output is empty or not a valid JSON object.');
  }

  const result = aiResponseSchema.safeParse(data);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    throw new Error(`AI response failed schema validation: ${errorDetails}`);
  }

  return result.data;
};

