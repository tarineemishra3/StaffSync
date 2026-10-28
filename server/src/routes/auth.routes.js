const express = require('express');
const {
  register,
  login,
  getMe,
  createUser,
  demoLogin
} = require('../controllers/auth.controller');
const {
  validateRegister,
  validateLogin
} = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/demo-login', demoLogin);

// Protected routes (any authenticated user)
router.get('/me', protect, getMe);

// Protected administrative creation (HR only)
router.post('/create-user', protect, authorize('hr'), validateRegister, createUser);

// Role-restricted verification endpoints (used for RBAC testing & validation)
router.get('/manager-only', protect, authorize('manager', 'hr'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Manager/HR portal',
    role: req.user.role
  });
});

router.get('/hr-only', protect, authorize('hr'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to HR-exclusive portal',
    role: req.user.role
  });
});

module.exports = router;
