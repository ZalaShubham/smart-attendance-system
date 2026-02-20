/**
 * Manage Timetable - Teacher/Admin create/edit timetable
 */
import { useState, useEffect } from 'react';
import api from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableManage() {
  const [timetable, setTimetable] = useState([]);
  const [form, setForm] = useState({
    subject: '',
    classroom: '',
    startTime: '09:00',
    endTime: '10:00',
    dayOfWeek: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/timetable').then(({ data }) => setTimetable(data));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/timetable', form);
      setForm({ subject: '', classroom: '', startTime: '09:00', endTime: '10:00', dayOfWeek: 1 });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/timetable/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Manage Timetable</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Add Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              Add
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold text-slate-800 mb-4">All Entries</h2>
          {loading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timetable.map((t) => (
                <div
                  key={t._id}
                  className="bg-white rounded-lg border border-slate-200 p-3 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{t.subject}</span>
                    <span className="text-slate-500 text-sm ml-2">
                      {DAYS[t.dayOfWeek]} • {t.startTime}-{t.endTime}
                    </span>
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
