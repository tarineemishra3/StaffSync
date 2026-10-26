const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Excluded from default queries for security
    },
    role: {
      type: String,
      enum: {
        values: ['employee', 'manager', 'hr'],
        message: 'Role must be either employee, manager, or hr'
      },
      default: 'employee'
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive'
      },
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Hash password before saving if it has been modified or created
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password against stored bcrypt hash
userSchema.methods.matchPassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
