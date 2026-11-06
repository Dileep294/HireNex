import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { generateToken } from './src/utils/token.js';
import { UPLOAD_DIR } from './src/middleware/uploadMiddleware.js';

const TEST_PORT = 5057;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runResumeTests() {
  console.log('🧪 Starting HireNex Secure Resume Upload & Extraction Verification...\n');

  await connectDB();

  // Helper to generate real PDFs via headless chromium
  console.log('Generating test PDF artifacts using Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Valid resume PDF
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>Elena Rostova</h1>
        <p>Email: elena.rostova@hirenex.dev | Phone: +1-555-234-5678</p>
        <h2>Technical Skills</h2>
        <p>JavaScript (ES6+), React.js, Node.js, Express, MongoDB, Docker, AWS, Tailwind CSS</p>
        <h2>Work Experience</h2>
        <p>Senior Full-Stack Engineer at CloudScale Solutions (2022 - Present)</p>
        <p>Engineered microservices processing 10M+ daily events with 99.99% uptime.</p>
        <h2>Education</h2>
        <p>B.S. in Computer Science - University of Technology (2018 - 2022)</p>
        <h2>Projects</h2>
        <p>HireNex Platform - Full stack AI mock interview platform built with MERN.</p>
        <h2>Certifications</h2>
        <p>AWS Certified Solutions Architect Associate (2024)</p>
      </body>
    </html>
  `, { waitUntil: 'networkidle0' });
  const validPdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));

  // 2. Blank PDF without extractable text (whitespace only)
  const blankPage = await browser.newPage();
  await blankPage.setContent(
    '<!DOCTYPE html><html><body><p style="font-size:10px;">   \t  \n   </p></body></html>',
    { waitUntil: 'networkidle0' }
  );
  const blankPdfBuffer = Buffer.from(await blankPage.pdf({ format: 'A4' }));

  await browser.close();
  console.log('Test PDF artifacts generated successfully.\n');

  const server = app.listen(TEST_PORT, async () => {
    try {
      let passed = 0;
      let failed = 0;

      const assert = (condition, title) => {
        if (condition) {
          console.log(`  ✅ [PASS] ${title}`);
          passed++;
        } else {
          console.error(`  ❌ [FAIL] ${title}`);
          failed++;
        }
      };

      // Create test user and token
      const testEmail = 'resume_tester@hirenex.dev';
      await User.deleteMany({ email: testEmail });
      const testUser = await User.create({
        username: 'resumeTester',
        email: testEmail,
        password: 'SecurePassword123!',
      });
      const token = generateToken(testUser._id);
      const authHeader = { Authorization: `Bearer ${token}` };

      let uploadedFilename = null;

      // --- TEST 1: Unauthenticated Upload ---
      console.log('--- 1. Authentication Protection ---');
      const unauthForm = new FormData();
      unauthForm.append(
        'resume',
        new Blob([validPdfBuffer], { type: 'application/pdf' }),
        'my_resume.pdf'
      );
      const unauthRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        body: unauthForm,
      });
      assert(unauthRes.status === 401, 'Unauthenticated upload rejected with 401');

      // --- TEST 2: Invalid File Extension (.txt) ---
      console.log('\n--- 2. File Extension Validation ---');
      const badExtForm = new FormData();
      badExtForm.append(
        'resume',
        new Blob([Buffer.from('Some plain text resume')], { type: 'text/plain' }),
        'resume.txt'
      );
      const badExtRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: badExtForm,
      });
      assert(badExtRes.status === 400, 'Invalid file extension (.txt) rejected with 400');

      // --- TEST 3: Invalid MIME Type ---
      console.log('\n--- 3. MIME Type Validation ---');
      const badMimeForm = new FormData();
      badMimeForm.append(
        'resume',
        new Blob([validPdfBuffer], { type: 'application/octet-stream' }),
        'resume.pdf'
      );
      const badMimeRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: badMimeForm,
      });
      assert(badMimeRes.status === 400, 'Non-PDF MIME type rejected with 400');

      // --- TEST 4: File Larger Than 5 MB ---
      console.log('\n--- 4. File Size Limits (Max 5 MB) ---');
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, '%PDF-1.4\nLarge fake data');
      const oversizedForm = new FormData();
      oversizedForm.append(
        'resume',
        new Blob([oversizedBuffer], { type: 'application/pdf' }),
        'large_resume.pdf'
      );
      const oversizedRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: oversizedForm,
      });
      const oversizedData = await oversizedRes.json();
      assert(oversizedRes.status === 400, 'File larger than 5 MB rejected with 400');
      assert(
        oversizedData.message && oversizedData.message.includes('5 MB'),
        'Returns informative 5 MB size limit error message'
      );

      // --- TEST 5: Corrupted PDF Signature / Bytes ---
      console.log('\n--- 5. Corrupted PDF Rejection ---');
      const corruptedBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\n');
      const corruptedForm = new FormData();
      corruptedForm.append(
        'resume',
        new Blob([corruptedBuffer], { type: 'application/pdf' }),
        'corrupted.pdf'
      );
      const corruptedRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: corruptedForm,
      });
      assert(corruptedRes.status === 400, 'Corrupted PDF rejected with 400');

      // --- TEST 6: Empty PDF File (0 bytes) ---
      console.log('\n--- 6. Empty PDF Rejection ---');
      const emptyForm = new FormData();
      emptyForm.append(
        'resume',
        new Blob([Buffer.alloc(0)], { type: 'application/pdf' }),
        'empty.pdf'
      );
      const emptyRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: emptyForm,
      });
      assert(emptyRes.status === 400, 'Empty PDF (0 bytes) rejected with 400');

      // --- TEST 7: PDF Without Extractable Text ---
      console.log('\n--- 7. PDF Without Extractable Text ---');
      const blankForm = new FormData();
      blankForm.append(
        'resume',
        new Blob([blankPdfBuffer], { type: 'application/pdf' }),
        'blank.pdf'
      );
      const blankRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: blankForm,
      });
      const blankData = await blankRes.json();
      assert(blankRes.status === 400, 'PDF without text rejected with 400');
      assert(
        blankData.message &&
          (blankData.message.includes('no extractable text') ||
            blankData.message.includes('unreadable PDF')),
        'Explains that text-based PDF is required rather than empty/image'
      );

      // --- TEST 8: Successful Valid PDF Upload & Text Extraction ---
      console.log('\n--- 8. Successful Upload & Text Extraction ---');
      const validForm = new FormData();
      validForm.append(
        'resume',
        new Blob([validPdfBuffer], { type: 'application/pdf' }),
        'Elena_Rostova_Resume.pdf'
      );
      const validRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: validForm,
      });
      const validData = await validRes.json();
      assert(validRes.status === 200, 'Valid PDF upload returns 200 OK');
      assert(validData.success === true, 'Response contains success: true');
      assert(Boolean(validData.data.fileName), 'Generated safe unique filename returned');
      assert(
        validData.data.originalName === 'Elena_Rostova_Resume.pdf',
        'Original filename is sanitized'
      );
      assert(
        validData.data.extractedText.includes('Elena Rostova'),
        'Extracted text contains candidate name'
      );
      assert(
        validData.data.extractedText.includes('elena.rostova@hirenex.dev'),
        'Extracted text contains candidate email'
      );

      uploadedFilename = validData.data.fileName;

      // Verify file exists in private upload directory
      const storedPath = path.join(UPLOAD_DIR, uploadedFilename);
      assert(fs.existsSync(storedPath), 'Uploaded file stored in private backend directory');

      // --- TEST 9: Structured Metadata Extraction ---
      console.log('\n--- 9. Structured Metadata Verification ---');
      assert(
        validData.data.parsedData.email === 'elena.rostova@hirenex.dev',
        'Parsed email matches'
      );
      assert(
        validData.data.parsedData.name === 'Elena Rostova',
        'Parsed candidate name matches'
      );
      assert(
        validData.data.parsedData.skills.length > 0,
        'Skills section extracted'
      );
      assert(
        validData.data.parsedData.experience.length > 0,
        'Experience section extracted'
      );

      // --- TEST 10: Resume Replacement / Cleanup ---
      console.log('\n--- 10. File Cleanup & Deletion ---');
      const deleteRes = await fetch(
        `${BASE_URL}/api/resumes/${uploadedFilename}`,
        {
          method: 'DELETE',
          headers: authHeader,
        }
      );
      assert(deleteRes.status === 200, 'DELETE /api/resumes/:fileName returns 200');
      assert(!fs.existsSync(storedPath), 'File unlinked from backend disk on cleanup');

      // Clean up test user
      await User.deleteMany({ email: testEmail });

      console.log('\n=============================================');
      console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
      console.log('=============================================\n');

      server.close(() => {
        mongoose.connection.close().then(() => {
          process.exit(failed > 0 ? 1 : 0);
        });
      });
    } catch (err) {
      console.error('Test run failed with error:', err);
      server.close(() => {
        mongoose.connection.close().then(() => {
          process.exit(1);
        });
      });
    }
  });
}

runResumeTests();
