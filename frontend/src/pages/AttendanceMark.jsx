/**
 * Mark Attendance - QR scan, Proximity, Face recognition (student)
 * All methods now require face verification
 */
import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { loadModels, detectFace, startCamera, stopCamera, capturePhotoFromVideo } from '../utils/faceRecognition';

export default function AttendanceMark() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('choose'); // choose | qr | proximity | face
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasFaceEnrolled, setHasFaceEnrolled] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, data }
  const [activeQRSessions, setActiveQRSessions] = useState([]);
  
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
    checkFaceStatus();
    loadActiveQRSessions();
    // Refresh active sessions every 30 seconds
    const interval = setInterval(loadActiveQRSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveQRSessions = async () => {
    try {
      const { data } = await api.get('/attendance/qr/active');
      setActiveQRSessions(data);
    } catch (err) {
      console.error('Failed to load active QR sessions:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) stopCamera(stream);
      if (scannerRef.current) {
        try { scannerRef.current.clear?.(); } catch (_) {}
      }
    };
  }, [stream]);

  const checkFaceStatus = async () => {
    try {
      const { data } = await api.get('/auth/face-status');
      setHasFaceEnrolled(data.hasFace);
    } catch {
      setHasFaceEnrolled(false);
    }
  };

  const startVideo = async () => {
    try {
      setMessage('');
      const video = videoRef.current;
      if (!video) return;
      const camStream = await startCamera(video);
      setStream(camStream);
      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    } catch (error) {
      setMessage('Camera error: ' + error.message);
    }
  };

  const captureAndVerify = async () => {
    if (!stream || !videoRef.current) {
      setMessage('Please start camera first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const photoDataUrl = capturePhotoFromVideo(videoRef.current);
      const img = new Image();
      img.src = photoDataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const descriptor = await detectFace(img);
      stopCamera(stream);
      setStream(null);
      setShowFaceCapture(false);
      
      // Execute pending action with face descriptor
      if (pendingAction) {
        await executeAttendance(pendingAction.type, { ...pendingAction.data, faceDescriptor: Array.from(descriptor) });
        setPendingAction(null);
      }
    } catch (error) {
      setMessage(error.message || 'Face detection failed. Make sure your face is clearly visible.');
    } finally {
      setLoading(false);
    }
  };

  const executeAttendance = async (type, data) => {
    setLoading(true);
    setMessage('Getting your location and marking attendance...');
    try {
      let latitude = null;
      let longitude = null;

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (err) {
        console.warn('Could not get location:', err);
        // We still proceed, backend will reject if session requires location and we don't have it
      }

      let endpoint = '';
      let payload = { latitude, longitude };
      
      if (type === 'qr') {
        endpoint = '/attendance/qr/scan';
        payload = { ...payload, lectureId: data.lectureId, subject: data.subject, faceDescriptor: data.faceDescriptor };
      } else if (type === 'proximity') {
        // Find active QR session for this subject
        const activeSession = activeQRSessions.find(s => s.subject === data.subject);
        if (!activeSession) {
          throw new Error('No active QR session found for this subject. Teacher must generate QR code first.');
        }
        endpoint = '/attendance/proximity';
        payload = { ...payload, subject: data.subject, faceDescriptor: data.faceDescriptor, lectureId: activeSession.lectureId };
      } else if (type === 'face') {
        // Find active QR session for this subject
        const activeSession = activeQRSessions.find(s => s.subject === data.subject);
        if (!activeSession) {
          throw new Error('No active QR session found for this subject. Teacher must generate QR code first.');
        }
        endpoint = '/attendance/face';
        payload = { ...payload, subject: data.subject, faceDescriptor: data.faceDescriptor, lectureId: activeSession.lectureId };
      }
      
      await api.post(endpoint, payload);
      setMessage('✓ Attendance marked successfully!');
      // Refresh active sessions
      await loadActiveQRSessions();
      setTimeout(() => {
        setMode('choose');
        setSubject('');
      }, 2000);
    } catch (err) {
      if (err.response?.data?.requiresFace && !hasFaceEnrolled) {
        setMessage('Please enroll your face first. Redirecting...');
        setTimeout(() => navigate('/face-enrollment'), 2000);
      } else {
        setMessage(err.response?.data?.message || err.message || 'Failed to mark attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const requireFaceVerification = async (type, data) => {
    if (!hasFaceEnrolled) {
      setMessage('Please enroll your face first. Redirecting...');
      setTimeout(() => navigate('/face-enrollment'), 2000);
      return;
    }
    // Clear any existing scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (_) {}
    }
    setPendingAction({ type, data });
    setShowFaceCapture(true);
    setTimeout(() => startVideo(), 100);
  };

  // QR Scanner setup
  useEffect(() => {
    if (mode !== 'qr') return;
    
    // Reset scanner state
    scannedRef.current = false;
    setMessage('');
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          },
          false // verbose
        );
        
        scanner.render(
          async (decodedText, result) => {
            if (scannedRef.current) {
              console.log('Already scanned, ignoring');
              return;
            }
            
            console.log('QR Code scanned:', decodedText);
            scannedRef.current = true;
            
            try {
              // Parse QR code data
              let qrData;
              try {
                qrData = JSON.parse(decodedText);
              } catch (parseErr) {
                // Try if it's a URL or plain text
                if (decodedText.includes('lectureId') || decodedText.includes('subject')) {
                  // Try to extract from URL or other format
                  setMessage('Invalid QR code format. Please scan the correct QR code.');
                  scannedRef.current = false;
                  return;
                }
                throw new Error('Invalid QR code format');
              }
              
              if (!qrData.lectureId || !qrData.subject) {
                throw new Error('QR code missing required data');
              }
              
              console.log('QR Data parsed:', qrData);
              
              // Stop scanner
              try {
                await scanner.clear();
              } catch (clearErr) {
                console.log('Scanner clear error (ignored):', clearErr);
              }
              
              // Show success message
              setMessage('✓ QR code scanned successfully! Preparing face verification...');
              
              // Small delay to show message, then require face verification
              setTimeout(() => {
                requireFaceVerification('qr', { 
                  lectureId: qrData.lectureId, 
                  subject: qrData.subject 
                });
              }, 500);
            } catch (err) {
              console.error('QR processing error:', err);
              setMessage(`Error: ${err.message || 'Invalid QR code. Please try again.'}`);
              scannedRef.current = false;
              // Don't clear scanner on error, allow retry
            }
          },
          (errorMessage) => {
            // On scan error (not fatal)
            console.log('QR scan error (non-fatal):', errorMessage);
            // Don't show error for continuous scanning
          }
        );
        
        scannerRef.current = scanner;
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setMessage('Failed to initialize camera. Please check permissions and try again.');
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (_) {}
      }
    };
  }, [mode]);

  const handleProximity = () => {
    if (!subject.trim()) {
      setMessage('Please enter subject');
      return;
    }
    // Check if QR session exists for this subject
    const activeSession = activeQRSessions.find(s => s.subject === subject.trim());
    if (!activeSession) {
      setMessage(`No active QR session found for "${subject.trim()}". Teacher must generate QR code first.`);
      return;
    }
    requireFaceVerification('proximity', { subject: subject.trim() });
  };

  const handleFace = () => {
    if (!subject.trim()) {
      setMessage('Please enter subject');
      return;
    }
    // Check if QR session exists for this subject
    const activeSession = activeQRSessions.find(s => s.subject === subject.trim());
    if (!activeSession) {
      setMessage(`No active QR session found for "${subject.trim()}". Teacher must generate QR code first.`);
      return;
    }
    requireFaceVerification('face', { subject: subject.trim() });
  };

  if (hasFaceEnrolled === null) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Mark Attendance</h1>

      {!hasFaceEnrolled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">Face enrollment required</p>
          <p className="text-yellow-700 text-sm mt-1">You need to enroll your face before marking attendance.</p>
          <button
            onClick={() => navigate('/face-enrollment')}
            className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
          >
            Enroll Face Now
          </button>
        </div>
      )}

      {showFaceCapture ? (
        <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Face Verification Required</h3>
          <div className="mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg border border-slate-200 bg-slate-900"
              style={{ display: stream ? 'block' : 'none' }}
            />
            {!stream && (
              <div className="w-full aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                <p className="text-slate-500">Camera preview</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {!stream ? (
              <button
                onClick={startVideo}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
              >
                Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndVerify}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Capture & Verify'}
                </button>
                <button
                  onClick={() => {
                    if (stream) stopCamera(stream);
                    setStream(null);
                    setShowFaceCapture(false);
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}
        </div>
      ) : mode === 'choose' ? (
        <div>
          {activeQRSessions.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">✓ Active QR Sessions Available</p>
              <div className="space-y-1">
                {activeQRSessions.map((session) => (
                  <p key={session.lectureId} className="text-green-700 text-sm">
                    • {session.subject} (expires in {session.expiresIn} minutes)
                  </p>
                ))}
              </div>
              <p className="text-green-600 text-xs mt-2">
                Attendance can only be marked for subjects with active QR codes
              </p>
            </div>
          )}
          
          {activeQRSessions.length === 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠ No Active QR Sessions</p>
              <p className="text-yellow-700 text-sm mt-1">
                Teacher must generate QR code first. Attendance can only be marked dynamically when QR is active.
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => setMode('qr')}
              disabled={!hasFaceEnrolled}
              className="p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
            >
              <span className="text-4xl mb-3 block">📱</span>
              <h3 className="font-semibold text-slate-800">QR Code Scan</h3>
              <p className="text-sm text-slate-500 mt-1">Scan teacher's QR code + face verification</p>
            </button>
            <button
              onClick={() => { setMode('proximity'); setSubject(''); }}
              disabled={!hasFaceEnrolled || activeQRSessions.length === 0}
              className="p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
            >
              <span className="text-4xl mb-3 block">📶</span>
              <h3 className="font-semibold text-slate-800">Proximity</h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeQRSessions.length > 0 
                  ? 'Requires active QR session + face verification'
                  : 'No active QR session available'}
              </p>
            </button>
            <button
              onClick={() => { setMode('face'); setSubject(''); }}
              disabled={!hasFaceEnrolled || activeQRSessions.length === 0}
              className="p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
            >
              <span className="text-4xl mb-3 block">👤</span>
              <h3 className="font-semibold text-slate-800">Face Recognition</h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeQRSessions.length > 0 
                  ? 'Requires active QR session + face verification'
                  : 'No active QR session available'}
              </p>
            </button>
          </div>
        </div>
      ) : mode === 'qr' ? (
        <div className="max-w-2xl">
          <button
            onClick={() => {
              if (scannerRef.current) {
                try { 
                  scannerRef.current.clear().catch(() => {}); 
                } catch (_) {}
              }
              scannedRef.current = false;
              setMode('choose');
              setMessage('');
            }}
            className="text-primary-600 hover:underline mb-4 font-medium"
          >
            ← Back
          </button>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Scan QR Code</h3>
            <p className="text-sm text-slate-500 mb-4">
              Point your camera at the QR code displayed by your teacher
            </p>
            
            <div className="bg-slate-900 rounded-lg p-2 mb-4">
              <div id="qr-reader" className="rounded-lg overflow-hidden" />
            </div>
            
            {message && (
              <div className={`p-4 rounded-lg ${
                message.startsWith('✓') || message.includes('scanned') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : message.includes('Error') || message.includes('Invalid')
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <p className="font-medium">{message}</p>
                {message.includes('scanned') && (
                  <p className="text-sm mt-1">Face verification will start shortly...</p>
                )}
              </div>
            )}
            
            <div className="mt-4 text-xs text-slate-400">
              <p>• Ensure good lighting</p>
              <p>• Hold phone steady</p>
              <p>• Allow camera permissions if prompted</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6">
          <button
            onClick={() => setMode('choose')}
            className="text-primary-600 hover:underline mb-4 font-medium"
          >
            ← Back
          </button>
          
          {activeQRSessions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">No Active QR Sessions</p>
              <p className="text-yellow-700 text-sm mt-1">
                Teacher must generate QR code first. Attendance can only be marked when QR is active.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Subject (with active QR)
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 mb-4"
              >
                <option value="">-- Select Subject --</option>
                {activeQRSessions.map((session) => (
                  <option key={session.lectureId} value={session.subject}>
                    {session.subject} (expires in {session.expiresIn} min)
                  </option>
                ))}
              </select>
              
              <div className="mb-4 text-xs text-slate-500">
                <p>• Only subjects with active QR codes can be selected</p>
                <p>• Face verification will be required</p>
              </div>
              
              <button
                onClick={mode === 'proximity' ? handleProximity : handleFace}
                disabled={loading || !hasFaceEnrolled || !subject.trim()}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {mode === 'proximity' ? 'Mark via Proximity' : 'Mark via Face Recognition'}
              </button>
            </div>
          )}
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
