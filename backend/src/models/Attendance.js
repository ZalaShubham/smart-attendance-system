/**
 * Attendance Model - Student attendance records
 */
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required']
    },
    time: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['qr', 'proximity', 'face'],
      required: true
    },
    lectureId: {
      type: String,
      // For linking to specific QR session
    }
  },
  {
    timestamps: true
  }
);

// Sparse unique index - only for QR when lectureId exists
attendanceSchema.index(
  { student: 1, subject: 1, lectureId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model('Attendance', attendanceSchema);
