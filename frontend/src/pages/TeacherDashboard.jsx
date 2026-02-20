/**
 * Teacher Dashboard - Attendance reports, real-time
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});

  useEffect(() => {
    api.get('/attendance').then(({ data }) => {
      setAttendance(data);
      const bySubject = {};
      data.forEach((a) => {
        bySubject[a.subject] = (bySubject[a.subject] || 0) + 1;
      });
      setSubjectStats(bySubject);
    }).catch(() => {});
  }, []);

  const totalRecords = attendance.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {user?.name?.split(' ')[0]}!</h1>
      <p className="text-slate-500 mb-6">Teacher Dashboard</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Total Attendance Records</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{totalRecords}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Subjects</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{Object.keys(subjectStats).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Quick Action</p>
          <Link
            to="/attendance/qr"
            className="mt-2 inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
          >
            Generate QR
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Subject-wise Attendance</h2>
          <div className="space-y-2">
            {Object.entries(subjectStats).map(([sub, count]) => (
              <div key={sub} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between">
                <span className="font-medium">{sub}</span>
                <span className="text-primary-600 font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(subjectStats).length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-500 text-center">
                No records yet
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Recent Records</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attendance.slice(0, 10).map((a) => (
              <div key={a._id} className="bg-white rounded-lg border border-slate-200 p-3 flex justify-between text-sm">
                <span>{a.student?.name || 'Unknown'}</span>
                <span className="text-slate-500">{a.subject} • {a.method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/attendance/qr"
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
        >
          Start QR Attendance
        </Link>
      </div>
    </div>
  );
}
