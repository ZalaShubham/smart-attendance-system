/**
 * Timetable view - Daily schedule
 */
import { useState, useEffect } from 'react';
import api from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [day, setDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/timetable', { params: { day } }).then(({ data }) => {
      setTimetable(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [day]);

  const todayEntries = timetable.filter((t) => t.dayOfWeek === day);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Timetable</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setDay(i)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              day === i ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
      ) : todayEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No classes scheduled for {DAYS[day]}
        </div>
      ) : (
        <div className="space-y-3">
          {todayEntries
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{entry.subject}</h3>
                  <p className="text-sm text-slate-500">
                    {entry.startTime} - {entry.endTime} • {entry.classroom}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {entry.teacher?.name}
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {entry.classroom}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
