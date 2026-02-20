/**
 * Face Recognition Utilities using face-api.js
 */
import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Load face-api.js models
export async function loadModels() {
  if (modelsLoaded) return true;
  try {
    // Load models from CDN (or local if you download them)
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    // Fallback: try loading from public/models if available
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      modelsLoaded = true;
      return true;
    } catch (e) {
      console.error('Models not found:', e);
      return false;
    }
  }
}

// Detect face and get descriptor
export async function detectFace(imageElement) {
  if (!modelsLoaded) {
    const loaded = await loadModels();
    if (!loaded) throw new Error('Face models not loaded');
  }
  
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    throw new Error('No face detected');
  }
  
  return detection.descriptor;
}

// Capture photo from video stream
export function capturePhotoFromVideo(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Start camera stream
export async function startCamera(videoElement) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    });
    videoElement.srcObject = stream;
    return stream;
  } catch (error) {
    throw new Error('Camera access denied or not available');
  }
}

// Stop camera stream
export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
