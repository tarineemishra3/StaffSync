const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
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

describe('Phase 3: Employee Profiles & HR Management APIs', () => {
  let employeeUser, employeeToken;
  let managerUser, managerToken;
  let hrUser, hrToken;

  beforeEach(async () => {
    // Create HR Admin
    hrUser = await User.create({
      name: 'HR Admin',
      email: 'hr@example.com',
      password: 'password123',
      role: 'hr',
      status: 'active'
    });
    hrToken = signToken(hrUser);
    await Profile.create({
      user: hrUser._id,
      department: 'Human Resources',
      designation: 'HR Director',
      salary: 95000
    });

    // Create Department Manager
    managerUser = await User.create({
      name: 'Manager Bob',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      status: 'active'
    });
    managerToken = signToken(managerUser);
    await Profile.create({
      user: managerUser._id,
      department: 'Engineering',
      designation: 'Engineering Lead',
      salary: 110000
    });

    // Create Regular Employee reporting to Manager Bob
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
      designation: 'Software Developer',
      salary: 75000,
      reportingManager: managerUser._id,
      phone: '123-456-7890',
      address: '123 Tech Lane',
      emergencyContact: {
        name: 'Bob Parent',
        relationship: 'Father',
        phone: '987-654-3210'
      }
    });
  });

  describe('Self Profile Management (/api/profile/me)', () => {
    it('1. should allow employee to retrieve their own full profile', async () => {
      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.user.email).toBe('alice@example.com');
      expect(res.body.profile.department).toBe('Engineering');
      expect(res.body.profile.reportingManager.name).toBe('Manager Bob');
    });

    it('2. should allow employee to update permitted personal fields', async () => {
      const res = await request(app)
        .put('/api/profile/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          phone: '555-0199',
          address: '456 New Home St',
          bio: 'Passionate about full-stack web development.',
          skills: ['JavaScript', 'React', 'Node.js']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.phone).toBe('555-0199');
      expect(res.body.profile.address).toBe('456 New Home St');
      expect(res.body.profile.bio).toBe('Passionate about full-stack web development.');
      expect(res.body.profile.skills).toEqual(
        expect.arrayContaining(['JavaScript', 'React', 'Node.js'])
      );
    });

    it('3. should prevent employee from modifying role, salary, department or manager via profile update', async () => {
      const res = await request(app)
        .put('/api/profile/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          phone: '555-0199',
          role: 'hr', // Disallowed privilege escalation
          salary: 200000, // Disallowed
          department: 'Executive Board', // Disallowed
          reportingManager: null // Disallowed
        });

      expect(res.statusCode).toBe(200);

      // Verify that restricted fields were NOT changed
      const dbUser = await User.findById(employeeUser._id);
      expect(dbUser.role).toBe('employee');

      const dbProfile = await Profile.findOne({ user: employeeUser._id });
      expect(dbProfile.salary).toBe(75000);
      expect(dbProfile.department).toBe('Engineering');
      expect(dbProfile.reportingManager.toString()).toBe(managerUser._id.toString());
    });
  });

  describe('HR Employee Management (/api/employees)', () => {
    it('4. should allow HR to create a new employee with complete work details', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Charlie Newhire',
          email: 'charlie@example.com',
          password: 'Password123!',
          role: 'employee',
          department: 'Marketing',
          designation: 'Content Strategist',
          salary: 62000,
          reportingManager: managerUser._id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.employee.user.name).toBe('Charlie Newhire');
      expect(res.body.employee.department).toBe('Marketing');
      expect(res.body.employee.salary).toBe(62000);

      // Verify database persistence
      const createdUser = await User.findOne({ email: 'charlie@example.com' });
      expect(createdUser).not.toBeNull();
      const createdProfile = await Profile.findOne({ user: createdUser._id });
      expect(createdProfile.department).toBe('Marketing');
    });

    it('5. should forbid non-HR users from creating employees', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized User',
          email: 'unauth@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('6. should allow HR to update employee role, department and salary', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeUser._id}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          designation: 'Senior Developer',
          salary: 90000,
          role: 'manager' // Promotion to manager
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.employee.designation).toBe('Senior Developer');
      expect(res.body.employee.salary).toBe(90000);
      expect(res.body.employee.user.role).toBe('manager');

      const updatedUser = await User.findById(employeeUser._id);
      expect(updatedUser.role).toBe('manager');
    });

    it('7. should reject setting an employee as their own reporting manager', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeUser._id}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          reportingManager: employeeUser._id
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot be assigned as their own reporting manager/i);
    });

    it('8. should allow HR to deactivate and reactivate employee accounts', async () => {
      // Deactivate
      let res = await request(app)
        .patch(`/api/employees/${employeeUser._id}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ status: 'inactive' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('inactive');

      let user = await User.findById(employeeUser._id);
      expect(user.status).toBe('inactive');

      // Reactivate
      res = await request(app)
        .patch(`/api/employees/${employeeUser._id}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ status: 'active' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('active');

      user = await User.findById(employeeUser._id);
      expect(user.status).toBe('active');
    });

    it('9. should prevent HR from deactivating their own account (safety lock)', async () => {
      const res = await request(app)
        .patch(`/api/employees/${hrUser._id}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ status: 'inactive' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot deactivate your own HR account/i);

      const checkHr = await User.findById(hrUser._id);
      expect(checkHr.status).toBe('active');
    });

    it('10. should forbid non-HR users from deactivating employees', async () => {
      const res = await request(app)
        .patch(`/api/employees/${employeeUser._id}/status`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'inactive' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Employee Directory Search, Pagination & Privacy', () => {
    beforeEach(async () => {
      // Add extra employees for pagination and search tests
      const names = ['David Evans', 'Diana Prince', 'Edward Norton', 'Fiona Gallagher'];
      for (let i = 0; i < names.length; i++) {
        const u = await User.create({
          name: names[i],
          email: `employee${i}@example.com`,
          password: 'password123',
          role: 'employee',
          status: 'active'
        });
        await Profile.create({
          user: u._id,
          department: i % 2 === 0 ? 'Engineering' : 'Sales',
          designation: i % 2 === 0 ? 'QA Engineer' : 'Sales Associate',
          salary: 50000 + i * 5000,
          reportingManager: managerUser._id
        });
      }
    });

    it('11. should support pagination with page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/employees?page=1&limit=3')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.body.total).toBe(7); // 3 original + 4 added
    });

    it('12. should support search filtering by name', async () => {
      const res = await request(app)
        .get('/api/employees?search=Diana')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.employees.length).toBe(1);
      expect(res.body.employees[0].user.name).toBe('Diana Prince');
    });

    it('13. should support filtering by department', async () => {
      const res = await request(app)
        .get('/api/employees?department=Sales')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      res.body.employees.forEach((emp) => {
        expect(emp.department).toBe('Sales');
      });
    });

    it('14. should mask sensitive fields (salary, address, emergency contact) from regular employees in directory', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      res.body.employees.forEach((emp) => {
        expect(emp.salary).toBeUndefined();
        expect(emp.address).toBeUndefined();
        expect(emp.emergencyContact).toBeUndefined();
      });
    });

    it('15. should allow HR to view full employee directory including salary and details', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.statusCode).toBe(200);
      // HR sees salary on records
      const hasSalary = res.body.employees.some((emp) => emp.salary !== undefined && emp.salary > 0);
      expect(hasSalary).toBe(true);
    });

    it('16. should allow Manager to view team members via /api/employees/team', async () => {
      const res = await request(app)
        .get('/api/employees/team')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // All returned employees report to manager bob
      res.body.team.forEach((member) => {
        expect(member.reportingManager._id.toString()).toBe(managerUser._id.toString());
      });
    });
  });
});
