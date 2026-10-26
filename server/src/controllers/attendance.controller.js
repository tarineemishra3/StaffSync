const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Profile = require('../models/Profile');
const User = require('../models/User');

/**
 * Returns normalized UTC/business date string in 'YYYY-MM-DD' format.
 */
const getTodayDateString = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * @desc    Record daily employee check-in
 * @route   POST /api/attendance/check-in
 * @access  Private (All active authenticated users)
 */
const checkIn = async (req, res, next) => {
  try {
    const today = getTodayDateString();

    // Check for existing check-in on the same business workday
    const existingRecord = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate check-in rejected: You have already checked in for today.',
        record: existingRecord
      });
    }

    const checkInTime = new Date();
    const dayOfWeek = checkInTime.getUTCDay(); // 0 is Sunday, 6 is Saturday
    let remarks = req.body.remarks ? String(req.body.remarks).trim() : '';

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      remarks = remarks ? `${remarks} (Weekend Shift)` : 'Weekend Shift';
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: today,
      checkInTime,
      status: 'present',
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully.',
      attendance
    });
  } catch (error) {
    // Catch database duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate check-in rejected: You have already checked in for today.'
      });
    }
    next(error);
  }
};

/**
 * @desc    Record daily employee check-out & compute total hours
 * @route   POST /api/attendance/check-out
 * @access  Private (All active authenticated users)
 */
const checkOut = async (req, res, next) => {
  try {
    const today = getTodayDateString();

    // Find the active attendance document for today (or the most recent unclosed check-in)
    let attendance = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    // If no record today, check if there is an unclosed overnight check-in from yesterday
    if (!attendance) {
      attendance = await Attendance.findOne({
        user: req.user._id,
        checkOutTime: null
      }).sort({ createdAt: -1 });
    }

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out: No active check-in record found. Please check in first.'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out for this shift.',
        attendance
      });
    }

    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - attendance.checkInTime.getTime();

    if (diffMs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timestamp sequence: Checkout time cannot be earlier than check-in time.'
      });
    }

    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = totalHours;

    // Shift calculation rules:
    // >= 8 hours = Full Day Present
    // >= 4 hours and < 8 hours = Half-Day
    // < 4 hours = Present (partial hours logged)
    if (totalHours >= 8) {
      attendance.status = 'present';
    } else if (totalHours >= 4) {
      attendance.status = 'half-day';
    }

    if (req.body.remarks) {
      attendance.remarks = attendance.remarks
        ? `${attendance.remarks}; ${String(req.body.remarks).trim()}`
        : String(req.body.remarks).trim();
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's today attendance status
 * @route   GET /api/attendance/today
 * @access  Private
 */
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const record = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    res.status(200).json({
      success: true,
      date: today,
      hasCheckedIn: !!record,
      hasCheckedOut: !!(record && record.checkOutTime),
      attendance: record || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in employee's attendance history
 * @route   GET /api/attendance/me
 * @access  Private
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    // Optional month filter (e.g., '2026-10')
    if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
      filter.date = { $regex: `^${req.query.month}` };
    }

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Summary calculations
    const allRecords = await Attendance.find(filter).select('status totalHours');
    const totalPresent = allRecords.filter((r) => r.status === 'present').length;
    const totalHalfDay = allRecords.filter((r) => r.status === 'half-day').length;
    const totalHoursSum = allRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      records,
      summary: {
        totalDays: allRecords.length,
        totalPresent,
        totalHalfDay,
        totalWorkingHours: Math.round(totalHoursSum * 100) / 100,
        averageHours: allRecords.length
          ? Math.round((totalHoursSum / allRecords.length) * 100) / 100
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team attendance for Manager & HR
 * @route   GET /api/attendance/team
 * @access  Private (Manager & HR)
 */
const getTeamAttendance = async (req, res, next) => {
  try {
    const targetDate = req.query.date || getTodayDateString();

    let teamUserIds = [];

    if (req.user.role === 'manager') {
      const reports = await Profile.find({ reportingManager: req.user._id }).select('user');
      teamUserIds = reports.map((r) => r.user);
    } else if (req.user.role === 'hr') {
      // HR can view all or filter by department
      let profileFilter = {};
      if (req.query.department) {
        profileFilter.department = new RegExp(`^${req.query.department.trim()}$`, 'i');
      }
      const allProfiles = await Profile.find(profileFilter).select('user');
      teamUserIds = allProfiles.map((p) => p.user);
    }

    const attendanceRecords = await Attendance.find({
      user: { $in: teamUserIds },
      date: targetDate
    })
      .populate('user', 'name email role')
      .lean();

    res.status(200).json({
      success: true,
      date: targetDate,
      count: attendanceRecords.length,
      attendance: attendanceRecords
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get organization-wide attendance report
 * @route   GET /api/attendance
 * @access  Private (HR only)
 */
const getAllAttendance = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.date) {
      filter.date = req.query.date;
    }
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      filter.user = req.query.userId;
    }

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate('user', 'name email role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific attendance record by ID
 * @route   GET /api/attendance/:id
 * @access  Private (Owner, Manager of employee, or HR)
 */
const getAttendanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance identifier.'
      });
    }

    const record = await Attendance.findById(id).populate('user', 'name email role');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    const isOwner = record.user._id.toString() === req.user._id.toString();
    const isHR = req.user.role === 'hr';

    let isManagerOfEmployee = false;
    if (req.user.role === 'manager') {
      const profile = await Profile.findOne({ user: record.user._id });
      if (profile && profile.reportingManager && profile.reportingManager.toString() === req.user._id.toString()) {
        isManagerOfEmployee = true;
      }
    }

    if (!isOwner && !isHR && !isManagerOfEmployee) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this attendance record.'
      });
    }

    res.status(200).json({
      success: true,
      attendance: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  getAttendanceById
};
