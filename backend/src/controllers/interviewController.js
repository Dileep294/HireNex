import path from 'path';
import fs from 'fs';
import InterviewReport from '../models/InterviewReport.js';
import { UPLOAD_DIR } from '../middleware/uploadMiddleware.js';
import { extractTextFromPdf } from '../services/resumeService.js';
import { generateInterviewStrategy } from '../services/aiInterviewService.js';

/**
 * @route   POST /api/interviews/generate
 * @desc    Generate AI interview strategy using Gemini and persist to MongoDB
 * @access  Private (Protected)
 */
export const generateReport = async (req, res, next) => {
  let report = null;

  try {
    const {
      jobTitle,
      companyName,
      jobDescription,
      selfDescription,
      resumeFileName,
      resumeText: clientResumeText,
    } = req.body;

    let resumeText = clientResumeText || '';

    // If resumeFileName is provided and resumeText was not passed in body,
    // read and extract text from the authenticated user's uploaded file on disk
    if (resumeFileName && (!resumeText || resumeText.trim().length === 0)) {
      const safeFilename = path.basename(resumeFileName);
      const filePath = path.join(UPLOAD_DIR, safeFilename);

      if (fs.existsSync(filePath)) {
        try {
          const extraction = await extractTextFromPdf(filePath);
          resumeText = extraction.rawText;
        } catch (extractErr) {
          console.warn(
            `[Generate] Could not re-extract from ${safeFilename}: ${extractErr.message}`
          );
        }
      }
    }

    // 1. Create InterviewReport record with 'processing' status
    report = await InterviewReport.create({
      user: req.user._id,
      jobTitle,
      companyName: companyName || '',
      jobDescription,
      selfDescription: selfDescription || '',
      resumeFileName: resumeFileName || '',
      resumeText: resumeText || '',
      status: 'processing',
    });

    // 2. Call Gemini AI service (supports custom client injection for automated tests)
    const customAiClient = req.app?.locals?.customAiClient || null;
    const aiResult = await generateInterviewStrategy({
      jobTitle,
      companyName,
      jobDescription,
      resumeText,
      selfDescription,
      customAiClient,
    });

    // 3. Save validated structured output and update status to 'completed'
    report.matchScore = aiResult.matchScore;
    report.strengths = aiResult.strengths;
    report.skillGaps = aiResult.skillGaps;
    report.technicalQuestions = aiResult.technicalQuestions;
    report.behavioralQuestions = aiResult.behavioralQuestions;
    report.preparationRoadmap = aiResult.preparationRoadmap;
    report.aiAnalysis = aiResult.aiAnalysis || aiResult.scoreExplanation;
    report.status = 'completed';

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Interview strategy generated successfully',
      data: report,
    });
  } catch (err) {
    // Prevent leaving reports permanently stuck in 'processing'
    if (report && report._id) {
      try {
        report.status = 'failed';
        report.aiAnalysis = `Generation failed: ${err.message}`;
        await report.save();
      } catch (saveErr) {
        console.error('Failed to update report status to failed:', saveErr);
      }
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to generate interview strategy. Please try again.',
      data: report ? { reportId: report._id, status: 'failed' } : null,
    });
  }
};

/**
 * @route   POST /api/interviews
 * @desc    Create a new interview report record with pending status
 * @access  Private (Protected)
 */
export const createReport = async (req, res, next) => {
  try {
    const {
      jobTitle,
      companyName,
      jobDescription,
      selfDescription,
      resumeFileName,
      resumeText,
    } = req.body;

    const report = await InterviewReport.create({
      user: req.user._id,
      jobTitle,
      companyName,
      jobDescription,
      selfDescription,
      resumeFileName,
      resumeText,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Interview report created successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interviews
 * @desc    Fetch all interview reports belonging to the authenticated user
 * @access  Private (Protected)
 */
export const getReports = async (req, res, next) => {
  try {
    const reports = await InterviewReport.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: 'Interview reports retrieved successfully',
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interviews/:id
 * @desc    Fetch a specific interview report belonging to the authenticated user
 * @access  Private (Protected)
 */
export const getReportById = async (req, res, next) => {
  try {
    const report = await InterviewReport.findById(req.params.id);

    // Return 404 if report does not exist OR belongs to another user
    if (!report || report.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Interview report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview report retrieved successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/interviews/:id
 * @desc    Update allowed interview report fields when appropriate
 * @access  Private (Protected)
 */
export const updateReport = async (req, res, next) => {
  try {
    const report = await InterviewReport.findById(req.params.id);

    // Return 404 if report does not exist OR belongs to another user
    if (!report || report.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Interview report not found',
      });
    }

    // Never allow a user to change the owner or identity fields
    delete req.body.user;
    delete req.body._id;
    delete req.body.createdAt;
    delete req.body.updatedAt;

    Object.assign(report, req.body);
    const updatedReport = await report.save();

    res.status(200).json({
      success: true,
      message: 'Interview report updated successfully',
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/interviews/:id
 * @desc    Delete a specific report belonging to the authenticated user
 * @access  Private (Protected)
 */
export const deleteReport = async (req, res, next) => {
  try {
    const report = await InterviewReport.findById(req.params.id);

    // Return 404 if report does not exist OR belongs to another user
    if (!report || report.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Interview report not found',
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Interview report deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

