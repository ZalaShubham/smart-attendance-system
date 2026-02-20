/**
 * Timetable Model - Class schedules
 */
import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required']
    },
    classroom: {
      type: String,
      required: [true, 'Classroom is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      // Format: "09:00"
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      // Format: "10:00"
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6
      // 0=Sunday, 1=Monday, ..., 6=Saturday
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Timetable', timetableSchema);
