/**
 * Phase 9 End-to-End Interview History, Search, Filter, Pagination & Stats Verification
 */

import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import InterviewReport from './src/models/InterviewReport.js';
import { generateToken } from './src/utils/token.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

function makeRequest({ port, method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase9Tests() {
  console.log('\n🧪 Starting HireNex Phase 9 Report History & Management Verification...\n');

  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hirenex_phase9_test';
  await mongoose.connect(MONGO_URI);
  console.log('✅ [MongoDB] Connected successfully for Phase 9 tests.');

  // Clean test collections
  await User.deleteMany({ email: { $regex: /@phase9test\.com$/ } });
  await InterviewReport.deleteMany({});

  const server = app.listen(0);
  const port = server.address().port;

  try {
    // 1. Setup two candidate accounts
    const userA = await User.create({
      username: 'candA9',
      email: 'candA9@phase9test.com',
      password: 'password123',
    });
    const tokenA = generateToken(userA._id);

    const userB = await User.create({
      username: 'candB9',
      email: 'candB9@phase9test.com',
      password: 'password123',
    });
    const tokenB = generateToken(userB._id);

    // 2. Create multiple reports for User A with varying attributes
    const report1 = await InterviewReport.create({
      user: userA._id,
      jobTitle: 'Senior React Architect',
      companyName: 'MetaCorp',
      jobDescription: 'Frontend architect role leading design system and performance engineering.',
      matchScore: 95,
      status: 'completed',
      technicalQuestions: Array.from({ length: 15 }, () => ({ question: 'Q', detailedAnswer: 'A' })),
      createdAt: new Date('2026-01-10T10:00:00Z'),
    });

    const report2 = await InterviewReport.create({
      user: userA._id,
      jobTitle: 'Backend Distributed Systems Engineer',
      companyName: 'CloudScale Inc',
      jobDescription: 'Golang and Node.js microservices handling heavy throughput.',
      matchScore: 78,
      status: 'completed',
      technicalQuestions: Array.from({ length: 15 }, () => ({ question: 'Q', detailedAnswer: 'A' })),
      createdAt: new Date('2026-01-15T10:00:00Z'),
    });

    const report3 = await InterviewReport.create({
      user: userA._id,
      jobTitle: 'Full Stack AI Engineer',
      companyName: 'AnthropicLabs',
      jobDescription: 'Full stack role deploying LLM agents and reactive UI.',
      matchScore: 88,
      status: 'processing',
      technicalQuestions: [],
      createdAt: new Date('2026-01-20T10:00:00Z'),
    });

    const report4 = await InterviewReport.create({
      user: userA._id,
      jobTitle: 'DevOps & SRE Specialist',
      companyName: 'InfraCloud',
      jobDescription: 'Kubernetes orchestration and terraform provisioning.',
      matchScore: 60,
      status: 'failed',
      technicalQuestions: [],
      createdAt: new Date('2026-01-25T10:00:00Z'),
    });

    // Report for User B (to test tenant isolation)
    await InterviewReport.create({
      user: userB._id,
      jobTitle: 'Mobile iOS Engineer',
      companyName: 'AppleVendor',
      jobDescription: 'SwiftUI development.',
      matchScore: 92,
      status: 'completed',
    });

    console.log('--- 1. Fetch All Reports (Default Behavior) ---');
    const allRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(allRes.status === 200, 'GET /api/interviews returns 200 OK');
    assert(Array.isArray(allRes.body.data), 'Returns data as an array');
    assert(allRes.body.data.length === 4, 'User A sees exactly 4 reports');
    assert(allRes.body.data[0].jobTitle === 'DevOps & SRE Specialist', 'Default sorts newest first');

    console.log('\n--- 2. Search Functionality ---');
    // Search by jobTitle
    const searchTitleRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?search=React',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(searchTitleRes.body.data.length === 1, 'Search "React" matches 1 report');
    assert(searchTitleRes.body.data[0].jobTitle === 'Senior React Architect', 'Correct job title matched');

    // Search by companyName
    const searchCompanyRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?search=CloudScale',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(searchCompanyRes.body.data.length === 1, 'Search "CloudScale" matches 1 report');
    assert(searchCompanyRes.body.data[0].companyName === 'CloudScale Inc', 'Correct company name matched');

    // Search with no results
    const noMatchRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?search=NonExistentRole123',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(noMatchRes.body.data.length === 0, 'Non-existent search term returns 0 results');

    console.log('\n--- 3. Status Filtering ---');
    const completedRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?status=completed',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(completedRes.body.data.length === 2, 'Filter status=completed returns 2 reports');

    const processingRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?status=processing',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(processingRes.body.data.length === 1, 'Filter status=processing returns 1 report');

    const failedRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?status=failed',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(failedRes.body.data.length === 1, 'Filter status=failed returns 1 report');

    console.log('\n--- 4. Sorting Functionality ---');
    // Sort oldest first
    const oldestRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?sort=oldest',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(oldestRes.body.data[0].jobTitle === 'Senior React Architect', 'Sort oldest returns oldest report first');

    // Sort highest match score first
    const highScoreRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?sort=score_desc',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(highScoreRes.body.data[0].matchScore === 95, 'Sort score_desc returns 95% report first');
    assert(highScoreRes.body.data[3].matchScore === 60, 'Sort score_desc returns 60% report last');

    // Sort lowest match score first
    const lowScoreRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?sort=score_asc',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(lowScoreRes.body.data[0].matchScore === 60, 'Sort score_asc returns 60% report first');

    console.log('\n--- 5. Pagination Functionality ---');
    // Page 1 with limit 2
    const page1Res = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?page=1&limit=2',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(page1Res.body.data.length === 2, 'Page 1 returns 2 records');
    assert(page1Res.body.total === 4, 'Reports total is 4');
    assert(page1Res.body.totalPages === 2, 'Total pages is 2');
    assert(page1Res.body.page === 1, 'Current page is 1');

    // Page 2 with limit 2
    const page2Res = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews?page=2&limit=2',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(page2Res.body.data.length === 2, 'Page 2 returns 2 records');
    assert(page2Res.body.page === 2, 'Current page is 2');
    assert(page2Res.body.data[0]._id !== page1Res.body.data[0]._id, 'Page 2 has distinct records from Page 1');

    console.log('\n--- 6. Aggregated Database Statistics (GET /api/interviews/stats) ---');
    const statsRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews/stats',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(statsRes.status === 200, 'GET /api/interviews/stats returns 200 OK');
    assert(statsRes.body.data.totalPlans === 4, 'Total plans matches real DB count (4)');
    assert(statsRes.body.data.completedPlans === 2, 'Completed plans matches real DB count (2)');
    // Avg score of completed reports (95 + 78) / 2 = 86.5 -> rounded to 87
    assert(statsRes.body.data.averageScore === 87, 'Average match score calculated correctly (87%)');
    assert(statsRes.body.data.technicalQuestionsGenerated === 30, 'Total technical questions calculated correctly (30)');

    console.log('\n--- 7. Delete Functionality (DELETE /api/interviews/:id) ---');
    const deleteRes = await makeRequest({
      port,
      method: 'DELETE',
      path: `/api/interviews/${report4._id}`,
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteRes.status === 200, 'DELETE /api/interviews/:id returns 200 OK');

    // Verify deleted report no longer accessible
    const checkDeletedRes = await makeRequest({
      port,
      method: 'GET',
      path: `/api/interviews/${report4._id}`,
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(checkDeletedRes.status === 404, 'Deleted report is no longer found (returns 404)');

    // Verify stats updated after deletion
    const statsAfterDelete = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews/stats',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(statsAfterDelete.body.data.totalPlans === 3, 'Total plans decremented to 3 after deletion');

    console.log('\n--- 8. Multi-Tenant User Isolation ---');
    // User B fetches their reports
    const userBReports = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(userBReports.body.data.length === 1, 'User B sees only their 1 report');
    assert(userBReports.body.data[0].jobTitle === 'Mobile iOS Engineer', 'User B sees only their own job title');

    // User B tries to delete User A's report
    const unauthorizedDelete = await makeRequest({
      port,
      method: 'DELETE',
      path: `/api/interviews/${report1._id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(unauthorizedDelete.status === 404, 'User B deleting User A report returns 404 (zero unauthorized modification)');

    console.log('\n=============================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

  } finally {
    server.close();
    await User.deleteMany({ email: { $regex: /@phase9test\.com$/ } });
    await InterviewReport.deleteMany({});
    await mongoose.disconnect();
    console.log('⚠️  [MongoDB] Disconnected from database.');
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch((err) => {
  console.error('Fatal error during Phase 9 tests:', err);
  process.exit(1);
});
