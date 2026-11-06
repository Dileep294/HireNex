import path from 'path';
import {
  extractTextFromPdf,
  deleteFileSafe,
  removeResumeByFilename,
} from '../services/resumeService.js';

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload PDF resume, validate signature & extract text content
 * @access  Private (Protected)
 */
export const uploadResume = async (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No resume file uploaded.',
    });
  }

  try {
    // Extract text and candidate metadata from uploaded PDF
    const extractionResult = await extractTextFromPdf(file.path);

    // Sanitize original filename (prevent XSS, control characters or path traversal)
    const sanitizedOriginalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        fileName: file.filename,
        originalName: sanitizedOriginalName,
        extractedText: extractionResult.rawText,
        fileSize: file.size,
        parsedData: extractionResult.parsedMetadata,
      },
    });
  } catch (err) {
    // Immediate cleanup: remove invalid/unusable file from disk
    await deleteFileSafe(file.path);

    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to extract text from resume.',
    });
  }
};

/**
 * @route   DELETE /api/resumes/:fileName
 * @desc    Securely delete an uploaded resume file
 * @access  Private (Protected)
 */
export const deleteResume = async (req, res, next) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required for deletion.',
      });
    }

    await removeResumeByFilename(fileName);

    res.status(200).json({
      success: true,
      message: 'Resume file deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

