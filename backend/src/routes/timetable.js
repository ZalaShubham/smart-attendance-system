/**
 * Timetable Routes
 */
import express from 'express';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import { protect, teacher } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetable (filter by day/teacherId or all)
router.get('/', protect, async (req, res) => {
  try {
    const { day, teacherId } = req.query;
    const query = {};
    if (day !== undefined) query.dayOfWeek = parseInt(day);
    if (teacherId) query.teacher = teacherId;
    const timetable = await Timetable.find(query).populate('teacher', 'name email').sort({ dayOfWeek: 1, startTime: 1 });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/timetable
// @desc    Create timetable entry (teacher/admin)
router.post('/', protect, teacher, async (req, res) => {
  try {
    const { subject, classroom, startTime, endTime, dayOfWeek, teacherId } = req.body;

    let teacherForEntry = req.user._id;
    if (req.user.role === 'admin') {
      if (!teacherId) return res.status(400).json({ message: 'teacherId is required for admin' });
      const teacherUser = await User.findById(teacherId).select('_id role');
      if (!teacherUser) return res.status(404).json({ message: 'Teacher not found' });
      if (teacherUser.role !== 'teacher') return res.status(400).json({ message: 'teacherId must belong to a teacher' });
      teacherForEntry = teacherUser._id;
    }

    const entry = await Timetable.create({
      subject,
      classroom,
      startTime,
      endTime,
      dayOfWeek,
      teacher: teacherForEntry
    });
    const populated = await Timetable.findById(entry._id).populate('teacher', 'name email');

    // Notify teacher when admin creates an entry
    if (req.user.role === 'admin' && populated.teacher?.email) {
      sendEmail({
        to: populated.teacher.email,
        subject: 'Timetable updated by admin',
        text: `Dear ${populated.teacher.name || 'Teacher'},\n\nAn admin has created a new timetable entry for you:\n\nSubject: ${subject}\nClassroom: ${classroom}\nDay: ${dayOfWeek}\nTime: ${startTime} - ${endTime}\n\nIf you think this is incorrect, please contact the admin.\n\nRegards,\nSmart Attendance System`
      });
    }
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update timetable entry
router.put('/:id', protect, teacher, async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.user.role !== 'admin') {
      // Teachers cannot re-assign entries between teachers
      delete update.teacher;
      delete update.teacherId;
    } else if (update.teacherId) {
      const teacherUser = await User.findById(update.teacherId).select('_id role');
      if (!teacherUser) return res.status(404).json({ message: 'Teacher not found' });
      if (teacherUser.role !== 'teacher') return res.status(400).json({ message: 'teacherId must belong to a teacher' });
      update.teacher = teacherUser._id;
      delete update.teacherId;
    }

    const entry = await Timetable.findByIdAndUpdate(req.params.id, update, { new: true }).populate('teacher', 'name email');
    if (!entry) return res.status(404).json({ message: 'Timetable entry not found' });

    // Notify teacher when admin updates an entry
    if (req.user.role === 'admin' && entry.teacher?.email) {
      sendEmail({
        to: entry.teacher.email,
        subject: 'Timetable changed by admin',
        text: `Dear ${entry.teacher.name || 'Teacher'},\n\nAn admin has updated one of your timetable entries:\n\nSubject: ${entry.subject}\nClassroom: ${entry.classroom}\nDay: ${entry.dayOfWeek}\nTime: ${entry.startTime} - ${entry.endTime}\n\nIf you think this is incorrect, please contact the admin.\n\nRegards,\nSmart Attendance System`
      });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Delete timetable entry
router.delete('/:id', protect, teacher, async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Timetable entry not found' });

    // Notify teacher when admin deletes an entry
    if (req.user.role === 'admin') {
      const teacherUser = await User.findById(entry.teacher).select('name email');
      if (teacherUser?.email) {
        sendEmail({
          to: teacherUser.email,
          subject: 'Timetable entry removed by admin',
          text: `Dear ${teacherUser.name || 'Teacher'},\n\nAn admin has removed one of your timetable entries:\n\nSubject: ${entry.subject}\nClassroom: ${entry.classroom}\nDay: ${entry.dayOfWeek}\nTime: ${entry.startTime} - ${entry.endTime}\n\nIf you think this is incorrect, please contact the admin.\n\nRegards,\nSmart Attendance System`
        });
      }
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
