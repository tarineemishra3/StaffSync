const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'staffsync_dev_jwt_secret_fallback_key_2026';
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

/**
 * Sign a new JWT containing user ID and role
 */
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn()
    }
  );
};

/**
 * Verify and decode a JWT
 */
const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  signToken,
  verifyToken
};
