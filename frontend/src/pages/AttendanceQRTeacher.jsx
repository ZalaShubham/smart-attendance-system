/**
 * QR Attendance - Teacher generates QR, live view link
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AttendanceQRTeacher() {
  const [subject, setSubject] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [radius, setRadius] = useState(50);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!subject.trim()) {
      alert('Please enter a subject name');
      return;
    }
    setLoading(true);
    setQr(null);

    let latitude = null;
    let longitude = null;

    if (useLocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (err) {
        setLoading(false);
        alert('Could not get your location. Please check browser permissions.');
        return;
      }
    }

    try {
      const payload = { subject: subject.trim() };
      if (useLocation) {
        payload.latitude = latitude;
        payload.longitude = longitude;
        payload.radius = radius;
      }
      const { data } = await api.post('/attendance/qr/generate', payload);
      setQr(data);
      console.log('QR Generated:', data);
    } catch (err) {
      console.error('QR generation error:', err);
      alert(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">QR Attendance</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
        <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useLocation} onChange={e => setUseLocation(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500"/>
            <span className="text-sm font-medium text-slate-700">Enable Location Geofencing</span>
          </label>
          <p className="text-xs text-slate-500 mt-1">If enabled, students must be near you to mark attendance.</p>
        </div>

        {useLocation && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Radius (meters)</label>
            <input type="number" min="10" max="1000" value={radius} onChange={e => setRadius(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <p className="text-xs text-slate-500 mt-1">Max distance allowed between you and the student.</p>
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          Generate QR
        </button>

        {qr && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm font-medium">✓ Unique QR Code Generated</p>
              <p className="text-green-700 text-xs mt-1">Subject: {qr.subject}</p>
              <p className="text-green-600 text-xs mt-1">Each subject gets a unique QR code</p>
            </div>
            <p className="text-sm text-slate-600 mb-3 font-medium">Display this QR code for students to scan:</p>
            <div className="bg-white p-4 rounded-lg border-2 border-slate-300">
              <img 
                src={qr.qrDataUrl} 
                alt={`QR Code for ${qr.subject}`} 
                className="mx-auto rounded-lg border border-slate-200 shadow-sm"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-slate-700 font-medium">{qr.subject}</p>
              <p className="text-xs text-slate-500 mt-1">
                Valid for 15 minutes • Lecture ID: {qr.lectureId?.substring(0, 8)}...
              </p>
            </div>
            <Link
              to={`/attendance/live/${qr.lectureId}`}
              className="mt-4 block text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Open Live Attendance View →
            </Link>
            <button
              onClick={() => {
                setQr(null);
                setSubject('');
              }}
              className="mt-2 w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium"
            >
              Generate New QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
