import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import InterviewReport from './src/models/InterviewReport.js';
import mongoose from 'mongoose';
import { generateToken } from './src/utils/token.js';

const TEST_PORT = 5056;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runInterviewTests() {
  console.log('🧪 Starting HireNex Interview Report REST API Verification...\n');

  await connectDB();

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

      // 1. Setup Test Users
      const emailUserA = 'user_alpha@hirenex.dev';
      const emailUserB = 'user_beta@hirenex.dev';

      await User.deleteMany({ email: { $in: [emailUserA, emailUserB] } });

      const userA = await User.create({
        username: 'userAlpha',
        email: emailUserA,
        password: 'Password123!',
      });

      const userB = await User.create({
        username: 'userBeta',
        email: emailUserB,
        password: 'Password123!',
      });

      // Cleanup any previous interview records
      await InterviewReport.deleteMany({ user: { $in: [userA._id, userB._id] } });

      const tokenA = generateToken(userA._id);
      const tokenB = generateToken(userB._id);

      const authHeadersA = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      };

      const authHeadersB = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      };

      let createdReportId = null;

      // --- TEST 1: Reject unauthenticated requests ---
      console.log('--- 1. Authentication Guard ---');
      const unauthRes = await fetch(`${BASE_URL}/api/interviews`);
      assert(
        unauthRes.status === 401,
        'Reject unauthenticated GET /api/interviews with 401'
      );

      const unauthPostRes = await fetch(`${BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: 'Backend Engineer',
          jobDescription: 'Seeking an experienced Node.js and Express developer.',
        }),
      });
      assert(
        unauthPostRes.status === 401,
        'Reject unauthenticated POST /api/interviews with 401'
      );

      // --- TEST 2: Validate Request Body via Zod ---
      console.log('\n--- 2. Request Validation ---');
      const badBodyRes = await fetch(`${BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: authHeadersA,
        body: JSON.stringify({
          // Missing jobTitle and jobDescription is too short
          jobDescription: 'Short',
        }),
      });
      assert(
        badBodyRes.status === 400,
        'Reject missing jobTitle and short jobDescription with 400'
      );

      // --- TEST 3: Create an Interview Report ---
      console.log('\n--- 3. Create Interview Report ---');
      const createRes = await fetch(`${BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: authHeadersA,
        body: JSON.stringify({
          jobTitle: 'Senior Full-Stack Engineer',
          companyName: 'Tech Innovations Corp',
          jobDescription:
            'Architect scalable MERN applications, manage MongoDB queries, and design secure RESTful APIs.',
          selfDescription:
            '5 years developing with React, Node.js, Express, and distributed database systems.',
          resumeFileName: 'alice_fullstack_resume.pdf',
          resumeText: 'Full-stack software engineer with deep React and Node experience.',
        }),
      });

      const createData = await createRes.json();
      assert(createRes.status === 201, 'POST /api/interviews returns 201 Created');
      assert(createData.success === true, 'Response contains success: true');
      assert(
        createData.data.jobTitle === 'Senior Full-Stack Engineer',
        'Job title matches input payload'
      );
      assert(
        createData.data.status === 'pending',
        'Initial report status defaults to pending'
      );
      assert(
        createData.data.matchScore === 0,
        'Initial matchScore defaults to 0'
      );
      assert(
        createData.data.user === userA._id.toString(),
        'Report is correctly associated with User A'
      );

      createdReportId = createData.data._id;

      // --- TEST 4: Fetch All Reports for User A ---
      console.log('\n--- 4. Fetch User Reports ---');
      const listResA = await fetch(`${BASE_URL}/api/interviews`, {
        headers: authHeadersA,
      });
      const listDataA = await listResA.json();
      assert(listResA.status === 200, 'GET /api/interviews returns 200');
      assert(listDataA.count === 1, 'User A has exactly 1 report');
      assert(
        listDataA.data[0]._id === createdReportId,
        'List contains created report'
      );

      // User B should have 0 reports
      const listResB = await fetch(`${BASE_URL}/api/interviews`, {
        headers: authHeadersB,
      });
      const listDataB = await listResB.json();
      assert(listResB.status === 200, 'User B GET /api/interviews returns 200');
      assert(listDataB.count === 0, 'User B sees 0 reports (tenant isolation)');

      // --- TEST 5: Fetch Report by ID ---
      console.log('\n--- 5. Fetch Single Report by ID ---');
      const getSingleRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          headers: authHeadersA,
        }
      );
      const getSingleData = await getSingleRes.json();
      assert(getSingleRes.status === 200, 'GET /api/interviews/:id returns 200');
      assert(
        getSingleData.data._id === createdReportId,
        'Fetched report matches ID'
      );

      // --- TEST 6: Prevent Access to Another User\'s Report ---
      console.log('\n--- 6. Multi-Tenant Authorization Security ---');
      const crossAccessGetRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          headers: authHeadersB, // User B attempting to view User A's report
        }
      );
      assert(
        crossAccessGetRes.status === 404,
        'User B accessing User A report returns 404 (does not expose private resource)'
      );

      const crossAccessPatchRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          method: 'PATCH',
          headers: authHeadersB, // User B attempting to update User A's report
          body: JSON.stringify({ matchScore: 99 }),
        }
      );
      assert(
        crossAccessPatchRes.status === 404,
        'User B modifying User A report returns 404'
      );

      const crossAccessDeleteRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          method: 'DELETE',
          headers: authHeadersB, // User B attempting to delete User A's report
        }
      );
      assert(
        crossAccessDeleteRes.status === 404,
        'User B deleting User A report returns 404'
      );

      // --- TEST 7: Validate MongoDB Object IDs ---
      console.log('\n--- 7. Invalid ObjectId Validation ---');
      const invalidIdRes = await fetch(
        `${BASE_URL}/api/interviews/invalid-id-xyz123`,
        {
          headers: authHeadersA,
        }
      );
      assert(
        invalidIdRes.status === 400,
        'Invalid ObjectId format returns 400 Bad Request'
      );

      // --- TEST 8: Nonexistent Valid ObjectId ---
      console.log('\n--- 8. Nonexistent Report 404 ---');
      const nonExistentId = new mongoose.Types.ObjectId();
      const notFoundRes = await fetch(
        `${BASE_URL}/api/interviews/${nonExistentId}`,
        {
          headers: authHeadersA,
        }
      );
      assert(
        notFoundRes.status === 404,
        'Nonexistent valid ObjectId returns 404 Not Found'
      );

      // --- TEST 9: Update Allowed Fields via PATCH ---
      console.log('\n--- 9. Update Report Fields via PATCH ---');
      const patchRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          method: 'PATCH',
          headers: authHeadersA,
          body: JSON.stringify({
            matchScore: 92,
            status: 'completed',
            strengths: ['Deep MERN Knowledge', 'Microservices Architecture'],
            technicalQuestions: [
              {
                question: 'Explain MongoDB replica set election mechanism',
                difficulty: 'advanced',
              },
            ],
            // Attempt to maliciously change owner to User B
            user: userB._id.toString(),
          }),
        }
      );

      const patchData = await patchRes.json();
      assert(patchRes.status === 200, 'PATCH /api/interviews/:id returns 200');
      assert(patchData.data.matchScore === 92, 'matchScore updated to 92');
      assert(patchData.data.status === 'completed', 'status updated to completed');
      assert(
        patchData.data.strengths.length === 2,
        'Strengths array populated correctly'
      );
      assert(
        patchData.data.user === userA._id.toString(),
        'Malicious user owner reassignment was blocked'
      );

      // --- TEST 10: Delete Report ---
      console.log('\n--- 10. Delete Report ---');
      const deleteRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          method: 'DELETE',
          headers: authHeadersA,
        }
      );
      assert(
        deleteRes.status === 200,
        'DELETE /api/interviews/:id returns 200'
      );

      // Verify deletion from DB
      const verifyDeleteRes = await fetch(
        `${BASE_URL}/api/interviews/${createdReportId}`,
        {
          headers: authHeadersA,
        }
      );
      assert(
        verifyDeleteRes.status === 404,
        'Deleted report no longer exists (returns 404)'
      );

      // Cleanup test data
      await InterviewReport.deleteMany({ user: { $in: [userA._id, userB._id] } });
      await User.deleteMany({ email: { $in: [emailUserA, emailUserB] } });

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

runInterviewTests();

