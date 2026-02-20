/**
 * Smart Curriculum Activity & Attendance App - Backend Server
 * Express + MongoDB + Socket.io
 */
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import timetableRoutes from './routes/timetable.js';
import attendanceRoutes from './routes/attendance.js';
import userRoutes from './routes/users.js';
import Attendance from './models/Attendance.js';

connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Store lectureId -> Set of connected clients watching
const lectureWatchers = new Map();

io.on('connection', (socket) => {
  // Join lecture room for real-time attendance updates
  socket.on('join-lecture', (lectureId) => {
    socket.join(`lecture-${lectureId}`);
    if (!lectureWatchers.has(lectureId)) lectureWatchers.set(lectureId, new Set());
    lectureWatchers.get(lectureId).add(socket.id);
  });

  socket.on('leave-lecture', (lectureId) => {
    socket.leave(`lecture-${lectureId}`);
    const watchers = lectureWatchers.get(lectureId);
    if (watchers) {
      watchers.delete(socket.id);
      if (watchers.size === 0) lectureWatchers.delete(lectureId);
    }
  });

  socket.on('disconnect', () => {
    lectureWatchers.forEach((watchers, lid) => {
      watchers.delete(socket.id);
      if (watchers.size === 0) lectureWatchers.delete(lid);
    });
  });
});

app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

// Suggestions API for free period
app.get('/api/suggestions', async (req, res) => {
  // Placeholder - returns generic suggestions; can be enhanced with user interests
  const suggestions = [
    { type: 'revise', title: 'Revise weak subjects', icon: '📚', description: 'Spend 30 mins on subjects you find challenging' },
    { type: 'coding', title: 'Practice coding problems', icon: '💻', description: 'Solve 2-3 problems on LeetCode/HackerRank' },
    { type: 'micro', title: 'Watch micro-lectures', icon: '🎬', description: 'Short 10-15 min videos on new concepts' },
    { type: 'career', title: 'Career skill development', icon: '📈', description: 'Learn soft skills or technical certifications' }
  ];
  res.json(suggestions);
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
