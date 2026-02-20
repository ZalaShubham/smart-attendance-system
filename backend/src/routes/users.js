/**
 * User Routes (admin/teacher)
 */
import express from 'express';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/students
// @desc    Get all students (teacher/admin)
router.get('/students', protect, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
