import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import mongoose from 'mongoose';

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runTests() {
  console.log('🧪 Starting HireNex Authentication System Verification...\n');

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

      // Clean up previous test user
      const testEmail = 'test_engineer@hirenex.dev';
      await User.deleteMany({ email: testEmail });

      // 1. Health Check
      console.log('--- 1. Health Check API ---');
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      const healthData = await healthRes.json();
      assert(healthRes.status === 200, 'GET /api/health returns 200');
      assert(healthData.database.status === 'connected', 'Database status is connected');

      // 2. Register Validation (short password)
      console.log('\n--- 2. Validation Constraints ---');
      const badPassRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'tester',
          email: testEmail,
          password: '123', // Too short
        }),
      });
      assert(badPassRes.status === 400, 'Rejects password shorter than 6 chars with 400');

      // 3. Successful Registration
      console.log('\n--- 3. User Registration ---');
      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testengineer',
          email: testEmail,
          password: 'SecurePassword123!',
        }),
      });

      const setCookieHeader = regRes.headers.get('set-cookie');
      const regData = await regRes.json();

      assert(regRes.status === 201, 'POST /api/auth/register returns 201');
      assert(regData.success === true, 'Response success is true');
      assert(regData.user.username === 'testengineer', 'User details returned correctly');
      assert(regData.user.password === undefined, 'Password is omitted from response');
      assert(setCookieHeader && setCookieHeader.includes('token='), 'Set-Cookie header contains token');
      assert(setCookieHeader && setCookieHeader.includes('HttpOnly'), 'Cookie has HttpOnly flag set');

      // Extract cookie for subsequent authenticated requests
      const cookieValue = setCookieHeader.split(';')[0];

      // 4. Duplicate Registration Prevention
      console.log('\n--- 4. Duplicate Email Registration ---');
      const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testengineer2',
          email: testEmail, // Same email
          password: 'SecurePassword123!',
        }),
      });
      assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict');

      // 5. Password Hashing in Database
      console.log('\n--- 5. Password Security & Bcrypt Hashing ---');
      const dbUser = await User.findOne({ email: testEmail }).select('+password');
      assert(dbUser !== null, 'User saved in database');
      assert(
        dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$'),
        'Password is encrypted with bcrypt salt & hash'
      );

      // 6. Login with Invalid Credentials
      console.log('\n--- 6. User Login Tests ---');
      const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword!',
        }),
      });
      assert(wrongPassRes.status === 401, 'Login with wrong password returns 401 Unauthorized');

      // 7. Login with Correct Credentials
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'SecurePassword123!',
        }),
      });
      const loginData = await loginRes.json();
      assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
      assert(loginData.user.email === testEmail, 'Logged in user matches email');
      assert(loginData.user.password === undefined, 'Password omitted from login response');

      // 8. Protected Route: GET /api/auth/me without token
      console.log('\n--- 8. Protected Route (GET /api/auth/me) ---');
      const unauthMeRes = await fetch(`${BASE_URL}/api/auth/me`);
      assert(unauthMeRes.status === 401, 'Accessing /api/auth/me without token returns 401 Unauthorized');

      // 9. Protected Route: GET /api/auth/me with Cookie
      const authCookieMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          Cookie: cookieValue,
        },
      });
      const authCookieData = await authCookieMeRes.json();
      assert(authCookieMeRes.status === 200, 'Accessing /api/auth/me with HTTP-only cookie returns 200 OK');
      assert(authCookieData.user.email === testEmail, 'Retrieved user matches logged-in user');

      // 10. Protected Route: GET /api/auth/me with Bearer token
      const authBearerMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      });
      assert(authBearerMeRes.status === 200, 'Accessing /api/auth/me with Bearer token returns 200 OK');

      // 11. Logout: POST /api/auth/logout
      console.log('\n--- 11. User Logout ---');
      const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
      const logoutCookieHeader = logoutRes.headers.get('set-cookie');
      assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');
      assert(
        logoutCookieHeader &&
          (logoutCookieHeader.includes('Expires=Thu, 01 Jan 1970') ||
            logoutCookieHeader.includes('token=;')),
        'Cookie is cleared on logout'
      );

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

runTests();

