const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates public registration request payload.
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates login request payload.
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required.');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates self profile update payload.
 */
const validateProfileUpdate = (req, res, next) => {
  const { bio, name } = req.body;
  const errors = [];

  if (bio && typeof bio === 'string' && bio.length > 500) {
    errors.push('Bio cannot exceed 500 characters.');
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates HR employee creation payload.
 */
const validateEmployeeCreate = (req, res, next) => {
  const { name, email, role, salary } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (role && !['employee', 'manager', 'hr'].includes(role.toLowerCase())) {
    errors.push("Role must be 'employee', 'manager', or 'hr'.");
  }

  if (salary !== undefined && (isNaN(Number(salary)) || Number(salary) < 0)) {
    errors.push('Salary must be a non-negative number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates HR employee update payload.
 */
const validateEmployeeUpdate = (req, res, next) => {
  const { role, salary, name } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (role && !['employee', 'manager', 'hr'].includes(role.toLowerCase())) {
    errors.push("Role must be 'employee', 'manager', or 'hr'.");
  }

  if (salary !== undefined && (isNaN(Number(salary)) || Number(salary) < 0)) {
    errors.push('Salary must be a non-negative number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates leave application payload.
 */
const validateLeaveApply = (req, res, next) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const errors = [];

  if (leaveType && !['casual', 'sick', 'annual', 'unpaid'].includes(leaveType.toLowerCase())) {
    errors.push("Leave type must be 'casual', 'sick', 'annual', or 'unpaid'.");
  }

  if (!startDate) {
    errors.push('Start date is required.');
  }

  if (!endDate) {
    errors.push('End date is required.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    errors.push('Reason is required and must be at least 5 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

/**
 * Validates leave review decision payload.
 */
const validateLeaveReview = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status || !['approved', 'rejected'].includes(status.toLowerCase())) {
    errors.push("Review decision status must be 'approved' or 'rejected'.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join('. '),
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateLeaveApply,
  validateLeaveReview
};
