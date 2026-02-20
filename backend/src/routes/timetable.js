/**
 * Timetable Routes
 */
import express from 'express';
import Timetable from '../models/Timetable.js';
import { protect, teacher } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetable (filter by day or all)
router.get('/', protect, async (req, res) => {
  try {
    const { day } = req.query;
    const query = {};
    if (day !== undefined) query.dayOfWeek = parseInt(day);
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
    const { subject, classroom, startTime, endTime, dayOfWeek } = req.body;
    const entry = await Timetable.create({
      subject,
      classroom,
      startTime,
      endTime,
      dayOfWeek,
      teacher: req.user._id
    });
    const populated = await Timetable.findById(entry._id).populate('teacher', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update timetable entry
router.put('/:id', protect, teacher, async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('teacher', 'name email');
    if (!entry) return res.status(404).json({ message: 'Timetable entry not found' });
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
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
