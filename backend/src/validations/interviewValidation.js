import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Middleware to validate MongoDB ObjectId in request params
 */
export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid report ID format: '${id}'`,
    });
  }

  next();
};

export const createInterviewSchema = z.object({
  jobTitle: z
    .string({ required_error: 'Job title is required' })
    .trim()
    .min(1, 'Job title cannot be empty')
    .max(150, 'Job title cannot exceed 150 characters'),
  companyName: z
    .string()
    .trim()
    .max(150, 'Company name cannot exceed 150 characters')
    .optional()
    .default(''),
  jobDescription: z
    .string({ required_error: 'Job description is required' })
    .trim()
    .min(10, 'Job description must be at least 10 characters long'),
  selfDescription: z.string().trim().optional().default(''),
  resumeFileName: z.string().trim().optional().default(''),
  resumeText: z.string().optional().default(''),
});

export const updateInterviewSchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(150).optional(),
    companyName: z.string().trim().max(150).optional(),
    jobDescription: z.string().trim().min(10).optional(),
    selfDescription: z.string().trim().optional(),
    resumeFileName: z.string().trim().optional(),
    resumeText: z.string().optional(),
    matchScore: z.number().min(0).max(100).optional(),
    strengths: z.array(z.string()).optional(),
    skillGaps: z.array(z.record(z.any())).optional(),
    technicalQuestions: z.array(z.record(z.any())).optional(),
    behavioralQuestions: z.array(z.record(z.any())).optional(),
    preparationRoadmap: z.array(z.record(z.any())).optional(),
    aiAnalysis: z.string().optional(),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  }); // Extra fields like user or _id are automatically stripped

export const generateInterviewSchema = z
  .object({
    jobTitle: z
      .string({ required_error: 'Job title is required' })
      .trim()
      .min(1, 'Job title cannot be empty')
      .max(150, 'Job title cannot exceed 150 characters'),
    companyName: z
      .string()
      .trim()
      .max(150, 'Company name cannot exceed 150 characters')
      .optional()
      .default(''),
    jobDescription: z
      .string({ required_error: 'Job description is required' })
      .trim()
      .min(10, 'Job description must be at least 10 characters long'),
    selfDescription: z.string().trim().optional().default(''),
    resumeFileName: z.string().trim().optional().default(''),
    resumeText: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      const hasResume =
        (data.resumeFileName && data.resumeFileName.trim().length > 0) ||
        (data.resumeText && data.resumeText.trim().length > 0);
      const hasSelfDesc =
        data.selfDescription && data.selfDescription.trim().length >= 10;
      return hasResume || hasSelfDesc;
    },
    {
      message:
        'Please provide either an uploaded resume or a self-description (minimum 10 characters).',
      path: ['candidateProfile'],
    }
  );
