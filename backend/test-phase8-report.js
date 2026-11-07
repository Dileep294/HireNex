/**
 * Phase 8 End-to-End Interview Report Page Verification
 * Verifies that reports in MongoDB contain all required schema data,
 * multi-tenant security is strictly enforced on GET /api/interviews/:id,
 * and data structures seamlessly map to frontend InterviewReport.jsx.
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

async function runPhase8Tests() {
  console.log('\n🧪 Starting HireNex Phase 8 AI Interview Report Page Verification...\n');

  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hirenex_phase8_test';
  await mongoose.connect(MONGO_URI);
  console.log('✅ [MongoDB] Connected successfully for Phase 8 tests.');

  // Clean test collections
  await User.deleteMany({ email: { $regex: /@phase8test\.com$/ } });
  await InterviewReport.deleteMany({});

  const server = app.listen(0);
  const port = server.address().port;

  try {
    // 1. Create two test candidates for multi-tenant verification
    const candidateA = await User.create({
      username: 'candA',
      email: 'candA@phase8test.com',
      password: 'password123',
    });
    const tokenA = generateToken(candidateA._id);

    const candidateB = await User.create({
      username: 'candB',
      email: 'candB@phase8test.com',
      password: 'password123',
    });
    const tokenB = generateToken(candidateB._id);

    // 2. Populate a comprehensive completed Interview Report for Candidate A
    const mockReportData = {
      user: candidateA._id,
      jobTitle: 'Senior Full Stack Engineer (Cloud & AI)',
      companyName: 'NextGen AI Technologies',
      jobDescription: 'Seeking an expert senior full-stack engineer experienced in React, Node.js, microservices, and AI integrations.',
      selfDescription: '7+ years engineering enterprise web applications, GraphQL APIs, distributed caching with Redis, and React architectures.',
      matchScore: 89,
      scoreExplanation: 'Exceptional alignment across frontend architecture and backend distributed systems, with minor gaps in specialized PyTorch workflows.',
      strengths: [
        {
          skillOrArea: 'React & Modern Frontend Architecture',
          evidence: 'Architected large-scale component systems using Tailwind CSS, Redux, and modern Vite pipelines.',
          relevance: 'Directly powers NextGen AI user-facing dashboard performance.',
        },
        {
          skillOrArea: 'High-Concurrency Node.js Services',
          evidence: 'Built high-throughput Express and Redis microservices handling 25,000 requests/sec.',
          relevance: 'Addresses the core backend processing requirements.',
        },
      ],
      skillGaps: [
        {
          skill: 'PyTorch Model Serving',
          importance: 'High',
          explanation: 'Target position requires hosting and optimizing low-latency ML models in production.',
          suggestedLearning: ['TorchScript Optimization', 'Triton Inference Server', 'ONNX Runtime'],
        },
        {
          skill: 'Kubernetes Ingress Management',
          importance: 'Medium',
          explanation: 'Role oversees cloud-native deployments with custom ingress controllers.',
          suggestedLearning: ['Envoy Gateway', 'Traefik CRDs', 'Cert-Manager TLS'],
        },
      ],
      technicalQuestions: Array.from({ length: 15 }, (_, i) => ({
        question: `How do you optimize system performance under high load scenario #${i + 1}?`,
        difficulty: i < 5 ? 'Easy' : i < 11 ? 'Medium' : 'Hard',
        topic: i % 2 === 0 ? 'Distributed Systems' : 'Frontend Performance',
        detailedAnswer: `To optimize scenario #${i + 1}, implement tiered caching via Redis, database connection pooling, and optimistic UI rendering.`,
        explanation: 'Evaluates architectural judgment and latency reduction strategies under production scale.',
        relatedSkills: ['Redis', 'Node.js', 'PostgreSQL', 'Architecture'],
      })),
      behavioralQuestions: Array.from({ length: 10 }, (_, i) => ({
        question: `Describe a situation where a major deployment faced unexpected latency degradation #${i + 1}.`,
        evaluates: 'Crisis Management & Root Cause Analysis',
        suggestedStarStructure: {
          situation: 'Production API response times jumped from 80ms to 2.4s following a database schema migration.',
          task: 'Identify the regression root cause immediately and restore SLAs without losing transactions.',
          action: 'Analyzed slow query logs, identified missing index on composite key, applied concurrent migration, and deployed hotfix.',
          result: 'Restored p99 latency to 65ms with zero data loss within 14 minutes.',
        },
        exampleAnswer: 'During a Black Friday spike, our inventory service was throttled by database locks. I coordinated cross-functional triage...',
        tips: 'Lead with measurable business impact and emphasize team communication under pressure.',
      })),
      preparationRoadmap: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        topic: `Day ${i + 1}: Deep Dive into System Design & Core Concepts`,
        learningObjectives: ['Master distributed consensus', 'Review CAP theorem tradeoffs'],
        tasks: ['Read Dynamo paper chapter 4', 'Implement consistent hashing ring in JavaScript'],
        practiceActivities: ['Benchmark in-memory hash ring with 100,000 keys'],
        estimatedMinutes: 120,
      })),
      aiAnalysis: 'The candidate demonstrates competitive technical aptitude and strong executive presence.',
      status: 'completed',
    };

    const savedReport = await InterviewReport.create(mockReportData);

    console.log('--- 1. Report Retrieval by ID (GET /api/interviews/:id) ---');
    const fetchRes = await makeRequest({
      port,
      method: 'GET',
      path: `/api/interviews/${savedReport._id}`,
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(fetchRes.status === 200, 'GET /api/interviews/:id returns HTTP 200 OK');
    assert(fetchRes.body.success === true, 'Response payload contains success: true');
    assert(fetchRes.body.data._id === savedReport._id.toString(), 'Returned report ID matches requested ID');
    assert(fetchRes.body.data.jobTitle === 'Senior Full Stack Engineer (Cloud & AI)', 'Job title matches database record');
    assert(fetchRes.body.data.companyName === 'NextGen AI Technologies', 'Company name matches database record');
    assert(fetchRes.body.data.matchScore === 89, 'Match score is 89');
    assert(fetchRes.body.data.scoreExplanation.length > 20, 'Score explanation is preserved');

    console.log('\n--- 2. Schema Structure Verification for Report Page ---');
    assert(fetchRes.body.data.strengths.length === 2, 'Report contains 2 verified candidate strengths');
    assert(fetchRes.body.data.strengths[0].skillOrArea === 'React & Modern Frontend Architecture', 'Strength 1 has skillOrArea');
    assert(fetchRes.body.data.strengths[0].evidence.length > 10, 'Strength 1 has evidence');
    assert(fetchRes.body.data.strengths[0].relevance.length > 10, 'Strength 1 has target role relevance');

    assert(fetchRes.body.data.skillGaps.length === 2, 'Report contains 2 skill gaps');
    assert(fetchRes.body.data.skillGaps[0].importance === 'High', 'Skill gap 1 importance is High');
    assert(fetchRes.body.data.skillGaps[0].suggestedLearning.length === 3, 'Skill gap 1 contains 3 suggested learning topics');

    assert(fetchRes.body.data.technicalQuestions.length === 15, 'Report contains exactly 15 technical questions');
    assert(fetchRes.body.data.technicalQuestions[0].detailedAnswer.length > 20, 'Technical question 1 has detailed answer');
    assert(fetchRes.body.data.technicalQuestions[0].explanation.length > 10, 'Technical question 1 has interviewer signal');
    assert(fetchRes.body.data.technicalQuestions[0].relatedSkills.length > 0, 'Technical question 1 has related skills tags');

    assert(fetchRes.body.data.behavioralQuestions.length === 10, 'Report contains exactly 10 behavioral questions');
    assert(fetchRes.body.data.behavioralQuestions[0].evaluates.length > 5, 'Behavioral question 1 has evaluation criteria');
    assert(fetchRes.body.data.behavioralQuestions[0].suggestedStarStructure.situation.length > 10, 'STAR structure has Situation');
    assert(fetchRes.body.data.behavioralQuestions[0].suggestedStarStructure.task.length > 10, 'STAR structure has Task');
    assert(fetchRes.body.data.behavioralQuestions[0].suggestedStarStructure.action.length > 10, 'STAR structure has Action');
    assert(fetchRes.body.data.behavioralQuestions[0].suggestedStarStructure.result.length > 10, 'STAR structure has Result');
    assert(fetchRes.body.data.behavioralQuestions[0].tips.length > 5, 'Behavioral question 1 has actionable tips');

    assert(fetchRes.body.data.preparationRoadmap.length === 7, 'Report contains exactly 7-day preparation roadmap');
    assert(fetchRes.body.data.preparationRoadmap[0].estimatedMinutes === 120, 'Roadmap day 1 has estimated study minutes');
    assert(fetchRes.body.data.preparationRoadmap[0].tasks.length > 0, 'Roadmap day 1 has actionable tasks');

    console.log('\n--- 3. Error & Multi-Tenant Authorization Security ---');
    // Candidate B attempting to view Candidate A's report
    const unauthorizedRes = await makeRequest({
      port,
      method: 'GET',
      path: `/api/interviews/${savedReport._id}`,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(unauthorizedRes.status === 404, 'Candidate B accessing Candidate A report returns 404 Not Found (zero data leak)');

    // Unauthenticated request
    const unauthRes = await makeRequest({
      port,
      method: 'GET',
      path: `/api/interviews/${savedReport._id}`,
    });
    assert(unauthRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');

    // Invalid ObjectId format
    const invalidIdRes = await makeRequest({
      port,
      method: 'GET',
      path: '/api/interviews/not-a-valid-id',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(invalidIdRes.status === 400, 'Invalid ObjectId format returns 400 Bad Request');

    // Nonexistent valid ObjectId
    const nonexistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await makeRequest({
      port,
      method: 'GET',
      path: `/api/interviews/${nonexistentId}`,
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(notFoundRes.status === 404, 'Nonexistent report ID returns 404 Not Found');

    console.log('\n=============================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

  } finally {
    server.close();
    await User.deleteMany({ email: { $regex: /@phase8test\.com$/ } });
    await InterviewReport.deleteMany({});
    await mongoose.disconnect();
    console.log('⚠️  [MongoDB] Disconnected from database.');
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Fatal error during Phase 8 tests:', err);
  process.exit(1);
});
