import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import InterviewReport from './src/models/InterviewReport.js';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import { createMockAiResponse } from './test-gemini.js';
import { generateToken } from './src/utils/token.js';

const TEST_PORT = 5058;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runPhase7FlowTest() {
  console.log('🧪 Starting HireNex Phase 7 End-to-End Generation & Flow Verification...\n');

  await connectDB();

  // 1. Prepare headless PDF resume
  console.log('Generating test PDF resume artifact...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Marcus Vance</h1>
        <p>Email: marcus.vance@hirenex.dev | Phone: +1-555-987-6543</p>
        <h2>Technical Skills</h2>
        <p>Distributed Systems, React, Node.js, Express, MongoDB, Kubernetes, AWS, Redis</p>
        <h2>Work Experience</h2>
        <p>Staff Cloud Architect at ScaleStream (2020 - Present)</p>
        <p>Designed fault-tolerant streaming microservices serving 50M concurrent users.</p>
        <h2>Education</h2>
        <p>M.S. in Software Engineering - MIT (2018 - 2020)</p>
      </body>
    </html>
  `, { waitUntil: 'networkidle0' });
  const resumePdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
  await browser.close();

  // Configure app locals to use mock AI client for reliable deterministic testing
  const mockAiOutput = createMockAiResponse({
    matchScore: 92,
    scoreExplanation:
      'Candidate shows exemplary alignment with high-concurrency cloud architecture.',
  });

  let shouldSimulateAiFailure = false;

  app.locals.customAiClient = {
    models: {
      generateContent: async () => {
        if (shouldSimulateAiFailure) {
          const err = new Error('Simulated upstream AI capacity overload (503)');
          err.status = 503;
          throw err;
        }
        return {
          text: JSON.stringify(mockAiOutput),
        };
      },
    },
  };

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

      const testEmail = 'marcus_candidate@hirenex.dev';
      await User.deleteMany({ email: testEmail });

      // Step 1: User Login / Authentication
      console.log('--- Step 1: Authentication & User Setup ---');
      const candidateUser = await User.create({
        username: 'marcusVance',
        email: testEmail,
        password: 'Password123!',
      });
      const token = generateToken(candidateUser._id);
      const authHeaders = {
        Authorization: `Bearer ${token}`,
      };
      assert(Boolean(token), 'Candidate authenticated and JWT token generated');

      // Step 2: Upload Resume
      console.log('\n--- Step 2: Resume Upload ---');
      const resumeForm = new FormData();
      resumeForm.append(
        'resume',
        new Blob([resumePdfBuffer], { type: 'application/pdf' }),
        'Marcus_Vance_Resume.pdf'
      );

      const uploadRes = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: resumeForm,
      });
      const uploadData = await uploadRes.json();
      assert(uploadRes.status === 200, 'POST /api/resumes/upload returns 200');
      assert(Boolean(uploadData.data?.fileName), 'Resume assigned safe filename');
      assert(
        uploadData.data?.extractedText.includes('Marcus Vance'),
        'Resume text extracted successfully'
      );

      const uploadedResumeFileName = uploadData.data.fileName;

      // Step 3: Test Validation & Invalid Inputs
      console.log('\n--- Step 3: Input Validation on /api/interviews/generate ---');
      const missingJobTitleRes = await fetch(`${BASE_URL}/api/interviews/generate`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: '', // Missing
          jobDescription: 'Architecting high-scale distributed services.',
          resumeFileName: uploadedResumeFileName,
        }),
      });
      assert(missingJobTitleRes.status === 400, 'Rejects empty job title with 400');

      const noProfileRes = await fetch(`${BASE_URL}/api/interviews/generate`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: 'Staff Engineer',
          jobDescription: 'Architecting high-scale distributed services.',
          // No resume and no selfDescription
        }),
      });
      assert(noProfileRes.status === 400, 'Rejects request with no resume or self-description');

      // Step 4: Test Gemini Failure & Non-Stuck Status
      console.log('\n--- Step 4: Graceful AI Failure Handling ---');
      shouldSimulateAiFailure = true;
      const failRes = await fetch(`${BASE_URL}/api/interviews/generate`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: 'Staff Engineer',
          companyName: 'Netflix',
          jobDescription: 'Design resilient streaming pipelines and microservices.',
          resumeFileName: uploadedResumeFileName,
        }),
      });
      const failData = await failRes.json();
      assert(failRes.status === 400, 'Failed AI generation returns 400');
      assert(
        Boolean(failData.data?.reportId),
        'Returns reportId for tracking failure status'
      );

      // Verify report in DB is marked as 'failed' (NOT stuck in 'processing')
      const failedDbReport = await InterviewReport.findById(failData.data.reportId);
      assert(
        failedDbReport && failedDbReport.status === 'failed',
        'Database record is safely marked as "failed"'
      );

      shouldSimulateAiFailure = false; // Reset for success run

      // Step 5: Successful Interview Plan Generation
      console.log('\n--- Step 5: Successful AI Generation & Storage ---');
      const generateRes = await fetch(`${BASE_URL}/api/interviews/generate`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: 'Staff Cloud Infrastructure Engineer',
          companyName: 'Netflix',
          jobDescription:
            'Seeking a Staff Engineer to architect multi-region high-concurrency streaming services with Node.js, Kubernetes, and MongoDB.',
          resumeFileName: uploadedResumeFileName,
          selfDescription:
            'Extensive background in low-latency event processing, caching topologies, and team mentorship.',
        }),
      });
      const generateData = await generateRes.json();

      assert(generateRes.status === 201, 'POST /api/interviews/generate returns 201 Created');
      assert(generateData.success === true, 'Response contains success: true');
      assert(
        generateData.data.status === 'completed',
        'Report status is updated to completed'
      );
      assert(generateData.data.matchScore === 92, 'Match score matches AI evaluation (92)');
      assert(
        generateData.data.technicalQuestions.length === 15,
        'Saved exactly 15 technical questions'
      );
      assert(
        generateData.data.behavioralQuestions.length === 10,
        'Saved exactly 10 behavioral questions'
      );
      assert(
        generateData.data.preparationRoadmap.length === 7,
        'Saved exactly 7 roadmap sprint days'
      );

      const generatedReportId = generateData.data._id;

      // Step 6: Verify MongoDB Record & Ownership
      console.log('\n--- Step 6: Verify MongoDB Storage & User Association ---');
      const dbReport = await InterviewReport.findById(generatedReportId);
      assert(Boolean(dbReport), 'Report successfully queried from MongoDB');
      assert(
        dbReport.user.toString() === candidateUser._id.toString(),
        'Report owner matches authenticated candidate ID'
      );
      assert(
        dbReport.companyName === 'Netflix',
        'Company name matches input'
      );

      // Step 7: Verify Report Details API (for redirect destination)
      console.log('\n--- Step 7: Verify GET /api/interviews/:id for Report Page ---');
      const getReportRes = await fetch(
        `${BASE_URL}/api/interviews/${generatedReportId}`,
        {
          headers: authHeaders,
        }
      );
      const getReportData = await getReportRes.json();
      assert(getReportRes.status === 200, 'GET /api/interviews/:id returns 200');
      assert(
        getReportData.data._id === generatedReportId,
        'Returned report ID matches generated report'
      );
      assert(
        getReportData.data.matchScore === 92,
        'Returned report contains matchScore'
      );

      // Step 8: Verify Report History Listing
      console.log('\n--- Step 8: Verify GET /api/interviews Recent History ---');
      const historyRes = await fetch(`${BASE_URL}/api/interviews`, {
        headers: authHeaders,
      });
      const historyData = await historyRes.json();
      assert(historyRes.status === 200, 'GET /api/interviews returns 200');
      assert(historyData.count >= 1, 'History contains candidate reports');
      assert(
        historyData.data[0]._id === generatedReportId,
        'Newest generated report is at the top of the history list'
      );

      // Cleanup
      await InterviewReport.deleteMany({ user: candidateUser._id });
      await User.deleteMany({ email: testEmail });
      await fetch(`${BASE_URL}/api/resumes/${uploadedResumeFileName}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

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

runPhase7FlowTest();

