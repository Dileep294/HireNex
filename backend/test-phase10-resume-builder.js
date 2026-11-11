/**
 * Phase 10 Automated Verification: ATS Resume Builder, Templates & PDF Generation
 */

import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import { generateToken } from './src/utils/token.js';
import { renderResumeHtml, generatePdfFromResumeData } from './src/services/pdfService.js';
import { optimizeResumeForJobDescription } from './src/services/aiResumeOptimizerService.js';

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

function makeRequest({ port, method, path, headers = {}, body = null, returnBinary = false }) {
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
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (returnBinary) {
          return resolve({ status: res.statusCode, headers: res.headers, buffer });
        }
        try {
          const parsed = buffer.length > 0 ? JSON.parse(buffer.toString('utf8')) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, buffer });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: buffer.toString('utf8'), buffer });
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

async function runPhase10Tests() {
  console.log('\n🧪 Starting HireNex Phase 10 Resume Builder & PDF Generation Verification...\n');

  await connectDB();
  console.log('✅ [MongoDB] Connected successfully for Phase 10 tests.');

  await User.deleteMany({ email: { $regex: /@phase10test\.com$/ } });

  const server = app.listen(0);
  const port = server.address().port;

  try {
    // 1. Setup authenticated candidate
    const candidate = await User.create({
      username: 'cand10',
      email: 'cand10@phase10test.com',
      password: 'password123',
    });
    const token = generateToken(candidate._id);

    const validResumeData = {
      template: 'modern',
      personalInfo: {
        fullName: 'Jordan Lee',
        jobTitle: 'Senior Cloud Platform Engineer',
        email: 'jordan.lee@example.com',
        phone: '+1 555-0199',
        location: 'Seattle, WA',
        linkedin: 'https://linkedin.com/in/jordanlee',
        github: 'https://github.com/jordanlee',
        portfolio: 'https://jordanlee.io',
      },
      summary: 'Senior Cloud Engineer with extensive background in distributed AWS architectures, Kubernetes operator patterns, and high-performance Go microservices.',
      skills: ['Go', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'Prometheus', 'CI/CD'],
      experience: [
        {
          title: 'Senior DevOps Architect',
          company: 'CloudMatrix',
          location: 'Seattle, WA',
          startDate: '2021',
          endDate: '',
          current: true,
          highlights: [
            'Scaled multi-region Kubernetes clusters handling 50k requests per second.',
            'Reduced AWS infrastructure spending by $180,000 annually via auto-scaling spot fleets.',
          ],
        },
      ],
      education: [
        {
          degree: 'B.S. in Computer Engineering',
          institution: 'University of Washington',
          location: 'Seattle, WA',
          startDate: '2016',
          endDate: '2020',
          gpa: '3.85',
          highlights: ['President of Cloud Computing Club'],
        },
      ],
      projects: [
        {
          name: 'KubeGuard Operator',
          techStack: ['Go', 'Kubernetes API', 'Docker'],
          liveUrl: 'https://kubeguard.dev',
          githubUrl: 'https://github.com/jordanlee/kubeguard',
          highlights: ['Automated zero-trust network policy enforcement across 200+ microservices.'],
        },
      ],
      certifications: [
        {
          name: 'Certified Kubernetes Administrator (CKA)',
          issuer: 'CNCF',
          date: '2022',
          credentialUrl: '',
        },
      ],
    };

    console.log('--- 1. Authentication & Security Guards ---');
    // Unauthenticated request to /api/resumes/generate-pdf
    const unauthPdfRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      body: { resumeData: validResumeData },
    });
    assert(unauthPdfRes.status === 401, 'POST /api/resumes/generate-pdf rejects unauthenticated request with 401');

    // Unauthenticated request to /api/resumes/ai-optimize
    const unauthOptRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/ai-optimize',
      body: { resumeData: validResumeData, jobDescription: 'Seeking cloud engineer with Kubernetes experience.' },
    });
    assert(unauthOptRes.status === 401, 'POST /api/resumes/ai-optimize rejects unauthenticated request with 401');

    console.log('\n--- 2. Input Validation Schema Tests ---');
    // Missing full name
    const invalidNameRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        resumeData: {
          ...validResumeData,
          personalInfo: { ...validResumeData.personalInfo, fullName: '' },
        },
      },
    });
    assert(invalidNameRes.status === 400, 'Rejects empty fullName with 400');

    // Invalid email
    const invalidEmailRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        resumeData: {
          ...validResumeData,
          personalInfo: { ...validResumeData.personalInfo, email: 'not-an-email' },
        },
      },
    });
    assert(invalidEmailRes.status === 400, 'Rejects malformed email with 400');

    // Job description too short for optimization
    const shortJdRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/ai-optimize',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        resumeData: validResumeData,
        jobDescription: 'Short JD',
      },
    });
    assert(shortJdRes.status === 400, 'Rejects job description under 20 chars with 400');

    console.log('\n--- 3. Template HTML Rendering Unit Tests ---');
    const classicHtml = renderResumeHtml({ ...validResumeData, template: 'classic' });
    assert(classicHtml.includes('Times New Roman'), 'Classic template renders serif font styles');
    assert(classicHtml.includes('Jordan Lee'), 'Classic template renders candidate name');
    assert(classicHtml.includes('Work Experience'), 'Classic template contains Work Experience section');

    const modernHtml = renderResumeHtml({ ...validResumeData, template: 'modern' });
    assert(modernHtml.includes('Modern Resume'), 'Modern template renders modern header');
    assert(modernHtml.includes('4f46e5'), 'Modern template contains indigo accents');
    assert(modernHtml.includes('KubeGuard Operator'), 'Modern template includes project name');

    const devHtml = renderResumeHtml({ ...validResumeData, template: 'developer' });
    assert(devHtml.includes('SFMono-Regular'), 'Developer template contains monospace styling');
    assert(devHtml.includes('// Engineering Experience'), 'Developer template contains code-style section headers');

    console.log('\n--- 4. Live PDF Generation via Puppeteer (POST /api/resumes/generate-pdf) ---');
    // Test Modern template PDF generation
    const modernPdfRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: { resumeData: { ...validResumeData, template: 'modern' } },
      returnBinary: true,
    });
    assert(modernPdfRes.status === 200, 'POST /api/resumes/generate-pdf returns HTTP 200');
    assert(modernPdfRes.headers['content-type'] === 'application/pdf', 'Header Content-Type is application/pdf');
    assert(modernPdfRes.headers['content-disposition'].includes('attachment'), 'Header Content-Disposition contains attachment');
    assert(modernPdfRes.headers['content-disposition'].includes('Jordan_Lee'), 'Header Content-Disposition contains safe sanitized filename');
    assert(modernPdfRes.buffer.subarray(0, 4).toString() === '%PDF', 'Output binary starts with valid %PDF- magic signature');
    assert(modernPdfRes.buffer.length > 5000, `Generated PDF buffer is substantial (${modernPdfRes.buffer.length} bytes)`);

    // Test Classic template PDF generation
    const classicPdfRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: { resumeData: { ...validResumeData, template: 'classic' } },
      returnBinary: true,
    });
    assert(classicPdfRes.status === 200, 'Classic template generates PDF successfully (HTTP 200)');
    assert(classicPdfRes.buffer.subarray(0, 4).toString() === '%PDF', 'Classic PDF output has valid %PDF- header');

    // Test Developer template PDF generation
    const devPdfRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: { resumeData: { ...validResumeData, template: 'developer' } },
      returnBinary: true,
    });
    assert(devPdfRes.status === 200, 'Developer template generates PDF successfully (HTTP 200)');
    assert(devPdfRes.buffer.subarray(0, 4).toString() === '%PDF', 'Developer PDF output has valid %PDF- header');

    console.log('\n--- 5. Multi-Page Resume Handling ---');
    // Create long multi-entry resume data to verify multi-page rendering without truncation
    const longResumeData = {
      ...validResumeData,
      experience: Array.from({ length: 6 }, (_, i) => ({
        title: `Senior Architect Role #${i + 1}`,
        company: `Enterprise Corp #${i + 1}`,
        location: 'Seattle, WA',
        startDate: `${2015 + i}`,
        endDate: `${2016 + i}`,
        current: i === 0,
        highlights: [
          'Engineered highly reliable microservice backends with strict latency service level objectives.',
          'Supervised team of 10 engineers implementing continuous deployment and unit test frameworks.',
          'Managed infrastructure orchestration across multiple cloud regions using infrastructure as code.',
        ],
      })),
      projects: Array.from({ length: 5 }, (_, i) => ({
        name: `Production Cloud Initiative #${i + 1}`,
        techStack: ['Go', 'PostgreSQL', 'Redis', 'Docker'],
        liveUrl: 'https://example.com',
        githubUrl: 'https://github.com/example',
        highlights: [
          'Implemented distributed tracing with OpenTelemetry, identifying bottleneck queries and reducing latency.',
        ],
      })),
    };

    const longPdfRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/resumes/generate-pdf',
      headers: { Authorization: `Bearer ${token}` },
      body: { resumeData: longResumeData },
      returnBinary: true,
    });
    assert(longPdfRes.status === 200, 'Multi-page resume generates successfully with HTTP 200');
    assert(longPdfRes.buffer.length > modernPdfRes.buffer.length, 'Multi-page PDF buffer is larger than single page resume');

    console.log('\n--- 6. AI Resume Optimizer Service (Unit Test with Mock AI) ---');
    const mockAiClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            atsScore: 92,
            matchedKeywords: ['Kubernetes', 'Go', 'Docker', 'AWS', 'Terraform'],
            missingKeywords: ['Helm', 'ArgoCD'],
            skillsToHighlight: ['Kubernetes', 'AWS', 'Go'],
            improvedSummary: 'High-impact Cloud Platform Engineer with 6+ years driving AWS and Kubernetes reliability.',
            contentImprovements: [
              {
                section: 'Experience',
                current: 'Scaled multi-region Kubernetes clusters',
                suggested: 'Orchestrated multi-region Kubernetes deployments scaling to 50k req/sec with 99.99% availability',
                rationale: 'Emphasizes concrete metrics and SLA accountability for ATS parsing',
              },
            ],
          }),
        }),
      },
    };

    const optimizationResult = await optimizeResumeForJobDescription({
      resumeData: validResumeData,
      jobDescription: 'Seeking Senior Cloud Engineer proficient in Go, Kubernetes, and AWS infrastructure.',
      customAiClient: mockAiClient,
    });

    assert(optimizationResult.atsScore === 92, 'ATS score parsed correctly (92)');
    assert(optimizationResult.matchedKeywords.length === 5, 'Extracted 5 matched keywords');
    assert(optimizationResult.missingKeywords.includes('Helm'), 'Identified missing keyword Helm');
    assert(optimizationResult.improvedSummary.includes('Cloud Platform Engineer'), 'Generated tailored professional summary');
    assert(optimizationResult.contentImprovements.length === 1, 'Provided actionable content improvements');

    console.log('\n=============================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

  } finally {
    server.close();
    await User.deleteMany({ email: { $regex: /@phase10test\.com$/ } });
    await mongoose.disconnect();
    console.log('⚠️  [MongoDB] Disconnected from database.');
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error('Fatal error during Phase 10 tests:', err);
  process.exit(1);
});
