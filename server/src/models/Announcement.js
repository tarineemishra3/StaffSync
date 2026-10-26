const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      minlength: [10, 'Content must be at least 10 characters long']
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'urgent'],
        message: 'Priority must be low, normal, high, or urgent'
      },
      default: 'normal'
    },
    targetDepartment: {
      type: String,
      trim: true,
      default: 'All'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({ targetDepartment: 1, publishedAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
