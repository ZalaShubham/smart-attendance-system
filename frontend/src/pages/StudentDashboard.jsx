/**
 * Student Dashboard - Attendance %, schedule, suggestions
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    api.get('/attendance/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/attendance', { params: { limit: 5 } }).then(({ data }) => setRecentAttendance(data.slice(0, 5))).catch(() => {});
    const today = new Date().getDay();
    api.get('/timetable', { params: { day: today } }).then(({ data }) => setTimetable(data)).catch(() => {});
  }, []);

  const totalSessions = stats.reduce((acc, s) => acc + s.count, 0);
  const productivityScore = totalSessions > 0 ? Math.min(100, 60 + totalSessions * 5) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {user?.name?.split(' ')[0]}!</h1>
      <p className="text-slate-500 mb-6">Student Dashboard</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Attendance Sessions</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{totalSessions}</p>
          <p className="text-xs text-slate-400 mt-1">Total marked this period</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Productivity Score</p>
          <p className="text-3xl font-bold text-accent-500 mt-1">{productivityScore}</p>
          <p className="text-xs text-slate-400 mt-1">Based on engagement</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Subjects</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{stats.length}</p>
          <p className="text-xs text-slate-400 mt-1">With attendance records</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Today's Schedule</h2>
          <div className="space-y-2">
            {timetable.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-500 text-center">
                No classes today
              </div>
            ) : (
              timetable
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((t) => (
                  <div key={t._id} className="bg-white rounded-xl border border-slate-200 p-3 flex justify-between">
                    <span className="font-medium">{t.subject}</span>
                    <span className="text-slate-500 text-sm">{t.startTime} - {t.endTime}</span>
                  </div>
                ))
            )}
          </div>
          <Link
            to="/timetable"
            className="mt-3 inline-block text-primary-600 hover:underline text-sm font-medium"
          >
            View full timetable →
          </Link>
        </div>

        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Recent Attendance</h2>
          <div className="space-y-2">
            {recentAttendance.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-500 text-center">
                No attendance yet
              </div>
            ) : (
              recentAttendance.map((a) => (
                <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-3 flex justify-between">
                  <span>{a.subject}</span>
                  <span className="text-xs text-slate-500 capitalize">{a.method}</span>
                </div>
              ))
            )}
          </div>
          <Link
            to="/attendance/mark"
            className="mt-3 inline-block text-primary-600 hover:underline text-sm font-medium"
          >
            Mark attendance →
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/attendance/mark"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Mark Attendance
          </Link>
          <Link
            to="/free-period"
            className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Free Period Suggestions
          </Link>
          <Link
            to="/daily-routine"
            className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Daily Routine
          </Link>
        </div>
      </div>
    </div>
  );
}
