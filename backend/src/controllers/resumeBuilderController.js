import { generatePdfFromResumeData } from '../services/pdfService.js';
import { optimizeResumeForJobDescription } from '../services/aiResumeOptimizerService.js';

/**
 * @route   POST /api/resumes/generate-pdf
 * @desc    Generate an ATS-optimized PDF resume using Puppeteer
 * @access  Private (Protected)
 */
export const generateResumePdf = async (req, res, next) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData || !resumeData.personalInfo || !resumeData.personalInfo.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume data. Full name and personal information are required.',
      });
    }

    const pdfBuffer = await generatePdfFromResumeData(resumeData);

    const safeName = resumeData.personalInfo.fullName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50) || 'Resume';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_HireNex_Resume.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error('[ResumeBuilder] PDF Generation failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF resume. Please verify input data and try again.',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/resumes/ai-optimize
 * @desc    Analyze resume against a target job description and suggest ATS improvements
 * @access  Private (Protected)
 */
export const optimizeResume = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Target job description must be at least 20 characters long.',
      });
    }

    if (!resumeData) {
      return res.status(400).json({
        success: false,
        message: 'Resume data is required for ATS optimization.',
      });
    }

    const customAiClient = req.app?.locals?.customAiClient || null;

    const optimization = await optimizeResumeForJobDescription({
      resumeData,
      jobDescription,
      customAiClient,
    });

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed against job description successfully',
      data: optimization,
    });
  } catch (error) {
    console.error('[ResumeBuilder] AI Optimization failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize resume against job description.',
    });
  }
};
