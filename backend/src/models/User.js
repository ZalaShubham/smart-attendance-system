/**
 * User Model - Students, Teachers, Admin
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    interests: [{
      type: String
    }],
    goals: [{
      type: String
    }],
    // For students: weak subjects or improvement areas
    improvementAreas: [{
      type: String
    }],
    // Face recognition: stored face descriptor (base64 encoded)
    facePhoto: {
      type: String,
      // Base64 encoded image data
    },
    faceDescriptor: {
      type: String,
      // JSON stringified face descriptor from face-api.js
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
