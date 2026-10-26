const express = require('express');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateProfileUpdate } = require('../middleware/validate.middleware');

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, validateProfileUpdate, updateMyProfile);

module.exports = router;
