const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    // Normalized business calendar date string: 'YYYY-MM-DD' (UTC/Server Business Date)
    date: {
      type: String,
      required: [true, 'Attendance date string (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true
    },
    checkInTime: {
      type: Date,
      required: [true, 'Check-in timestamp is required']
    },
    checkOutTime: {
      type: Date,
      default: null
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, 'Total working hours cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'half-day', 'leave'],
        message: 'Status must be present, absent, half-day, or leave'
      },
      default: 'present'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index prevents duplicate check-in documents for the same employee and date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
