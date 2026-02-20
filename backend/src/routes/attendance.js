/**
 * Attendance Routes
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { protect, teacher } from '../middleware/auth.js';

const router = express.Router();

// Helper: Calculate Euclidean distance between two face descriptors
function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

// Helper: Verify face descriptor matches stored one
async function verifyFace(studentId, providedDescriptor) {
  try {
    const user = await User.findById(studentId).select('faceDescriptor');
    if (!user || !user.faceDescriptor) {
      return { verified: false, reason: 'Face not enrolled' };
    }
    const storedDescriptor = JSON.parse(user.faceDescriptor);
    const distance = euclideanDistance(storedDescriptor, providedDescriptor);
    // Threshold: lower distance = more similar (typically < 0.6 for same person)
    const threshold = 0.6;
    return {
      verified: distance < threshold,
      distance,
      reason: distance < threshold ? 'Face verified' : 'Face mismatch'
    };
  } catch (error) {
    return { verified: false, reason: 'Verification error' };
  }
}

// In-memory store for active QR sessions (lectureId -> { subject, expiresAt })
const activeQRSessions = new Map();

// Helper: Clean expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [lectureId, session] of activeQRSessions.entries()) {
    if (session.expiresAt < now) {
      activeQRSessions.delete(lectureId);
    }
  }
}, 60000); // Clean every minute

// @route   GET /api/attendance/qr/active
// @desc    Get all active QR sessions (for students to see available subjects)
router.get('/qr/active', protect, async (req, res) => {
  try {
    const activeSessions = [];
    const now = Date.now();
    for (const [lectureId, session] of activeQRSessions.entries()) {
      if (session.expiresAt >= now) {
        activeSessions.push({
          lectureId,
          subject: session.subject,
          expiresAt: session.expiresAt,
          expiresIn: Math.max(0, Math.floor((session.expiresAt - now) / 1000 / 60)) // minutes
        });
      }
    }
    res.json(activeSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance/qr/generate
// @desc    Generate QR code for lecture (teacher) - Unique QR per subject
router.post('/qr/generate', protect, teacher, async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    
    // Generate unique lectureId for this subject
    const lectureId = uuidv4();
    
    // Create QR payload with lectureId and subject
    const payload = JSON.stringify({ 
      lectureId, 
      subject: subject.trim(),
      timestamp: Date.now()
    });
    
    // Generate QR code with higher error correction for better scanning
    const qrDataUrl = await QRCode.toDataURL(payload, { 
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      type: 'image/png'
    });
    
    // Store active session (unique per subject + lectureId combination)
    activeQRSessions.set(lectureId, {
      subject: subject.trim(),
      teacherId: req.user._id.toString(),
      teacherName: req.user.name,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    });
    
    res.json({ 
      qrDataUrl, 
      lectureId, 
      subject: subject.trim(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      message: 'QR code generated successfully. Each subject gets a unique QR code.'
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate QR code' });
  }
});

// @route   POST /api/attendance/qr/scan
// @desc    Mark attendance via QR scan (student) - requires face verification
router.post('/qr/scan', protect, async (req, res) => {
  try {
    const { lectureId, subject, faceDescriptor } = req.body;
    
    // Verify face
    const verification = await verifyFace(req.user._id, faceDescriptor);
    if (!verification.verified) {
      return res.status(403).json({ 
        message: verification.reason || 'Face verification failed',
        requiresFace: true 
      });
    }

    const session = activeQRSessions.get(lectureId);
    if (!session) return res.status(400).json({ message: 'QR code expired or invalid' });
    if (session.expiresAt < Date.now()) {
      activeQRSessions.delete(lectureId);
      return res.status(400).json({ message: 'QR code expired' });
    }
    if (session.subject !== subject) return res.status(400).json({ message: 'Subject mismatch' });
    const existing = await Attendance.findOne({
      student: req.user._id,
      lectureId,
      subject
    });
    if (existing) return res.status(400).json({ message: 'Already marked present' });
    const attendance = await Attendance.create({
      student: req.user._id,
      subject,
      method: 'qr',
      lectureId
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`lecture-${lectureId}`).emit('attendance-update', {
        student: { _id: req.user._id, name: req.user.name, email: req.user.email },
        subject,
        time: attendance.time
      });
    }
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance/proximity
// @desc    Mark attendance via proximity - REQUIRES ACTIVE QR SESSION + face verification
router.post('/proximity', protect, async (req, res) => {
  try {
    const { subject, faceDescriptor, lectureId } = req.body;
    
    // CRITICAL: Must have active QR session (attendance can only be marked dynamically)
    if (!lectureId) {
      return res.status(400).json({ 
        message: 'QR session required. Attendance can only be marked when teacher generates QR code.' 
      });
    }
    
    const session = activeQRSessions.get(lectureId);
    if (!session) {
      return res.status(400).json({ 
        message: 'No active QR session found. Teacher must generate QR code first.' 
      });
    }
    if (session.expiresAt < Date.now()) {
      activeQRSessions.delete(lectureId);
      return res.status(400).json({ message: 'QR session expired. Teacher must generate new QR code.' });
    }
    if (session.subject !== subject) {
      return res.status(400).json({ message: 'Subject mismatch with active QR session.' });
    }
    
    // Verify face to prevent abuse
    const verification = await verifyFace(req.user._id, faceDescriptor);
    if (!verification.verified) {
      return res.status(403).json({ 
        message: verification.reason || 'Face verification failed',
        requiresFace: true 
      });
    }

    // Check if already marked for this lecture
    const existing = await Attendance.findOne({
      student: req.user._id,
      lectureId,
      subject
    });
    if (existing) {
      return res.status(400).json({ message: 'Already marked attendance for this session' });
    }
    
    const attendance = await Attendance.create({
      student: req.user._id,
      subject,
      method: 'proximity',
      lectureId
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`lecture-${lectureId}`).emit('attendance-update', {
        student: { _id: req.user._id, name: req.user.name, email: req.user.email },
        subject,
        time: attendance.time
      });
    }
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance/face
// @desc    Mark attendance via face recognition - REQUIRES ACTIVE QR SESSION + face verification
router.post('/face', protect, async (req, res) => {
  try {
    const { subject, faceDescriptor, lectureId } = req.body;
    
    // CRITICAL: Must have active QR session (attendance can only be marked dynamically)
    if (!lectureId) {
      return res.status(400).json({ 
        message: 'QR session required. Attendance can only be marked when teacher generates QR code.' 
      });
    }
    
    const session = activeQRSessions.get(lectureId);
    if (!session) {
      return res.status(400).json({ 
        message: 'No active QR session found. Teacher must generate QR code first.' 
      });
    }
    if (session.expiresAt < Date.now()) {
      activeQRSessions.delete(lectureId);
      return res.status(400).json({ message: 'QR session expired. Teacher must generate new QR code.' });
    }
    if (session.subject !== subject) {
      return res.status(400).json({ message: 'Subject mismatch with active QR session.' });
    }
    
    // Verify face matches enrolled face
    const verification = await verifyFace(req.user._id, faceDescriptor);
    if (!verification.verified) {
      return res.status(403).json({ 
        message: verification.reason || 'Face verification failed',
        requiresFace: true 
      });
    }

    // Check if already marked for this lecture
    const existing = await Attendance.findOne({
      student: req.user._id,
      lectureId,
      subject
    });
    if (existing) {
      return res.status(400).json({ message: 'Already marked attendance for this session' });
    }
    
    const attendance = await Attendance.create({
      student: req.user._id,
      subject,
      method: 'face',
      lectureId
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`lecture-${lectureId}`).emit('attendance-update', {
        student: { _id: req.user._id, name: req.user.name, email: req.user.email },
        subject,
        time: attendance.time
      });
    }
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, subject, startDate, endDate } = req.query;
    const query = {};
    if (req.user.role === 'student') query.student = req.user._id;
    else if (studentId) query.student = studentId;
    if (subject) query.subject = subject;
    if (startDate || endDate) {
      query.time = {};
      if (startDate) query.time.$gte = new Date(startDate);
      if (endDate) query.time.$lte = new Date(endDate);
    }
    const attendance = await Attendance.find(query).populate('student', 'name email').sort({ time: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/attendance/lecture/:lectureId
// @desc    Get attendance for a specific lecture (teacher)
router.get('/lecture/:lectureId', protect, teacher, async (req, res) => {
  try {
    const attendance = await Attendance.find({ lectureId: req.params.lectureId })
      .populate('student', 'name email')
      .sort({ time: 1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const { studentId } = req.query;
    const student = studentId || (req.user.role === 'student' ? req.user._id : null);
    if (!student) return res.status(400).json({ message: 'Student ID required for stats' });
    const records = await Attendance.find({ student }).distinct('subject');
    const stats = await Promise.all(
      records.map(async (sub) => {
        const total = await Attendance.countDocuments({ student, subject: sub });
        return { subject: sub, count: total };
      })
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/attendance/clear
// @desc    Clear all attendance records (admin/teacher only - for testing)
router.delete('/clear', protect, teacher, async (req, res) => {
  try {
    const deleted = await Attendance.deleteMany({});
    res.json({ message: `Cleared ${deleted.deletedCount} attendance records` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
export { activeQRSessions };
