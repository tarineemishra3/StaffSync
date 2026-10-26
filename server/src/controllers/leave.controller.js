const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const Profile = require('../models/Profile');
const User = require('../models/User');

/**
 * @desc    Submit a new leave application
 * @route   POST /api/leaves
 * @access  Private (All authenticated employees)
 */
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid start and end dates are required.'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range: End date cannot be earlier than start date.'
      });
    }

    // Calculate total inclusive days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping active leaves for the same employee
    const overlapping = await Leave.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending leave request overlapping with these dates.'
      });
    }

    const leave = await Leave.create({
      user: req.user._id,
      leaveType: leaveType ? leaveType.toLowerCase() : 'casual',
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      leave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in employee's own leave applications
 * @route   GET /api/leaves/me
 * @access  Private
 */
const getMyLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      leaves
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team leave requests for Manager & HR
 * @route   GET /api/leaves/team
 * @access  Private (Manager & HR)
 */
const getTeamLeaves = async (req, res, next) => {
  try {
    let teamUserIds = [];

    if (req.user.role === 'manager') {
      const reports = await Profile.find({ reportingManager: req.user._id }).select('user');
      teamUserIds = reports.map((r) => r.user);
    } else if (req.user.role === 'hr') {
      const allProfiles = await Profile.find({}).select('user');
      teamUserIds = allProfiles.map((p) => p.user);
    }

    const filter = { user: { $in: teamUserIds } };
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    const leaves = await Leave.find(filter)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get organization-wide leave requests
 * @route   GET /api/leaves
 * @access  Private (HR only)
 */
const getAllLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }
    if (req.query.leaveType) {
      filter.leaveType = req.query.leaveType.toLowerCase();
    }

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      leaves
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single leave application details
 * @route   GET /api/leaves/:id
 * @access  Private (Applicant, Reporting Manager, or HR)
 */
const getLeaveById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request identifier.'
      });
    }

    const leave = await Leave.findById(id)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email role');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.'
      });
    }

    const isOwner = leave.user._id.toString() === req.user._id.toString();
    const isHR = req.user.role === 'hr';

    let isManagerOfEmployee = false;
    if (req.user.role === 'manager') {
      const profile = await Profile.findOne({ user: leave.user._id });
      if (profile && profile.reportingManager && profile.reportingManager.toString() === req.user._id.toString()) {
        isManagerOfEmployee = true;
      }
    }

    if (!isOwner && !isHR && !isManagerOfEmployee) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this leave application.'
      });
    }

    res.status(200).json({
      success: true,
      leave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a leave application
 * @route   PATCH /api/leaves/:id/review
 * @access  Private (Reporting Manager or HR)
 */
const reviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request identifier.'
      });
    }

    const { status, reviewRemarks } = req.body;
    if (!status || !['approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Decision status must be 'approved' or 'rejected'."
      });
    }

    const targetLeave = await Leave.findById(id);
    if (!targetLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.'
      });
    }

    // STRICT RULE: An employee cannot approve or reject their own leave request
    if (targetLeave.user.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of interest violation: You cannot approve or reject your own leave application.'
      });
    }

    // Manager boundary check: If reviewer is manager (and not HR), verify report relationship
    if (req.user.role === 'manager') {
      const applicantProfile = await Profile.findOne({ user: targetLeave.user });
      const isDirectReport =
        applicantProfile &&
        applicantProfile.reportingManager &&
        applicantProfile.reportingManager.toString() === req.user._id.toString();

      if (!isDirectReport) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only review leave applications for members of your direct reporting team.'
        });
      }
    }

    // ATOMIC UPDATE: Guarantees no race condition or double review
    const updatedLeave = await Leave.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        $set: {
          status: status.toLowerCase(),
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          reviewRemarks: reviewRemarks ? String(reviewRemarks).trim() : ''
        }
      },
      { new: true }
    )
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email role');

    if (!updatedLeave) {
      return res.status(400).json({
        success: false,
        message: 'This leave application is no longer pending or has already been reviewed.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave request has been ${updatedLeave.status}.`,
      leave: updatedLeave
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a pending leave request (by applicant)
 * @route   PATCH /api/leaves/:id/cancel
 * @access  Private (Applicant only)
 */
const cancelLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request identifier.'
      });
    }

    const cancelledLeave = await Leave.findOneAndUpdate(
      { _id: id, user: req.user._id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!cancelledLeave) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel request: Only pending requests submitted by yourself can be cancelled.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leave application cancelled successfully.',
      leave: cancelledLeave
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  getLeaveById,
  reviewLeave,
  cancelLeave
};
