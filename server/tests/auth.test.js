const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Authentication & Registration APIs', () => {
  describe('POST /api/auth/register', () => {
    it('1. should successfully register an employee account', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123'
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: 'employee',
        status: 'active'
      });
      // Ensure password hash is NEVER leaked in response
      expect(res.body.user.password).toBeUndefined();
    });

    it('2. should reject duplicate email registration', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'duplicate@example.com',
        password: 'password123'
      });

      // Second registration with same email (different casing & whitespace)
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another Jane',
        email: '  DUPLICATE@example.com  ',
        password: 'password123'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('3. should reject invalid registration data (missing fields, short password, bad email)', async () => {
      // Missing name
      let res = await request(app).post('/api/auth/register').send({
        email: 'valid@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/name is required/i)])
      );

      // Short password (< 6 chars)
      res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/at least 6 characters/i)])
      );

      // Invalid email format
      res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/valid email/i)])
      );
    });

    it('4. should prevent self-assigning HR or manager privileges during public registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Malicious Attacker',
        email: 'attacker@example.com',
        password: 'password123',
        role: 'hr' // Attempting privilege escalation
      });

      expect(res.statusCode).toBe(201);
      // Role must strictly remain 'employee'
      expect(res.body.user.role).toBe('employee');

      // Verify persisted database record
      const dbUser = await User.findOne({ email: 'attacker@example.com' });
      expect(dbUser.role).toBe('employee');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create an active employee
      await User.create({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123',
        role: 'employee',
        status: 'active'
      });

      // Create an inactive user
      await User.create({
        name: 'Inactive Bob',
        email: 'bob.inactive@example.com',
        password: 'password123',
        role: 'employee',
        status: 'inactive'
      });
    });

    it('5. should successfully login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ALICE@example.com',
        password: 'password123'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'employee'
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('6. should reject login with incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alice@example.com',
        password: 'wrongpassword'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('7. should reject login for non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@example.com',
        password: 'password123'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('8. should reject login for inactive accounts', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'bob.inactive@example.com',
        password: 'password123'
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/account is inactive/i);
    });
  });

  describe('Protected Routes & Role-Based Authorization', () => {
    let employeeToken;
    let managerToken;
    let hrToken;

    beforeEach(async () => {
      const employee = await User.create({
        name: 'Regular Employee',
        email: 'emp@example.com',
        password: 'password123',
        role: 'employee',
        status: 'active'
      });
      employeeToken = signToken(employee);

      const manager = await User.create({
        name: 'Department Manager',
        email: 'mgr@example.com',
        password: 'password123',
        role: 'manager',
        status: 'active'
      });
      managerToken = signToken(manager);

      const hr = await User.create({
        name: 'HR Admin',
        email: 'hr@example.com',
        password: 'password123',
        role: 'hr',
        status: 'active'
      });
      hrToken = signToken(hr);
    });

    it('9. should reject access to protected endpoint without a token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no token provided/i);
    });

    it('10. should allow access to protected endpoint with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toMatchObject({
        name: 'Regular Employee',
        email: 'emp@example.com',
        role: 'employee'
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('11. should reject access with an invalid or malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired token/i);
    });

    it('12. should enforce role-based access control (forbid regular employee from manager/HR routes)', async () => {
      // Employee attempting to access Manager portal -> 403 Forbidden
      const resManager = await request(app)
        .get('/api/auth/manager-only')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(resManager.statusCode).toBe(403);
      expect(resManager.body.success).toBe(false);
      expect(resManager.body.message).toMatch(/not authorized/i);

      // Employee attempting to access HR portal -> 403 Forbidden
      const resHR = await request(app)
        .get('/api/auth/hr-only')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(resHR.statusCode).toBe(403);
      expect(resHR.body.success).toBe(false);
      expect(resHR.body.message).toMatch(/not authorized/i);
    });

    it('13. should permit manager and HR to access manager-only route', async () => {
      // Manager access
      const resMgr = await request(app)
        .get('/api/auth/manager-only')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(resMgr.statusCode).toBe(200);
      expect(resMgr.body.success).toBe(true);

      // HR access
      const resHR = await request(app)
        .get('/api/auth/manager-only')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(resHR.statusCode).toBe(200);
      expect(resHR.body.success).toBe(true);
    });

    it('14. should permit only HR to access HR-only route and create elevated accounts', async () => {
      // Manager attempting HR-only route -> 403
      const resMgr = await request(app)
        .get('/api/auth/hr-only')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(resMgr.statusCode).toBe(403);

      // HR accessing HR-only route -> 200
      const resHR = await request(app)
        .get('/api/auth/hr-only')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(resHR.statusCode).toBe(200);

      // HR creates a new Manager account via controlled admin API
      const resCreate = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'New Manager User',
          email: 'new.mgr@example.com',
          password: 'password123',
          role: 'manager'
        });

      expect(resCreate.statusCode).toBe(201);
      expect(resCreate.body.user.role).toBe('manager');
    });
  });
});
