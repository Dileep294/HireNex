import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Private storage directory for uploaded resumes (never served statically)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes');

// Ensure directory exists synchronously on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage with completely randomized, safe unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate an unguessable unique filename using UUID + timestamp
    // Completely ignore client-supplied filename to prevent path traversal & injection
    const uniqueSuffix = `${crypto.randomUUID()}-${Date.now()}.pdf`;
    cb(null, uniqueSuffix);
  },
});

// File filter: strict validation of extension and declared MIME type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdfExt = ext === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf';

  if (!isPdfExt || !isPdfMime) {
    const error = new Error('Invalid file format. Only PDF files are accepted.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

// Multer upload instance with 5 MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
    files: 1, // Only 1 file per request
  },
});

/**
 * Express middleware wrapper to handle Multer upload errors gracefully
 */
export const handleResumeUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum allowed limit of 5 MB.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected upload field: '${err.field}'. Expected 'resume'.`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error occurred while uploading the file.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a PDF resume.',
      });
    }

    next();
  });
};

export { UPLOAD_DIR };

