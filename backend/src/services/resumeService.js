import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { UPLOAD_DIR } from '../middleware/uploadMiddleware.js';

const MAX_EXTRACTED_CHARS = 50000;

/**
 * Validate that the file starts with the PDF magic number (%PDF-)
 * Hex: 25 50 44 46 2D
 */
export const validatePdfSignature = async (filePath) => {
  try {
    const fileHandle = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(5);
    await fileHandle.read(buffer, 0, 5, 0);
    await fileHandle.close();

    const signature = buffer.toString('utf8');
    return signature === '%PDF-';
  } catch (err) {
    return false;
  }
};

/**
 * Safely delete a file from the uploads directory
 */
export const deleteFileSafe = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`Warning: Failed to clean up file at ${filePath}:`, err.message);
  }
};

/**
 * Heuristic section extractor from resume text
 */
export const parseResumeMetadata = (text) => {
  const metadata = {
    name: null,
    email: null,
    phone: null,
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };

  if (!text) return metadata;

  // 1. Extract Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    metadata.email = emailMatch[0].toLowerCase();
  }

  // 2. Extract Phone Number
  const phoneRegex = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
    metadata.phone = phoneMatch[0].trim();
  }

  // 3. Extract Candidate Name (scan top 5 lines for a clean 2-4 word name)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('.com') &&
      !line.includes('www.') &&
      !/\d/.test(line) &&
      line.length >= 3 &&
      line.length <= 40
    ) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        metadata.name = line;
        break;
      }
    }
  }

  // 4. Section Analysis (Identify common sections by header keywords)
  const lowerText = text.toLowerCase();

  // Helper to slice text between two section headers
  const extractSectionContent = (headerKeywords) => {
    for (const keyword of headerKeywords) {
      const startIndex = lowerText.indexOf(keyword);
      if (startIndex !== -1) {
        const slice = text.slice(startIndex + keyword.length, startIndex + keyword.length + 800);
        return slice
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2 && !s.toLowerCase().startsWith('http'))
          .slice(0, 8);
      }
    }
    return [];
  };

  metadata.skills = extractSectionContent(['technical skills', 'skills & competencies', 'core competencies', 'skills:']);
  metadata.experience = extractSectionContent(['work experience', 'professional experience', 'employment history', 'experience:']);
  metadata.education = extractSectionContent(['education', 'academic background', 'degrees:']);
  metadata.projects = extractSectionContent(['projects', 'key projects', 'technical projects']);
  metadata.certifications = extractSectionContent(['certifications', 'licenses & certifications', 'certificates']);

  return metadata;
};

/**
 * Main PDF Text & Metadata Extraction Service
 */
export const extractTextFromPdf = async (filePath) => {
  const fileStats = await fs.promises.stat(filePath);
  if (fileStats.size === 0) {
    throw new Error('Uploaded PDF is empty.');
  }

  // 1. Verify Magic Number
  const isValidPdf = await validatePdfSignature(filePath);
  if (!isValidPdf) {
    throw new Error('Invalid or corrupted PDF file signature. File header does not match %PDF-.');
  }

  // 2. Parse PDF buffer
  const buffer = await fs.promises.readFile(filePath);
  let parsedData;
  try {
    parsedData = await pdfParse(buffer);
  } catch (parseErr) {
    throw new Error(`Corrupted or unreadable PDF: ${parseErr.message}`);
  }

  const rawText = parsedData?.text?.trim() || '';

  // 3. Ensure PDF contains extractable text
  if (!rawText || rawText.length === 0) {
    throw new Error(
      'Uploaded PDF contains no extractable text. Please provide a standard text-based PDF rather than a scanned image.'
    );
  }

  // 4. Apply character limit to protect against denial-of-service / memory abuse
  const cleanText = rawText.slice(0, MAX_EXTRACTED_CHARS);

  // 5. Extract structured candidate metadata
  const parsedMetadata = parseResumeMetadata(cleanText);

  return {
    rawText: cleanText,
    numPages: parsedData.numpages || 1,
    characterCount: cleanText.length,
    parsedMetadata,
  };
};

/**
 * Securely delete a resume by filename within the upload directory
 */
export const removeResumeByFilename = async (fileName) => {
  if (!fileName) return;

  // Strict basename sanitization prevents directory traversal (e.g. ../../)
  const safeFilename = path.basename(fileName);
  const targetPath = path.join(UPLOAD_DIR, safeFilename);

  // Confirm target stays within UPLOAD_DIR
  if (!targetPath.startsWith(UPLOAD_DIR)) {
    throw new Error('Unauthorized file path access attempt.');
  }

  await deleteFileSafe(targetPath);
};

