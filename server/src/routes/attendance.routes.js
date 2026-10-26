const express = require('express');
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  getAttendanceById
} = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Employee self check-in / check-out
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

// Today's status and personal attendance history
router.get('/today', protect, getTodayAttendance);
router.get('/me', protect, getMyAttendance);

// Manager / HR team attendance view
router.get('/team', protect, authorize('manager', 'hr'), getTeamAttendance);

// Organization-wide reporting (HR only)
router.get('/', protect, authorize('hr'), getAllAttendance);

// Specific attendance record inspection
router.get('/:id', protect, getAttendanceById);

module.exports = router;
