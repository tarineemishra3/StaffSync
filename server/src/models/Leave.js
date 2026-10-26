const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required'],
      index: true
    },
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: {
        values: ['casual', 'sick', 'annual', 'unpaid'],
        message: 'Leave type must be casual, sick, annual, or unpaid'
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Leave start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Leave end date is required']
    },
    totalDays: {
      type: Number,
      required: [true, 'Total number of leave days is required'],
      min: [1, 'Leave duration must be at least 1 day']
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave application is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters long'],
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: 'Status must be pending, approved, rejected, or cancelled'
      },
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewRemarks: {
      type: String,
      trim: true,
      maxlength: [300, 'Review remarks cannot exceed 300 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
leaveSchema.index({ user: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
