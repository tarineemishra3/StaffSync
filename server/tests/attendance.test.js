const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Attendance = require('../src/models/Attendance');
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

describe('Phase 4: Attendance Management Workflow', () => {
  let employeeUser, employeeToken;
  let managerUser, managerToken;
  let hrUser, hrToken;

  beforeEach(async () => {
    // HR Admin
    hrUser = await User.create({
      name: 'HR Admin',
      email: 'hr@example.com',
      password: 'password123',
      role: 'hr',
      status: 'active'
    });
    hrToken = signToken(hrUser);
    await Profile.create({ user: hrUser._id, department: 'Human Resources' });

    // Manager
    managerUser = await User.create({
      name: 'Manager Bob',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      status: 'active'
    });
    managerToken = signToken(managerUser);
    await Profile.create({ user: managerUser._id, department: 'Engineering' });

    // Employee
    employeeUser = await User.create({
      name: 'Alice Employee',
      email: 'alice@example.com',
      password: 'password123',
      role: 'employee',
      status: 'active'
    });
    employeeToken = signToken(employeeUser);
    await Profile.create({
      user: employeeUser._id,
      department: 'Engineering',
      reportingManager: managerUser._id
    });
  });

  it('1. should record a successful check-in for the authenticated employee', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ remarks: 'Starting work on time' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.user.toString()).toBe(employeeUser._id.toString());
    expect(res.body.attendance.status).toBe('present');
    expect(res.body.attendance.checkOutTime).toBeNull();
    expect(res.body.attendance).toHaveProperty('date');
  });

  it('2. should prevent duplicate check-in on the same workday', async () => {
    // First check-in
    await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    // Attempt second check-in on the same day
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/duplicate check-in rejected/i);
  });

  it('3. should reject check-out before check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no active check-in record found/i);
  });

  it('4. should successfully check-out and compute total working hours', async () => {
    // Check in first
    await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    // Perform check-out
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ remarks: 'Ending day shift' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.checkOutTime).not.toBeNull();
    expect(res.body.attendance).toHaveProperty('totalHours');
  });

  it('5. should prevent duplicate checkout on an already closed shift', async () => {
    // Check in and check out
    await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${employeeToken}`).send({});
    await request(app).post('/api/attendance/check-out').set('Authorization', `Bearer ${employeeToken}`).send({});

    // Attempt checkout again
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already checked out/i);
  });

  it('6. should return today attendance status for current employee', async () => {
    await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${employeeToken}`).send({});

    const res = await request(app)
      .get('/api/attendance/today')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.hasCheckedIn).toBe(true);
    expect(res.body.hasCheckedOut).toBe(false);
  });

  it('7. should return attendance history for the authenticated employee', async () => {
    await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${employeeToken}`).send({});

    const res = await request(app)
      .get('/api/attendance/me')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.records.length).toBe(1);
    expect(res.body).toHaveProperty('summary');
  });

  it('8. should allow Manager to view team attendance', async () => {
    // Employee checks in
    await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${employeeToken}`).send({});

    const res = await request(app)
      .get('/api/attendance/team')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.length).toBe(1);
    expect(res.body.attendance[0].user.name).toBe('Alice Employee');
  });

  it('9. should forbid regular employees from viewing team attendance', async () => {
    const res = await request(app)
      .get('/api/attendance/team')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('10. should allow HR to view organization-wide attendance report and forbid employees', async () => {
    // HR viewing -> 200
    const resHR = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(resHR.statusCode).toBe(200);

    // Regular employee viewing -> 403
    const resEmp = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(resEmp.statusCode).toBe(403);
  });
});
