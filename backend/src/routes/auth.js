/**
 * Authentication Routes
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register user (student/teacher)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, interests, goals, improvementAreas } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      interests: interests || [],
      goals: goals || [],
      improvementAreas: improvementAreas || []
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests,
      goals: user.goals,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests,
      goals: user.goals,
      improvementAreas: user.improvementAreas,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/auth/profile
// @desc    Update profile (interests, goals, etc.)
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.interests = req.body.interests ?? user.interests;
    user.goals = req.body.goals ?? user.goals;
    user.improvementAreas = req.body.improvementAreas ?? user.improvementAreas;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/enroll-face
// @desc    Enroll face photo and descriptor (first time setup)
router.post('/enroll-face', protect, async (req, res) => {
  try {
    const { facePhoto, faceDescriptor } = req.body;
    if (!facePhoto || !faceDescriptor) {
      return res.status(400).json({ message: 'Face photo and descriptor required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.facePhoto = facePhoto;
    user.faceDescriptor = JSON.stringify(faceDescriptor);
    await user.save();
    res.json({ message: 'Face enrolled successfully', hasFace: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/face-status
// @desc    Check if user has enrolled face
router.get('/face-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('facePhoto faceDescriptor');
    res.json({ hasFace: !!(user.facePhoto && user.faceDescriptor) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
