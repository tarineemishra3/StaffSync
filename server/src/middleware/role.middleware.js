/**
 * Role-based authorization middleware.
 * Usage: authorize('hr'), authorize('hr', 'manager')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = { authorize };
