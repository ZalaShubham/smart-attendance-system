/**
 * Admin Dashboard - Engagement insights, analytics
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
    api.get('/attendance').then(({ data }) => setAttendance(data)).catch(() => {});
  }, []);

  const students = users.filter((u) => u.role === 'student');
  const teachers = users.filter((u) => u.role === 'teacher');
  const byMethod = attendance.reduce((acc, a) => {
    acc[a.method] = (acc[a.method] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
      <p className="text-slate-500 mb-6">System overview & analytics</p>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Students</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Teachers</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{teachers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Total Attendance</p>
          <p className="text-3xl font-bold text-accent-500 mt-1">{attendance.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Attendance by Method</p>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(byMethod).map(([m, c]) => (
              <div key={m} className="flex justify-between">
                <span className="capitalize">{m}</span>
                <span className="font-medium">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Students</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {students.map((u) => (
                <div key={u._id} className="p-3 border-b border-slate-100 flex justify-between">
                  <span>{u.name}</span>
                  <span className="text-slate-500 text-sm">{u.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Teachers</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {teachers.map((u) => (
                <div key={u._id} className="p-3 border-b border-slate-100 flex justify-between">
                  <span>{u.name}</span>
                  <span className="text-slate-500 text-sm">{u.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
