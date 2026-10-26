const Profile = require('../models/Profile');
const User = require('../models/User');

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/profile/me
 * @access  Private (All authenticated users)
 */
const getMyProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email');

    // Auto-provision profile if user doesn't have one yet
    if (!profile) {
      profile = await Profile.create({
        user: req.user._id,
        department: 'General',
        designation: 'Staff Member'
      });
      profile = await Profile.findById(profile._id)
        .populate('user', 'name email role status createdAt')
        .populate('reportingManager', 'name email');
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current logged-in user profile (Personal fields only)
 * @route   PUT /api/profile/me
 * @access  Private (All authenticated users)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { phone, address, emergencyContact, skills, bio, name } = req.body;

    // Strict whitelist: Employees may only update personal contact/bio fields.
    // Disallowed fields (role, department, designation, salary, status, etc.) are stripped.
    const updateData = {};
    if (phone !== undefined) updateData.phone = typeof phone === 'string' ? phone.trim() : '';
    if (address !== undefined) updateData.address = typeof address === 'string' ? address.trim() : '';
    if (bio !== undefined) updateData.bio = typeof bio === 'string' ? bio.trim() : '';
    if (Array.isArray(skills)) updateData.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    if (emergencyContact && typeof emergencyContact === 'object') {
      updateData.emergencyContact = {
        name: emergencyContact.name ? String(emergencyContact.name).trim() : '',
        relationship: emergencyContact.relationship ? String(emergencyContact.relationship).trim() : '',
        phone: emergencyContact.phone ? String(emergencyContact.phone).trim() : ''
      };
    }

    // Optionally allow updating name in User model
    if (name && typeof name === 'string' && name.trim().length >= 2) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    let profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate('user', 'name email role status createdAt')
      .populate('reportingManager', 'name email');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile
};
