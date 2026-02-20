/**
 * Daily Routine Generator - Combines schedule + free time + goals
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DailyRoutine() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [day, setDay] = useState(new Date().getDay());
  const [routine, setRoutine] = useState([]);

  useEffect(() => {
    api.get('/timetable', { params: { day } }).then(({ data }) => setTimetable(data)).catch(() => {});
  }, [day]);

  useEffect(() => {
    const classes = timetable
      .filter((t) => t.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const slots = [];
    let lastEnd = '08:00';

    classes.forEach((c) => {
      if (c.startTime > lastEnd) {
        slots.push({
          type: 'free',
          start: lastEnd,
          end: c.startTime,
          title: 'Free Time',
          suggestion: getSuggestion()
        });
      }
      slots.push({
        type: 'class',
        start: c.startTime,
        end: c.endTime,
        title: c.subject,
        classroom: c.classroom
      });
      lastEnd = c.endTime;
    });

    if (lastEnd < '18:00') {
      slots.push({
        type: 'free',
        start: lastEnd,
        end: '18:00',
        title: 'Free Time',
        suggestion: getSuggestion()
      });
    }

    setRoutine(slots);
  }, [timetable, day]);

  function getSuggestion() {
    const options = [
      'Revise weak subjects',
      'Practice coding',
      'Watch micro-lectures',
      'Career skill development'
    ];
    if (user?.improvementAreas?.length) {
      return `Revise ${user.improvementAreas[0]}`;
    }
    if (user?.goals?.length) {
      return `Work on: ${user.goals[0]}`;
    }
    return options[Math.floor(Math.random() * options.length)];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Daily Routine</h1>
      <p className="text-slate-500 mb-6">Your schedule with free period suggestions</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setDay(i)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              day === i ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {routine.map((slot, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 flex justify-between items-start ${
              slot.type === 'class'
                ? 'bg-white border-primary-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <h3 className="font-semibold text-slate-800">{slot.title}</h3>
              <p className="text-sm text-slate-500">
                {slot.start} - {slot.end}
              </p>
              {slot.classroom && <p className="text-xs text-slate-400">{slot.classroom}</p>}
              {slot.suggestion && (
                <p className="text-sm text-primary-600 mt-1">💡 {slot.suggestion}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                slot.type === 'class' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {slot.type === 'class' ? 'Class' : 'Free'}
            </span>
          </div>
        ))}
      </div>

      {routine.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No schedule for {DAYS[day]}
        </div>
      )}
    </div>
  );
}
