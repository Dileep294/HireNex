import { z } from 'zod';

export const experienceItemSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required'),
  company: z.string().trim().min(1, 'Company name is required'),
  location: z.string().trim().optional().default(''),
  startDate: z.string().trim().optional().default(''),
  endDate: z.string().trim().optional().default(''),
  current: z.boolean().optional().default(false),
  highlights: z.array(z.string().trim()).default([]),
});

export const educationItemSchema = z.object({
  degree: z.string().trim().min(1, 'Degree / field of study is required'),
  institution: z.string().trim().min(1, 'Institution name is required'),
  location: z.string().trim().optional().default(''),
  startDate: z.string().trim().optional().default(''),
  endDate: z.string().trim().optional().default(''),
  gpa: z.string().trim().optional().default(''),
  highlights: z.array(z.string().trim()).default([]),
});

export const projectItemSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  role: z.string().trim().optional().default(''),
  techStack: z.union([z.array(z.string()), z.string()]).optional().default([]),
  liveUrl: z.string().trim().optional().default(''),
  githubUrl: z.string().trim().optional().default(''),
  highlights: z.array(z.string().trim()).default([]),
});

export const certificationItemSchema = z.object({
  name: z.string().trim().min(1, 'Certification name is required'),
  issuer: z.string().trim().optional().default(''),
  date: z.string().trim().optional().default(''),
  credentialUrl: z.string().trim().optional().default(''),
});

export const resumeDataSchema = z.object({
  template: z.enum(['classic', 'modern', 'developer']).default('modern'),
  personalInfo: z.object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    email: z.string().trim().email('Invalid email address'),
    phone: z.string().trim().optional().default(''),
    location: z.string().trim().optional().default(''),
    jobTitle: z.string().trim().optional().default(''),
    linkedin: z.string().trim().optional().default(''),
    github: z.string().trim().optional().default(''),
    portfolio: z.string().trim().optional().default(''),
  }),
  summary: z.string().trim().optional().default(''),
  skills: z.union([
    z.array(z.string().trim()),
    z.record(z.array(z.string().trim())),
  ]).default([]),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  certifications: z.array(certificationItemSchema).default([]),
});

export const generatePdfSchema = z.object({
  resumeData: resumeDataSchema,
});

export const aiOptimizeSchema = z.object({
  resumeData: resumeDataSchema,
  jobDescription: z.string().trim().min(20, 'Job description must be at least 20 characters'),
});
