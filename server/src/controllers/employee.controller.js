const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

/**
 * @desc    Get paginated employee directory with search & filters
 * @route   GET /api/employees
 * @access  Private (All authenticated users; HR sees full data, others see sanitized view)
 */
const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, department, role, status } = req.query;

    // Build User filter conditions
    const userConditions = {};

    // Role filter
    if (role && ['employee', 'manager', 'hr'].includes(role.toLowerCase())) {
      userConditions.role = role.toLowerCase();
    }

    // Status filter: Non-HR users can ONLY view active employees
    if (req.user.role === 'hr') {
      if (status && ['active', 'inactive'].includes(status.toLowerCase())) {
        userConditions.status = status.toLowerCase();
      }
    } else {
      userConditions.status = 'active';
    }

    // Search filter across User name/email or Profile department/designation
    let matchingUserIds = null;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Find user IDs matching name or email
      const usersMatchingName = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
        ...userConditions
      }).select('_id');

      // Find profile user IDs matching department or designation
      const profilesMatchingRole = await Profile.find({
        $or: [{ department: searchRegex }, { designation: searchRegex }]
      }).select('user');

      const combinedIds = [
        ...usersMatchingName.map((u) => u._id.toString()),
        ...profilesMatchingRole.map((p) => p.user.toString())
      ];

      matchingUserIds = [...new Set(combinedIds)].map((id) => new mongoose.Types.ObjectId(id));
    }

    // Build Profile query filter
    const profileFilter = {};
    if (department && department.trim()) {
      profileFilter.department = new RegExp(`^${department.trim()}$`, 'i');
    }

    // Combine with User filter
    if (matchingUserIds !== null) {
      profileFilter.user = { $in: matchingUserIds };
    } else if (Object.keys(userConditions).length > 0) {
      const eligibleUsers = await User.find(userConditions).select('_id');
      profileFilter.user = { $in: eligibleUsers.map((u) => u._id) };
    }

    const total = await Profile.countDocuments(profileFilter);

    // Build query with projection rules
    let profileQuery = Profile.find(profileFilter)
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Strictly omit salary for non-HR users
    if (req.user.role !== 'hr') {
      profileQuery = profileQuery.select('-salary');
    }

    const profiles = await profileQuery.lean();

    // Sanitize non-HR views further (omit sensitive private address & emergency contact)
    const sanitized = profiles.map((p) => {
      if (req.user.role !== 'hr') {
        delete p.salary;
        // Non-HR directory users don't see colleagues' home addresses or emergency contacts
        delete p.address;
        delete p.emergencyContact;
      }
      return p;
    });

    res.status(200).json({
      success: true,
      count: sanitized.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      employees: sanitized
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team members for Manager
 * @route   GET /api/employees/team
 * @access  Private (Manager & HR)
 */
const getTeamEmployees = async (req, res, next) => {
  try {
    let teamFilter = {};

    if (req.user.role === 'manager') {
      // Find employees reporting to this manager
      teamFilter = { reportingManager: req.user._id };
    }

    const teamProfiles = await Profile.find(teamFilter)
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email')
      .select(req.user.role === 'hr' ? '' : '-salary')
      .lean();

    res.status(200).json({
      success: true,
      count: teamProfiles.length,
      team: teamProfiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single employee profile by User ID or Profile ID
 * @route   GET /api/employees/:id
 * @access  Private (Role-controlled data view)
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee identifier.'
      });
    }

    // Try finding by user ID first, then by profile ID
    let profile = await Profile.findOne({
      $or: [{ user: id }, { _id: id }]
    })
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email role')
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    const isSelf = req.user._id.toString() === profile.user._id.toString();
    const isHR = req.user.role === 'hr';
    const isManagerOfEmployee =
      profile.reportingManager &&
      req.user._id.toString() === profile.reportingManager._id.toString();

    // Field masking rules:
    // 1. Salary is only visible to HR and the employee themselves
    if (!isHR && !isSelf) {
      delete profile.salary;
    }

    // 2. Address & Emergency Contact visible to HR, Manager, or Self
    if (!isHR && !isSelf && !isManagerOfEmployee) {
      delete profile.address;
      delete profile.emergencyContact;
    }

    res.status(200).json({
      success: true,
      employee: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new employee record (User + Profile)
 * @route   POST /api/employees
 * @access  Private (HR only)
 */
const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      address,
      salary,
      reportingManager,
      dateOfJoining,
      skills,
      bio,
      status
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Validate reportingManager if provided
    if (reportingManager) {
      if (!mongoose.Types.ObjectId.isValid(reportingManager)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reporting manager ID.'
        });
      }
      const managerExists = await User.findById(reportingManager);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: 'Reporting manager user not found.'
        });
      }
    }

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password || 'Welcome@StaffSync2026',
      role: role || 'employee',
      status: status || 'active'
    });

    // Create linked Profile
    const profile = await Profile.create({
      user: user._id,
      department: department || 'General',
      designation: designation || 'Staff Member',
      phone: phone || '',
      address: address || '',
      salary: salary !== undefined ? Number(salary) : 0,
      reportingManager: reportingManager || null,
      dateOfJoining: dateOfJoining || new Date(),
      skills: Array.isArray(skills) ? skills : [],
      bio: bio || ''
    });

    const populated = await Profile.findById(profile._id)
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee profile & work details
 * @route   PUT /api/employees/:id
 * @access  Private (HR only)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee identifier.'
      });
    }

    // Find profile by user ID or profile ID
    let profile = await Profile.findOne({
      $or: [{ user: id }, { _id: id }]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    const {
      name,
      role,
      status,
      department,
      designation,
      phone,
      address,
      salary,
      reportingManager,
      dateOfJoining,
      skills,
      bio,
      emergencyContact
    } = req.body;

    // Check reporting manager constraint: cannot report to oneself
    if (reportingManager) {
      if (reportingManager.toString() === profile.user.toString()) {
        return res.status(400).json({
          success: false,
          message: 'An employee cannot be assigned as their own reporting manager.'
        });
      }
      if (!mongoose.Types.ObjectId.isValid(reportingManager)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reporting manager ID.'
        });
      }
    }

    // Update User model fields if provided
    const userUpdates = {};
    if (name) userUpdates.name = name.trim();
    if (role && ['employee', 'manager', 'hr'].includes(role.toLowerCase())) {
      userUpdates.role = role.toLowerCase();
    }
    if (status && ['active', 'inactive'].includes(status.toLowerCase())) {
      userUpdates.status = status.toLowerCase();
    }
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(profile.user, userUpdates);
    }

    // Update Profile fields
    if (department !== undefined) profile.department = department.trim();
    if (designation !== undefined) profile.designation = designation.trim();
    if (phone !== undefined) profile.phone = phone.trim();
    if (address !== undefined) profile.address = address.trim();
    if (salary !== undefined) profile.salary = Math.max(0, Number(salary));
    if (reportingManager !== undefined) profile.reportingManager = reportingManager || null;
    if (dateOfJoining !== undefined) profile.dateOfJoining = dateOfJoining;
    if (Array.isArray(skills)) profile.skills = skills;
    if (bio !== undefined) profile.bio = bio.trim();
    if (emergencyContact) profile.emergencyContact = emergencyContact;

    await profile.save();

    const updatedProfile = await Profile.findById(profile._id)
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate or activate employee account
 * @route   PATCH /api/employees/:id/status
 * @access  Private (HR only)
 */
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee identifier.'
      });
    }

    // Find target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // SAFETY LOCK: Prevent HR from deactivating themselves
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrative security violation: You cannot deactivate your own HR account.'
      });
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'inactive'."
      });
    }

    targetUser.status = status.toLowerCase();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Employee account status updated to '${targetUser.status}'.`,
      status: targetUser.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getTeamEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus
};
