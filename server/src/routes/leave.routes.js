const express = require('express');
const {
  applyLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  getLeaveById,
  reviewLeave,
  cancelLeave
} = require('../controllers/leave.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  validateLeaveApply,
  validateLeaveReview
} = require('../middleware/validate.middleware');

const router = express.Router();

// Self leave application and history
router.post('/', protect, validateLeaveApply, applyLeave);
router.get('/me', protect, getMyLeaves);

// Manager team leave requests
router.get('/team', protect, authorize('manager', 'hr'), getTeamLeaves);

// HR organization-wide leave requests
router.get('/', protect, authorize('hr'), getAllLeaves);

// Single leave details
router.get('/:id', protect, getLeaveById);

// Manager or HR decision review (approve/reject)
router.patch('/:id/review', protect, authorize('manager', 'hr'), validateLeaveReview, reviewLeave);

// Self-cancellation of pending request
router.patch('/:id/cancel', protect, cancelLeave);

module.exports = router;
