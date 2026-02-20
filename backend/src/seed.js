/**
 * Seed script - Creates mock data for testing
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Timetable from './models/Timetable.js';
import Attendance from './models/Attendance.js';
import connectDB from './config/db.js';

connectDB();

const seed = async () => {
  try {
    await User.deleteMany({});
    await Timetable.deleteMany({});
    await Attendance.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create Teachers
    const teacher1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah@school.com',
      password: 'teacher123',
      role: 'teacher'
    });
    const teacher2 = await User.create({
      name: 'Prof. Mike Chen',
      email: 'mike@school.com',
      password: 'teacher123',
      role: 'teacher'
    });

    // Create Students
    const student1 = await User.create({
      name: 'Alex Thompson',
      email: 'alex@student.com',
      password: 'student123',
      role: 'student',
      interests: ['Programming', 'AI', 'Mathematics'],
      goals: ['Build projects', 'Improve algorithms'],
      improvementAreas: ['Physics', 'Chemistry']
    });
    const student2 = await User.create({
      name: 'Emma Wilson',
      email: 'emma@student.com',
      password: 'student123',
      role: 'student',
      interests: ['Design', 'Creative Writing'],
      goals: ['Learn web design'],
      improvementAreas: ['Mathematics']
    });
    const student3 = await User.create({
      name: 'James Kumar',
      email: 'james@student.com',
      password: 'student123',
      role: 'student',
      interests: ['Data Science', 'Statistics'],
      goals: ['Data analysis certification'],
      improvementAreas: ['English']
    });

    // Create Timetable (Monday = 1, Tuesday = 2, etc.)
    const subjects = [
      { subject: 'Mathematics', classroom: 'Room 101', startTime: '09:00', endTime: '10:00', teacher: teacher1._id, dayOfWeek: 1 },
      { subject: 'Physics', classroom: 'Room 102', startTime: '10:15', endTime: '11:15', teacher: teacher1._id, dayOfWeek: 1 },
      { subject: 'Programming', classroom: 'Lab 1', startTime: '11:30', endTime: '12:30', teacher: teacher2._id, dayOfWeek: 1 },
      { subject: 'Mathematics', classroom: 'Room 101', startTime: '09:00', endTime: '10:00', teacher: teacher1._id, dayOfWeek: 2 },
      { subject: 'Chemistry', classroom: 'Room 103', startTime: '10:15', endTime: '11:15', teacher: teacher2._id, dayOfWeek: 2 },
      { subject: 'English', classroom: 'Room 104', startTime: '11:30', endTime: '12:30', teacher: teacher2._id, dayOfWeek: 2 },
      { subject: 'Physics', classroom: 'Room 102', startTime: '09:00', endTime: '10:00', teacher: teacher1._id, dayOfWeek: 3 },
      { subject: 'Programming', classroom: 'Lab 1', startTime: '10:15', endTime: '11:15', teacher: teacher2._id, dayOfWeek: 3 }
    ];
    await Timetable.insertMany(subjects);

    // NOTE: No attendance records created - attendance must be marked dynamically via QR code only
    // Attendance can only be created when:
    // 1. Teacher generates QR code for a subject
    // 2. Student scans QR code
    // 3. Face verification passes
    // 4. Attendance is recorded

    console.log('Seed completed successfully!');
    console.log('\nIMPORTANT: Attendance records are NOT created by seed.');
    console.log('Attendance can ONLY be marked dynamically when:');
    console.log('  1. Teacher generates QR code');
    console.log('  2. Student scans QR code');
    console.log('  3. Face verification passes');
    console.log('\nTest Accounts:');
    console.log('  Admin:   admin@school.com / admin123');
    console.log('  Teacher: sarah@school.com / teacher123');
    console.log('  Teacher: mike@school.com / teacher123');
    console.log('  Student: alex@student.com / student123');
    console.log('  Student: emma@student.com / student123');
    console.log('  Student: james@student.com / student123');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    process.exit(0);
  }
};

seed();
