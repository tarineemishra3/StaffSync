const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    department: {
      type: String,
      trim: true,
      default: 'General'
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff Member'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      relationship: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' }
    },
    dateOfJoining: {
      type: Date,
      default: Date.now
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    salary: {
      type: Number,
      default: 0,
      min: [0, 'Salary cannot be negative']
    },
    skills: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for directory searches
profileSchema.index({ department: 1 });
profileSchema.index({ designation: 1 });
profileSchema.index({ reportingManager: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
