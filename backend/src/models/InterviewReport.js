import mongoose from 'mongoose';

const interviewReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    selfDescription: {
      type: String,
      trim: true,
      default: '',
    },
    resumeFileName: {
      type: String,
      trim: true,
      default: '',
    },
    resumeText: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      default: 0,
      min: [0, 'Match score cannot be less than 0'],
      max: [100, 'Match score cannot exceed 100'],
    },
    scoreExplanation: {
      type: String,
      default: '',
    },
    strengths: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    skillGaps: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    technicalQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    behavioralQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    preparationRoadmap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    aiAnalysis: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: '{VALUE} is not a valid report status',
      },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for querying user reports in reverse chronological order
interviewReportSchema.index({ user: 1, createdAt: -1 });
// Compound index for status-filtered queries
interviewReportSchema.index({ user: 1, status: 1 });
// Compound index for match score sorting
interviewReportSchema.index({ user: 1, matchScore: -1 });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReport;

