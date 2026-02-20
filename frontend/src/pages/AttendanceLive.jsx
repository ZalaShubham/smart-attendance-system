/**
 * Live Attendance - Real-time list via Socket.io
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function AttendanceLive() {
  const { lectureId } = useParams();
  const socket = useSocket();
  const [attendees, setAttendees] = useState([]);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    api.get(`/attendance/lecture/${lectureId}`)
      .then(({ data }) => {
        setAttendees(data.map((a) => ({
          ...a.student,
          time: a.time
        })));
        if (data[0]) setSubject(data[0].subject);
      })
      .catch(() => {});
  }, [lectureId]);

  useEffect(() => {
    if (!socket || !lectureId) return;
    socket.emit('join-lecture', lectureId);
    socket.on('attendance-update', (data) => {
      setAttendees((prev) => {
        if (prev.some((a) => a._id === data.student._id)) return prev;
        return [...prev, { ...data.student, time: data.time }];
      });
    });
    return () => {
      socket.emit('leave-lecture', lectureId);
      socket.off('attendance-update');
    };
  }, [socket, lectureId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Live Attendance</h1>
      <p className="text-slate-500 mb-6">{subject || 'Loading...'}</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-primary-50 border-b border-slate-200 flex justify-between items-center">
          <span className="font-medium">Present: {attendees.length}</span>
          <span className="text-sm text-slate-500 animate-pulse">● Live</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {attendees.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Waiting for students to scan...</div>
          ) : (
            attendees.map((a) => (
              <div
                key={a._id}
                className="p-4 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50"
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-sm text-slate-500">
                  {a.time ? new Date(a.time).toLocaleTimeString() : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
