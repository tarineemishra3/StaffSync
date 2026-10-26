const express = require('express');
const {
  getEmployees,
  getTeamEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus
} = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  validateEmployeeCreate,
  validateEmployeeUpdate
} = require('../middleware/validate.middleware');

const router = express.Router();

// Directory search & pagination (accessible to all authenticated users; fields masked by role)
router.get('/', protect, getEmployees);

// Manager team directory
router.get('/team', protect, authorize('manager', 'hr'), getTeamEmployees);

// View individual employee details
router.get('/:id', protect, getEmployeeById);

// HR employee management
router.post('/', protect, authorize('hr'), validateEmployeeCreate, createEmployee);
router.put('/:id', protect, authorize('hr'), validateEmployeeUpdate, updateEmployee);
router.patch('/:id/status', protect, authorize('hr'), updateEmployeeStatus);

module.exports = router;
