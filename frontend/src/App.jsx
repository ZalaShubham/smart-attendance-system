/**
 * Smart Curriculum Activity & Attendance App - Main App Router
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard & main pages
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminTimetableManage from './pages/AdminTimetableManage';

// Feature pages
import Timetable from './pages/Timetable';
import TimetableManage from './pages/TimetableManage';
import AttendanceMark from './pages/AttendanceMark';
import AttendanceQRTeacher from './pages/AttendanceQRTeacher';
import AttendanceLive from './pages/AttendanceLive';
import FreePeriod from './pages/FreePeriod';
import DailyRoutine from './pages/DailyRoutine';
import Profile from './pages/Profile';
import FaceEnrollment from './pages/FaceEnrollment';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

      <Route element={<Layout />}>
        <Route path="/" element={
          <ProtectedRoute>
            {user?.role === 'student' && <StudentDashboard />}
            {user?.role === 'teacher' && <TeacherDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
            {!['student', 'teacher', 'admin'].includes(user?.role) && <Navigate to="/login" />}
          </ProtectedRoute>
        } />
        <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
        <Route path="/timetable/manage" element={<ProtectedRoute roles={['teacher', 'admin']}><TimetableManage /></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute roles={['admin']}><AdminTimetableManage /></ProtectedRoute>} />
        <Route path="/attendance/mark" element={<ProtectedRoute roles={['student']}><AttendanceMark /></ProtectedRoute>} />
        <Route path="/attendance/qr" element={<ProtectedRoute roles={['teacher', 'admin']}><AttendanceQRTeacher /></ProtectedRoute>} />
        <Route path="/attendance/live/:lectureId" element={<ProtectedRoute><AttendanceLive /></ProtectedRoute>} />
        <Route path="/free-period" element={<ProtectedRoute roles={['student']}><FreePeriod /></ProtectedRoute>} />
        <Route path="/daily-routine" element={<ProtectedRoute roles={['student']}><DailyRoutine /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/face-enrollment" element={<ProtectedRoute roles={['student']}><FaceEnrollment /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
