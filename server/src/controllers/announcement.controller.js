const Announcement = require('../models/Announcement');

/**
 * @desc    Get all announcements (optionally filtered by department)
 * @route   GET /api/announcements
 * @access  Private (All authenticated users)
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.department && req.query.department !== 'All') {
      filter.$or = [
        { targetDepartment: 'All' },
        { targetDepartment: new RegExp(`^${req.query.department.trim()}$`, 'i') }
      ];
    }
    if (req.query.priority) {
      filter.priority = req.query.priority.toLowerCase();
    }

    const total = await Announcement.countDocuments(filter);
    const announcements = await Announcement.find(filter)
      .populate('author', 'name email role')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: announcements.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      announcements
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Private
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'name email role')
      .lean();

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    res.status(200).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (HR only)
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, targetDepartment } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement title is required.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement content is required.' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'normal',
      targetDepartment: targetDepartment || 'All',
      author: req.user._id,
      publishedAt: new Date()
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully.',
      announcement: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (HR only)
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const { title, content, priority, targetDepartment } = req.body;
    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (priority !== undefined) announcement.priority = priority;
    if (targetDepartment !== undefined) announcement.targetDepartment = targetDepartment;

    await announcement.save();

    const updated = await Announcement.findById(announcement._id)
      .populate('author', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (HR only)
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    res.status(200).json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
