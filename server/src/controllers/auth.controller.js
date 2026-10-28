const User = require('../models/User');
const { signToken } = require('../utils/jwt');

/**
 * @desc    Register a new user (Public)
 * @route   POST /api/auth/register
 * @access  Public (Role strictly defaults to 'employee')
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Role is strictly locked to 'employee' for public registrations.
    // Any self-assigned 'manager' or 'hr' attempt is ignored.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'employee',
      status: 'active'
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & obtain token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user and include hidden password field for verification
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact HR.'
      });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Controlled administrative user creation (HR only)
 * @route   POST /api/auth/create-user
 * @access  Private (HR only)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, status } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'employee',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: `User created successfully with role: ${user.role}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Demo login — find or create a demo account with the requested role
 * @route   POST /api/auth/demo-login
 * @access  Public (creates accounts scoped to @staffsync.demo domain only)
 */
const demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['employee', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid demo role. Must be employee, manager, or hr.'
      });
    }

    const demoEmail = `${role}.demo@staffsync.demo`;
    const demoPassword = 'DemoPass123!';
    const demoName = `${role.charAt(0).toUpperCase() + role.slice(1)} Demo`;

    // Find existing demo user or create one with the correct role
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: demoName,
        email: demoEmail,
        password: demoPassword,
        role: role,       // <-- this is the key difference from register()
        status: 'active'
      });
    } else if (user.role !== role) {
      // If the demo user exists but somehow has the wrong role, fix it
      user.role = role;
      user.status = 'active';
      await user.save();
    } else if (user.status !== 'active') {
      user.status = 'active';
      await user.save();
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: `Demo login as ${role}`,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  createUser,
  demoLogin
};
