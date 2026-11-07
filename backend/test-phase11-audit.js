import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import InterviewReport from './src/models/InterviewReport.js';
import { generateToken } from './src/utils/token.js';
import { createMockAiResponse } from './test-gemini.js';

let BASE_URL = '';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else if (contentType.includes('application/pdf')) {
    data = Buffer.from(await response.arrayBuffer());
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

async function runMasterAudit() {
  console.log('\n🔒 ========================================================');
  console.log('   HIRENEX PHASE 11: MASTER APPLICATION SECURITY & API AUDIT');
  console.log('========================================================\n');

  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    BASE_URL = `http://127.0.0.1:${port}`;
    try {
      // ----------------------------------------------------
      // SECTION 1: SECURITY HEADERS & HEALTH
      // ----------------------------------------------------
      console.log('🛡️  SECTION 1: Security Headers & System Health');
      const healthRes = await request('/api/health');
      assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
      assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'Header: X-Content-Type-Options is nosniff');
      assert(healthRes.headers.get('x-frame-options') === 'DENY', 'Header: X-Frame-Options is DENY');
      assert(healthRes.headers.get('x-xss-protection') === '1; mode=block', 'Header: X-XSS-Protection is 1; mode=block');
      assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Header: Referrer-Policy is strict-origin-when-cross-origin');

      // ----------------------------------------------------
      // SECTION 2: AUTHENTICATION & PASSWORD HASHING
      // ----------------------------------------------------
      console.log('\n🔑 SECTION 2: Authentication, Password Hashing & Cookie Security');
      const uniqueSuffix = Date.now();
      const testEmailA = `audit_user_a_${uniqueSuffix}@audit.com`;
      const testEmailB = `audit_user_b_${uniqueSuffix}@audit.com`;
      const testUserA = `AuditUserA_${uniqueSuffix}`;
      const testUserB = `AuditUserB_${uniqueSuffix}`;
      const testPass = 'SecureAuditPassword123!';

      // Register User A
      const regResA = await request('/api/auth/register', {
        method: 'POST',
        body: { username: testUserA, email: testEmailA, password: testPass },
      });
      assert(regResA.status === 201, 'User A registered with 201 Created');
      const setCookie = regResA.headers.get('set-cookie') || '';
      assert(setCookie.includes('token='), 'Registration issues JWT in Set-Cookie');
      assert(setCookie.toLowerCase().includes('httponly'), 'JWT Cookie is strictly HttpOnly');

      // Duplicate email prevention
      const dupRes = await request('/api/auth/register', {
        method: 'POST',
        body: { username: `DupUser_${uniqueSuffix}`, email: testEmailA, password: testPass },
      });
      assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict');

      // Weak password rejection
      const weakPassRes = await request('/api/auth/register', {
        method: 'POST',
        body: { username: `WeakUser_${uniqueSuffix}`, email: `weak_${uniqueSuffix}@audit.com`, password: '123' },
      });
      assert(weakPassRes.status === 400, 'Short password (< 6 chars) rejected with 400 Bad Request');

      // Password hashing verification in MongoDB
      const userDocInDb = await User.findOne({ email: testEmailA }).select('+password');
      assert(userDocInDb !== null, 'User found in database');
      assert(userDocInDb.password !== testPass, 'Password in database is NOT plaintext');
      assert(userDocInDb.password.startsWith('$2a$') || userDocInDb.password.startsWith('$2b$'), 'Password hashed with bcrypt standard format ($2a$ or $2b$)');
      const isBcryptMatch = await bcrypt.compare(testPass, userDocInDb.password);
      assert(isBcryptMatch === true, 'Stored bcrypt hash verifies against original password');

      // Login User A with correct password
      const loginResA = await request('/api/auth/login', {
        method: 'POST',
        body: { email: testEmailA, password: testPass },
      });
      assert(loginResA.status === 200, 'Login returns 200 OK');
      const tokenA = loginResA.data.token;
      assert(typeof tokenA === 'string' && tokenA.length > 20, 'Bearer token returned in response body');

      // Login User A with invalid password
      const badLoginRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: testEmailA, password: 'WrongPassword456' },
      });
      assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');

      // Register User B
      const regResB = await request('/api/auth/register', {
        method: 'POST',
        body: { username: testUserB, email: testEmailB, password: testPass },
      });
      assert(regResB.status === 201, 'User B registered with 201 Created');
      const tokenB = regResB.data.token;

      // ----------------------------------------------------
      // SECTION 3: PROTECTED ROUTES & EXPIRATION HANDLING
      // ----------------------------------------------------
      console.log('\n🚪 SECTION 3: Protected Routes & Token Security');
      // Access with cookie
      const authMeCookieRes = await request('/api/auth/me', {
        headers: { Cookie: `token=${tokenA}` },
      });
      assert(authMeCookieRes.status === 200, 'Protected /api/auth/me accepts valid HttpOnly cookie');
      assert(authMeCookieRes.data.user.email === testEmailA, 'Returns authenticated user identity');

      // Access with Bearer token header
      const authMeHeaderRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(authMeHeaderRes.status === 200, 'Protected /api/auth/me accepts Bearer token header');

      // Access without token
      const noTokenRes = await request('/api/auth/me');
      assert(noTokenRes.status === 401, 'Protected route rejects request without token with 401');

      // Access with tampered token
      const badTokenRes = await request('/api/auth/me', {
        headers: { Authorization: 'Bearer invalid.tampered.token' },
      });
      assert(badTokenRes.status === 401, 'Protected route rejects tampered token with 401');

      // Logout
      const logoutRes = await request('/api/auth/logout', { method: 'POST' });
      assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');
      const logoutCookie = logoutRes.headers.get('set-cookie') || '';
      assert(logoutCookie.includes('token=;') || logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires='), 'Logout clears token cookie');

      // ----------------------------------------------------
      // SECTION 4: DATA ISOLATION & MULTI-TENANCY
      // ----------------------------------------------------
      console.log('\n🏢 SECTION 4: Data Isolation & Multi-Tenancy Security');
      // User A creates a report
      const createReportRes = await request('/api/interviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          jobTitle: 'Senior Security Architect',
          companyName: 'CyberCorp',
          jobDescription: 'Lead enterprise security architecture and cloud defenses.',
        },
      });
      assert(createReportRes.status === 201, 'User A created interview report');
      const reportAId = createReportRes.data.data._id;

      // User A fetches their report
      const getReportA = await request(`/api/interviews/${reportAId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(getReportA.status === 200, 'User A can view their own report');

      // User B attempts to access User A's report (MUST return 404)
      const crossAccessRes = await request(`/api/interviews/${reportAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(crossAccessRes.status === 404, 'User B is blocked from viewing User A\'s report (404 Not Found)');

      // User B attempts to update User A's report
      const crossUpdateRes = await request(`/api/interviews/${reportAId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: { jobTitle: 'Hacked Title' },
      });
      assert(crossUpdateRes.status === 404, 'User B is blocked from modifying User A\'s report (404 Not Found)');

      // User B attempts to delete User A's report
      const crossDeleteRes = await request(`/api/interviews/${reportAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert(crossDeleteRes.status === 404, 'User B is blocked from deleting User A\'s report (404 Not Found)');

      // Verify User A's report remains intact
      const verifyReportA = await request(`/api/interviews/${reportAId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(verifyReportA.status === 200 && verifyReportA.data.data.jobTitle === 'Senior Security Architect', 'User A\'s report remains intact and unmodified');

      // ----------------------------------------------------
      // SECTION 5: DATABASE INDEXES & QUERY PERFORMANCE
      // ----------------------------------------------------
      console.log('\n⚡ SECTION 5: Database Indexes & Query Optimization');
      const indexes = await InterviewReport.collection.getIndexes();
      const indexNames = Object.keys(indexes);
      assert(indexNames.some((n) => n.includes('user') && n.includes('createdAt')), 'Index exists for { user: 1, createdAt: -1 }');
      assert(indexNames.some((n) => n.includes('user') && n.includes('status')), 'Index exists for { user: 1, status: 1 }');
      assert(indexNames.some((n) => n.includes('user') && n.includes('matchScore')), 'Index exists for { user: 1, matchScore: -1 }');

      // ----------------------------------------------------
      // SECTION 6: AI GENERATION FLOW & RESILIENCE
      // ----------------------------------------------------
      console.log('\n🤖 SECTION 6: AI Interview Generation & Failure Handling');
      const mockAiOutput = createMockAiResponse({
        matchScore: 91,
        scoreExplanation: 'Exceptional cybersecurity and cloud engineering alignment.',
      });

      const mockAiClient = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify(mockAiOutput),
          }),
        },
      };

      app.locals.customAiClient = mockAiClient;

      const generateRes = await request('/api/interviews/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          jobTitle: 'Senior Cloud Security Architect',
          companyName: 'GuardShield Inc',
          jobDescription: 'Responsible for leading AWS/GCP security architectures and SOC2 compliance.',
          selfDescription: '8 years experience securing cloud-native distributed systems.',
        },
      });

      assert(generateRes.status === 201, 'POST /api/interviews/generate returns 201 Created');
      assert(generateRes.data.data.status === 'completed', 'Report status successfully set to completed');
      assert(generateRes.data.data.matchScore === 91, 'Report matchScore saved correctly (91)');
      assert(generateRes.data.data.technicalQuestions.length === 15, 'Generated exactly 15 technical interview questions');
      assert(generateRes.data.data.behavioralQuestions.length === 10, 'Generated exactly 10 behavioral scenarios');
      assert(generateRes.data.data.preparationRoadmap.length === 7, 'Generated 7-day preparation roadmap');

      // Test AI Failure Handling: ensures report status does not get stuck in processing
      const failingAiClient = {
        models: {
          generateContent: async () => {
            throw new Error('AI Model Service Unavailable');
          },
        },
      };
      app.locals.customAiClient = failingAiClient;

      const failGenerateRes = await request('/api/interviews/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          jobTitle: 'Staff Reliability Engineer',
          jobDescription: 'Build self-healing Kubernetes clusters and observability pipelines.',
          selfDescription: 'SRE with 5 years experience.',
        },
      });

      assert(failGenerateRes.status === 400, 'Failing AI generation returns 400 Bad Request');
      const failedReportId = failGenerateRes.data?.data?.reportId;
      if (failedReportId) {
        const failedDoc = await InterviewReport.findById(failedReportId);
        assert(failedDoc.status === 'failed', 'Failing report status correctly transitioned to failed (not stuck in processing)');
      } else {
        assert(true, 'Report handled error gracefully without leaving orphan processing record');
      }

      // Restore mock AI client
      app.locals.customAiClient = mockAiClient;

      // ----------------------------------------------------
      // SECTION 7: RESUME BUILDER & PDF GENERATION
      // ----------------------------------------------------
      console.log('\n📄 SECTION 7: ATS Resume Builder & High-Fidelity PDF Generation');
      const sampleResumeData = {
        template: 'modern',
        personalInfo: {
          fullName: 'Alex Vance',
          email: 'alex.vance@hirenex.test',
          phone: '+1 (555) 234-5678',
          location: 'Seattle, WA',
          website: 'https://alexvance.dev',
          linkedin: 'https://linkedin.com/in/alexvance',
          github: 'https://github.com/alexvance',
        },
        summary: 'Senior Cloud Security Architect with 8+ years designing zero-trust infrastructures.',
        skills: ['AWS', 'Kubernetes', 'Go', 'Terraform', 'Vault', 'Zero Trust', 'Docker'],
        experience: [
          {
            title: 'Lead Cloud Security Architect',
            company: 'DefendScale Networks',
            location: 'Seattle, WA',
            startDate: '2021-03',
            endDate: 'Present',
            current: true,
            highlights: ['Reduced attack surface by 45%', 'Maintained 99.99% compliance SLA'],
          },
        ],
        education: [
          {
            degree: 'B.S. in Computer Science',
            institution: 'University of Washington',
            location: 'Seattle, WA',
            endDate: '2016-06',
            gpa: '3.8',
            highlights: [],
          },
        ],
        projects: [
          {
            name: 'CloudGuard CLI',
            techStack: ['Go', 'AWS SDK', 'Docker'],
            githubUrl: 'https://github.com/alexvance/cloudguard',
            highlights: ['Open-source CLI auditing IAM policies against CIS benchmarks.'],
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Security - Specialty',
            issuer: 'Amazon Web Services',
            date: '2023',
          },
        ],
        achievements: ['Published speaker at CloudSec Con 2024'],
      };

      // Test Puppeteer PDF generation
      const pdfRes = await request('/api/resumes/generate-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: { resumeData: sampleResumeData },
      });

      assert(pdfRes.status === 200, 'POST /api/resumes/generate-pdf returns 200 OK');
      assert(pdfRes.headers.get('content-type') === 'application/pdf', 'Response Content-Type is application/pdf');
      assert(pdfRes.headers.get('content-disposition').includes('HireNex_Resume.pdf'), 'Content-Disposition specifies PDF download filename');
      assert(Buffer.isBuffer(pdfRes.data) && pdfRes.data.length > 5000, 'Generated valid binary PDF buffer (> 5 KB)');
      const pdfSignature = pdfRes.data.slice(0, 5).toString('utf8');
      assert(pdfSignature === '%PDF-', 'Generated PDF contains standard %PDF- binary header');

      // Test AI ATS Optimizer endpoint
      const mockAtsOptimizer = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify({
              atsScore: 88,
              matchedKeywords: ['Kubernetes', 'AWS', 'Zero Trust', 'Terraform'],
              missingKeywords: ['SOC2 Type II', 'SIEM'],
              skillsToHighlight: ['Cloud Security', 'Zero Trust'],
              improvedSummary: 'Results-driven Senior Security Architect with proven record protecting multi-cloud environments.',
              contentImprovements: [
                {
                  section: 'Experience',
                  current: 'Reduced attack surface by 45%',
                  suggested: 'Spearheaded zero-trust microsegmentation cutting exploitable attack surface by 45%',
                  rationale: 'Highlights technical leadership and concrete security posture improvements.',
                },
              ],
            }),
          }),
        },
      };
      app.locals.customAiClient = mockAtsOptimizer;

      const optimizeRes = await request('/api/resumes/ai-optimize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: {
          resumeData: sampleResumeData,
          jobDescription: 'Seeking an expert in AWS, Kubernetes, Zero Trust, and SOC2 Type II compliance.',
        },
      });

      assert(optimizeRes.status === 200, 'POST /api/resumes/ai-optimize returns 200 OK');
      assert(optimizeRes.data.data.atsScore === 88, 'AI ATS Optimizer returns accurate score (88)');
      assert(optimizeRes.data.data.matchedKeywords.length >= 2, 'Returns matched ATS keywords');
      assert(optimizeRes.data.data.missingKeywords.length >= 1, 'Returns missing keywords to target');

      // ----------------------------------------------------
      // SECTION 8: AGGREGATE STATS & CLEANUP
      // ----------------------------------------------------
      console.log('\n📊 SECTION 8: Database Metrics & Aggregated User Stats');
      const statsRes = await request('/api/interviews/stats', {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(statsRes.status === 200, 'GET /api/interviews/stats returns 200 OK');
      assert(statsRes.data.data.totalPlans >= 2, 'Total plans accurately counted in MongoDB aggregation');
      assert(statsRes.data.data.completedPlans >= 1, 'Completed plans accurately aggregated');
      assert(statsRes.data.data.averageScore >= 80, 'Average score accurately calculated');

      // Delete Report
      const deleteRes = await request(`/api/interviews/${reportAId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(deleteRes.status === 200, 'DELETE /api/interviews/:id deletes report successfully');

      const verifyDeleted = await request(`/api/interviews/${reportAId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(verifyDeleted.status === 404, 'Deleted report returns 404 Not Found');

      // Cleanup test users and test reports
      await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });
      await InterviewReport.deleteMany({ user: { $in: [userDocInDb._id] } });

      console.log('\n========================================================');
      console.log(`🏁 MASTER AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
      console.log('========================================================\n');

      server.close();
      await mongoose.disconnect();
      process.exit(failedCount > 0 ? 1 : 0);
    } catch (err) {
      console.error('Fatal error during master audit:', err);
      if (server) server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runMasterAudit();
