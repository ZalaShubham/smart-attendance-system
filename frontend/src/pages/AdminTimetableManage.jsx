/**
 * Admin Timetable Management
 * - View all timetable entries
 * - Filter by teacher and day
 * - Create entries for any teacher
 */
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetableManage() {
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ teacherId: '', dayOfWeek: '' });
  const [form, setForm] = useState({
    teacherId: '',
    subject: '',
    classroom: '',
    startTime: '09:00',
    endTime: '10:00',
    dayOfWeek: 1
  });

  const loadTeachers = async () => {
    const { data } = await api.get('/users', { params: { role: 'teacher' } });
    setTeachers(data);
  };

  const loadTimetable = async (nextFilters = filters) => {
    const params = {};
    if (nextFilters.teacherId) params.teacherId = nextFilters.teacherId;
    if (nextFilters.dayOfWeek !== '') params.day = nextFilters.dayOfWeek;
    const { data } = await api.get('/timetable', { params });
    setTimetable(data);
  };

  useEffect(() => {
    Promise.all([loadTeachers(), loadTimetable()])
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const dayNum = filters.dayOfWeek === '' ? null : Number(filters.dayOfWeek);
    return timetable.filter((t) => {
      if (filters.teacherId && t.teacher?._id !== filters.teacherId) return false;
      if (dayNum !== null && t.dayOfWeek !== dayNum) return false;
      return true;
    });
  }, [timetable, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/timetable', form);
      setForm((f) => ({ ...f, subject: '', classroom: '', startTime: '09:00', endTime: '10:00', dayOfWeek: 1 }));
      await loadTimetable();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/timetable/${id}`);
    await loadTimetable();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Timetable</h1>
      <p className="text-slate-500 mb-6">Create and manage timetable entries for any teacher.</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Create Entry</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
              <select
                value={form.teacherId}
                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                required
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Classroom</label>
              <input
                value={form.classroom}
                onChange={(e) => setForm((f) => ({ ...f, classroom: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by teacher</label>
              <select
                value={filters.teacherId}
                onChange={(e) => setFilters((f) => ({ ...f, teacherId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All teachers</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-56">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by day</label>
              <select
                value={filters.dayOfWeek}
                onChange={(e) => setFilters((f) => ({ ...f, dayOfWeek: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All days</option>
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => loadTimetable(filters)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Apply
            </button>
          </div>

          <h2 className="font-semibold text-slate-800 mb-3">Entries</h2>

          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              No timetable entries found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filtered
                .slice()
                .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime))
                .map((t) => (
                  <div
                    key={t._id}
                    className="bg-white rounded-lg border border-slate-200 p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                        <span className="font-medium text-slate-800">{t.subject}</span>
                        <span className="text-slate-500 text-sm">
                          {DAYS[t.dayOfWeek]} • {t.startTime}-{t.endTime} • {t.classroom}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Teacher: {t.teacher?.name} ({t.teacher?.email})
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

