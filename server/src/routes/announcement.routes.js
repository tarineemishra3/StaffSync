const express = require('express');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcement.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// All authenticated users can view announcements
router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncementById);

// HR only: create, update, delete
router.post('/', protect, authorize('hr'), createAnnouncement);
router.put('/:id', protect, authorize('hr'), updateAnnouncement);
router.delete('/:id', protect, authorize('hr'), deleteAnnouncement);

module.exports = router;
