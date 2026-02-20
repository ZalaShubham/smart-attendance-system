/**
 * Face Enrollment - Capture and store face photo for first time setup
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { loadModels, detectFace, startCamera, stopCamera, capturePhotoFromVideo } from '../utils/faceRecognition';

export default function FaceEnrollment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    loadModels().then(() => setModelsLoading(false)).catch(() => setModelsLoading(false));
    return () => {
      if (stream) stopCamera(stream);
    };
  }, []);

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

  const captureAndEnroll = async () => {
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
      await api.post('/auth/enroll-face', {
        facePhoto: photoDataUrl,
        faceDescriptor: Array.from(descriptor)
      });
      setMessage('✓ Face enrolled successfully!');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      setMessage(error.message || 'Failed to enroll face. Make sure your face is clearly visible.');
    } finally {
      setLoading(false);
    }
  };

  const stopVideo = () => {
    if (stream) {
      stopCamera(stream);
      setStream(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Face Enrollment</h1>
      <p className="text-slate-500 mb-6">
        Capture your face photo for attendance verification. This is required for marking attendance.
      </p>

      {modelsLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700">Loading face recognition models...</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        <div className="mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md mx-auto rounded-lg border border-slate-200 bg-slate-900"
            style={{ display: stream ? 'block' : 'none' }}
          />
          {!stream && (
            <div className="w-full max-w-md mx-auto aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
              <p className="text-slate-500">Camera preview</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center mb-4">
          {!stream ? (
            <button
              onClick={startVideo}
              disabled={modelsLoading}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={captureAndEnroll}
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : 'Capture & Enroll'}
              </button>
              <button
                onClick={stopVideo}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
              >
                Stop Camera
              </button>
            </>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          <p>• Make sure you're in good lighting</p>
          <p>• Face the camera directly</p>
          <p>• Remove glasses or hat if possible</p>
        </div>
      </div>
    </div>
  );
}
