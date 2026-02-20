/**
 * Main layout with sidebar navigation
 */
import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = (role) => {
  const base = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/timetable', label: 'Timetable', icon: '📅' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ];
  if (role === 'student') {
    return [
      ...base,
      { to: '/face-enrollment', label: 'Enroll Face', icon: '📸' },
      { to: '/attendance/mark', label: 'Mark Attendance', icon: '✓' },
      { to: '/free-period', label: 'Free Period', icon: '💡' },
      { to: '/daily-routine', label: 'Daily Routine', icon: '📋' },
    ];
  }
  if (role === 'teacher' || role === 'admin') {
    return [
      ...base,
      { to: '/timetable/manage', label: 'Manage Timetable', icon: '✏️' },
      { to: '/attendance/qr', label: 'QR Attendance', icon: '📱' },
    ];
  }
  if (role === 'admin') {
    return [...base, { to: '/timetable/manage', label: 'Manage Timetable', icon: '✏️' }];
  }
  return base;
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-700">
          <h1 className="font-bold text-lg">Smart Curriculum</h1>
          <p className="text-xs text-slate-400 mt-0.5">Attendance & Activity</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems(user?.role).map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 truncate">{user?.email}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
