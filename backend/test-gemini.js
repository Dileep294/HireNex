import dotenv from 'dotenv';
dotenv.config();

import {
  getGeminiModelName,
  getGeminiClient,
  isGeminiConfigured,
  getGeminiApiKey,
} from './src/config/gemini.js';
import {
  generateInterviewStrategy,
  cleanJsonText,
  isTransientError,
} from './src/services/aiInterviewService.js';
import {
  validateAiResponse,
  aiResponseSchema,
} from './src/validations/aiResponseValidation.js';

// Fully compliant mock AI response fixture
export const createMockAiResponse = (overrides = {}) => ({
  matchScore: 88,
  scoreExplanation:
    'The candidate demonstrates strong alignment with core MERN stack requirements, particularly in React and Node.js architecture.',
  strengths: [
    {
      skillOrArea: 'React.js & Component Architecture',
      evidence: 'Built high-traffic web applications with complex state management.',
      relevance: 'Directly aligns with frontend engineering expectations for the position.',
    },
    {
      skillOrArea: 'RESTful API Engineering',
      evidence: 'Designed and deployed Express microservices with MongoDB aggregation.',
      relevance: 'Essential for building backend endpoints and scalable services.',
    },
  ],
  skillGaps: [
    {
      skill: 'Kubernetes & Container Orchestration',
      importance: 'Medium',
      explanation: 'Role mentions deploying microservices on cloud-native clusters.',
      suggestedLearning: ['Kubernetes Fundamentals', 'Minikube Hands-on Pod Deployment'],
    },
  ],
  technicalQuestions: Array.from({ length: 15 }, (_, i) => ({
    question: `Technical interview question #${i + 1}: How do you design high-throughput systems?`,
    difficulty: i % 3 === 0 ? 'Hard' : i % 2 === 0 ? 'Medium' : 'Easy',
    topic: 'Full-Stack Architecture & Distributed Caching',
    detailedAnswer:
      'Utilize horizontal auto-scaling, write-through Redis caching, and database read replicas.',
    explanation:
      'Evaluates candidate comprehension of latency bottlenecks and scaling tradeoffs.',
    relatedSkills: ['Node.js', 'Redis', 'Database Architecture'],
  })),
  behavioralQuestions: Array.from({ length: 10 }, (_, i) => ({
    question: `Behavioral question #${i + 1}: Describe a critical production incident you resolved.`,
    evaluates: 'Incident Management & Communication',
    suggestedStarStructure: {
      situation: 'Database connection pool exhausted during peak traffic.',
      task: 'Restore API availability within SLA without data loss.',
      action: 'Isolated runaway query, adjusted connection pool size, and deployed hotfix.',
      result: 'System recovered in 6 minutes; created regression alert to prevent recurrence.',
    },
    exampleAnswer:
      'During a traffic surge, our connection pool saturated. I identified the un-indexed query, deployed an index, and restored traffic.',
    tips: 'Quantify the recovery time and emphasize post-mortem preventative actions.',
  })),
  preparationRoadmap: Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    topic: `Day ${i + 1}: Core Technical & Behavioral Mastery`,
    learningObjectives: ['Master async concurrency', 'Review database indexes'],
    tasks: ['Implement custom hooks', 'Solve 2 medium system design challenges'],
    practiceActivities: ['Mock interview recording with timer'],
    estimatedMinutes: 120,
  })),
  aiAnalysis:
    'Strong candidate with competitive technical fundamentals. Focus interview prep on communicating architectural tradeoffs.',
  ...overrides,
});

async function runGeminiTests() {
  console.log('🧪 Starting HireNex Google Gemini AI Integration Verification...\n');

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

  try {
    // --- TEST 1: Gemini Configuration ---
    console.log('--- 1. Gemini Configuration ---');
    const model = getGeminiModelName();
    assert(typeof model === 'string' && model.length > 0, `Model configured: ${model}`);
    assert(typeof isGeminiConfigured() === 'boolean', 'isGeminiConfigured returns boolean');

    // --- TEST 2: Missing API Key Handling ---
    console.log('\n--- 2. Missing API Key Handling ---');
    const originalApiKey = process.env.GEMINI_API_KEY;
    const originalGoogleKey = process.env.GOOGLE_GENAI_API_KEY;

    try {
      process.env.GEMINI_API_KEY = '';
      process.env.GOOGLE_GENAI_API_KEY = '';
      let threwMissingKey = false;
      try {
        getGeminiClient();
      } catch (err) {
        threwMissingKey = true;
        assert(
          err.message.includes('Gemini API key is not configured'),
          'getGeminiClient throws informative error when API key is missing'
        );
      }
      assert(threwMissingKey, 'Rejected missing API key instantiation');
    } finally {
      process.env.GEMINI_API_KEY = originalApiKey;
      process.env.GOOGLE_GENAI_API_KEY = originalGoogleKey;
    }

    // --- TEST 3: Valid AI Response & Strategy Generation ---
    console.log('\n--- 3. Valid AI Response Processing ---');
    const validFixture = createMockAiResponse();
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(validFixture),
        }),
      },
    };

    const strategyResult = await generateInterviewStrategy({
      jobTitle: 'Senior Full-Stack Engineer',
      companyName: 'Stripe',
      jobDescription: 'Architect high-scale payments platform with React, Node.js and MongoDB.',
      resumeText: 'Elena Rostova, Senior Full-Stack Engineer with 5 years experience.',
      customAiClient: mockClient,
    });

    assert(strategyResult.matchScore === 88, 'Correctly parsed matchScore (88)');
    assert(strategyResult.strengths.length === 2, 'Strengths parsed and validated');
    assert(
      strategyResult.technicalQuestions.length === 15,
      'Extracted exactly 15 technical questions'
    );
    assert(
      strategyResult.behavioralQuestions.length === 10,
      'Extracted exactly 10 behavioral questions'
    );
    assert(
      strategyResult.preparationRoadmap.length === 7,
      'Extracted exactly 7-day preparation roadmap'
    );

    // --- TEST 4: Invalid AI Response Schema Rejection ---
    console.log('\n--- 4. Invalid AI Response Schema Rejection ---');
    const invalidFixture = createMockAiResponse({
      matchScore: 150, // Invalid: must be <= 100
      technicalQuestions: [
        {
          question: 'Valid question',
          difficulty: 'SuperHard', // Invalid enum
          topic: 'Architecture',
          detailedAnswer: 'A good answer',
          explanation: 'Explanation',
        },
      ],
    });

    const mockInvalidClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify(invalidFixture),
        }),
      },
    };

    let caughtInvalidSchema = false;
    try {
      await generateInterviewStrategy({
        jobTitle: 'Lead Engineer',
        jobDescription: 'Design reliable microservices and scalable cloud architecture.',
        selfDescription: '10 years experience in distributed systems.',
        customAiClient: mockInvalidClient,
      });
    } catch (err) {
      caughtInvalidSchema = true;
      assert(
        err.message.includes('schema validation'),
        'Rejects out-of-bounds matchScore (150) and invalid difficulty enum'
      );
    }
    assert(caughtInvalidSchema, 'Invalid AI response was rejected before storage');

    // --- TEST 5: API Rate-Limit Error Handling ---
    console.log('\n--- 5. API Rate-Limit Error Handling ---');
    const rateLimitClient = {
      models: {
        generateContent: async () => {
          const err = new Error('Resource exhausted: quota exceeded (rate limit 429)');
          err.status = 429;
          throw err;
        },
      },
    };

    let caughtRateLimit = false;
    try {
      await generateInterviewStrategy({
        jobTitle: 'Software Architect',
        jobDescription: 'Build high-volume transactional distributed systems.',
        selfDescription: 'Experienced engineer with expertise in caching and microservices.',
        customAiClient: rateLimitClient,
      });
    } catch (err) {
      caughtRateLimit = true;
      assert(
        err.message.includes('rate limit reached') || err.message.includes('unavailable'),
        'Sanitizes 429 rate limit into friendly user message'
      );
    }
    assert(caughtRateLimit, 'Rate limit error caught gracefully');

    // --- TEST 6: Malformed JSON Handling ---
    console.log('\n--- 6. Malformed JSON Handling ---');
    const malformedJsonClient = {
      models: {
        generateContent: async () => ({
          text: '```json\n{ "matchScore": 85, "brokenJson": missingQuotes }\n```',
        }),
      },
    };

    let caughtMalformedJson = false;
    try {
      await generateInterviewStrategy({
        jobTitle: 'Backend Engineer',
        jobDescription: 'Build scalable APIs using Express and MongoDB.',
        selfDescription: 'Proficient in Node.js and MongoDB query optimization.',
        customAiClient: malformedJsonClient,
      });
    } catch (err) {
      caughtMalformedJson = true;
      assert(
        err.message.includes('Malformed JSON response returned by AI engine'),
        'Catches unparseable JSON without crashing'
      );
    }
    assert(caughtMalformedJson, 'Malformed JSON rejected with 400 error');

    // --- TEST 7: Missing Resume with Valid Self-Description ---
    console.log('\n--- 7. Missing Resume with Valid Self-Description ---');
    const selfDescOnlyResult = await generateInterviewStrategy({
      jobTitle: 'DevOps Engineer',
      jobDescription: 'Manage CI/CD pipelines, Docker containers, and Kubernetes clusters.',
      resumeText: '', // No resume provided
      selfDescription:
        '5 years administering Kubernetes clusters, writing Terraform modules, and building GitHub Actions workflows.',
      customAiClient: mockClient,
    });
    assert(
      selfDescOnlyResult.matchScore === 88,
      'Successfully processes candidate profile using self-description alone'
    );

    // --- TEST 8: Resume with Valid Job Description ---
    console.log('\n--- 8. Resume with Valid Job Description ---');
    const resumeOnlyResult = await generateInterviewStrategy({
      jobTitle: 'Senior Frontend Engineer',
      jobDescription: 'Build performant, accessible React 19 web applications with Tailwind CSS.',
      resumeText:
        'Alex Rivers\nSenior Frontend Engineer\nSkills: React, Next.js, TypeScript, Tailwind CSS\nBuilt scalable design systems.',
      selfDescription: '', // No self-description provided
      customAiClient: mockClient,
    });
    assert(
      resumeOnlyResult.matchScore === 88,
      'Successfully processes candidate profile using uploaded resume text alone'
    );

    // --- TEST 9: AI Output Validation Unit Tests ---
    console.log('\n--- 9. AI Output Validation Unit Tests ---');
    // Markdown code-fence stripping test
    const rawFenced = '```json\n{"key": "value"}\n```';
    assert(cleanJsonText(rawFenced) === '{"key": "value"}', 'cleanJsonText removes ```json fences');

    // Transient error identification test
    assert(isTransientError({ status: 429 }), 'Identifies HTTP 429 as transient');
    assert(isTransientError({ status: 503 }), 'Identifies HTTP 503 as transient');
    assert(!isTransientError({ status: 400 }), 'Identifies HTTP 400 as non-transient');

    // Zod boundary checks
    const validObj = createMockAiResponse();
    const validated = validateAiResponse(validObj);
    assert(validated.matchScore === 88, 'validateAiResponse validates schema correctly');

    let scoreError = false;
    try {
      validateAiResponse({ ...validObj, matchScore: -5 });
    } catch (e) {
      scoreError = true;
    }
    assert(scoreError, 'Rejects negative matchScore (-5)');

    let missingStrengthsError = false;
    try {
      validateAiResponse({ ...validObj, strengths: [] });
    } catch (e) {
      missingStrengthsError = true;
    }
    assert(missingStrengthsError, 'Rejects empty strengths array');

    console.log('\n=============================================');
    console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (globalErr) {
    console.error('Test suite failed unexpectedly:', globalErr);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('test-gemini.js')) {
  runGeminiTests();
}

export { runGeminiTests };

