const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Leave = require('../src/models/Leave');
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

describe('Phase 4: Leave Management Workflow', () => {
  let employeeUser, employeeToken;
  let managerUser, managerToken;
  let hrUser, hrToken;
  let otherManagerToken;

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

    // Reporting Manager
    managerUser = await User.create({
      name: 'Manager Bob',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      status: 'active'
    });
    managerToken = signToken(managerUser);
    await Profile.create({ user: managerUser._id, department: 'Engineering' });

    // Another Manager (different department / not reporting manager)
    const otherManager = await User.create({
      name: 'Manager Dave',
      email: 'dave@example.com',
      password: 'password123',
      role: 'manager',
      status: 'active'
    });
    otherManagerToken = signToken(otherManager);
    await Profile.create({ user: otherManager._id, department: 'Finance' });

    // Employee reporting to Manager Bob
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

  it('1. should allow employee to submit a valid leave application', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        reason: 'Family wedding attendance'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.leave.status).toBe('pending');
    expect(res.body.leave.totalDays).toBe(3);
    expect(res.body.leave.user.toString()).toBe(employeeUser._id.toString());
  });

  it('2. should reject leave application if end date is earlier than start date', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'sick',
        startDate: '2026-11-05',
        endDate: '2026-11-01', // Invalid: end before start
        reason: 'Medical recovery'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/end date cannot be earlier than start date/i);
  });

  it('3. should reject leave application with missing or short reason', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        reason: 'Hi' // Less than 5 characters
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/at least 5 characters/i);
  });

  it('4. should prevent submitting overlapping active leave applications', async () => {
    // First leave: Nov 1 to Nov 5
    await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        reason: 'First annual vacation'
      });

    // Overlapping leave: Nov 3 to Nov 8
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'sick',
        startDate: '2026-11-03',
        endDate: '2026-11-08',
        reason: 'Overlapping personal issue'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/overlapping with these dates/i);
  });

  it('5. should allow employee to view their own leave requests', async () => {
    await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'sick',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        reason: 'Dental surgery procedure'
      });

    const res = await request(app)
      .get('/api/leaves/me')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.leaves.length).toBe(1);
    expect(res.body.leaves[0].reason).toBe('Dental surgery procedure');
  });

  it('6. should allow employee to cancel their pending leave request', async () => {
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-15',
        endDate: '2026-11-16',
        reason: 'Short family visit'
      });

    const leaveId = created.body.leave._id;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.leave.status).toBe('cancelled');
  });

  it('7. should allow reporting manager to approve a pending leave request', async () => {
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        reason: 'Attending technical conference'
      });

    const leaveId = created.body.leave._id;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'approved',
        reviewRemarks: 'Approved, enjoy the conference.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.leave.status).toBe('approved');
    expect(res.body.leave.reviewedBy.name).toBe('Manager Bob');
    expect(res.body.leave.reviewRemarks).toBe('Approved, enjoy the conference.');
  });

  it('8. should forbid non-reporting manager from reviewing another team member leave', async () => {
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-11-25',
        endDate: '2026-11-26',
        reason: 'Personal errands day'
      });

    const leaveId = created.body.leave._id;

    // Manager Dave is from Finance and is NOT Alice's reporting manager
    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${otherManagerToken}`)
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/only review leave applications for members of your direct reporting team/i);
  });

  it('9. should prevent employees from approving or reviewing their own leave requests', async () => {
    // If a manager applies for their own leave, they cannot approve it
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        leaveType: 'annual',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        reason: 'Year end vacation'
      });

    const leaveId = created.body.leave._id;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/cannot approve or reject your own leave/i);
  });

  it('10. should allow HR to review leave applications organization-wide', async () => {
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'sick',
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        reason: 'Health rest days'
      });

    const leaveId = created.body.leave._id;

    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        status: 'rejected',
        reviewRemarks: 'Peak operational delivery week.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.leave.status).toBe('rejected');
    expect(res.body.leave.reviewedBy.name).toBe('HR Admin');
  });

  it('11. should prevent double-reviewing a leave request that is no longer pending', async () => {
    const created = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveType: 'casual',
        startDate: '2026-12-15',
        endDate: '2026-12-16',
        reason: 'Family event'
      });

    const leaveId = created.body.leave._id;

    // First review: Approved
    await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'approved' });

    // Second review attempt
    const res = await request(app)
      .patch(`/api/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'rejected' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/no longer pending or has already been reviewed/i);
  });
});
