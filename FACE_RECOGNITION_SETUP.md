m run dev# Face Recognition Implementation Guide

## Overview

The app now includes **real face recognition** for attendance verification. All attendance methods (QR, Proximity, Face) require face verification to prevent abuse.

## How It Works

### 1. **Face Enrollment** (First Time Setup)
- Students must enroll their face before marking attendance
- Navigate to **"Enroll Face"** in the sidebar
- Camera captures photo and generates face descriptor
- Face photo and descriptor stored in database

### 2. **Attendance Marking** (All Methods)
- **QR Code**: Scan QR → Camera opens → Face verification → Attendance recorded
- **Proximity**: Enter subject → Camera opens → Face verification → Attendance recorded  
- **Face Recognition**: Enter subject → Camera opens → Face verification → Attendance recorded

### 3. **Face Verification Process**
- Frontend captures photo from camera
- face-api.js generates face descriptor (128-dimensional vector)
- Descriptor sent to backend
- Backend compares with stored descriptor using Euclidean distance
- If distance < 0.6 threshold → Verified ✅
- If distance >= 0.6 → Rejected ❌

## Technical Details

### Backend
- **User Model**: Added `facePhoto` (base64) and `faceDescriptor` (JSON string) fields
- **Enrollment Endpoint**: `POST /api/auth/enroll-face`
- **Verification**: Euclidean distance calculation in `backend/src/routes/attendance.js`
- **All attendance routes** now require `faceDescriptor` in request body

### Frontend
- **face-api.js**: Loads models from CDN (or local `/models` folder)
- **Models Required**:
  - `tinyFaceDetector`
  - `faceLandmark68Net`
  - `faceRecognitionNet`
- **Camera Access**: Uses `getUserMedia` API
- **Face Detection**: Real-time detection with face-api.js

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

This installs `face-api.js` automatically.

### 2. Face Models (Optional - for offline use)
If you want to host models locally instead of CDN:

1. Download models from: https://github.com/justadudewhohacks/face-api.js-models
2. Place in `frontend/public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

3. The code will automatically use local models if CDN fails.

### 3. Camera Permissions
- Browser will request camera permission on first use
- Ensure HTTPS (or localhost) for camera access
- Users must allow camera access

## Testing Flow

1. **Login as student** (e.g., `alex@student.com` / `student123`)
2. **Enroll Face**:
   - Go to "Enroll Face" in sidebar
   - Click "Start Camera"
   - Position face clearly in frame
   - Click "Capture & Enroll"
   - Wait for success message

3. **Mark Attendance**:
   - Go to "Mark Attendance"
   - Choose any method (QR/Proximity/Face)
   - Camera will open for verification
   - Face is verified automatically
   - Attendance recorded if verification passes

## Security Features

- ✅ Face verification required for ALL attendance methods
- ✅ Prevents proximity abuse (can't just click button)
- ✅ Face descriptor comparison on backend (can't fake)
- ✅ Threshold-based matching (0.6 distance)
- ✅ Face must be enrolled before marking attendance

## Troubleshooting

**Camera not working:**
- Check browser permissions
- Use HTTPS or localhost
- Try Chrome/Edge (best compatibility)

**Face not detected:**
- Ensure good lighting
- Face camera directly
- Remove glasses/hat if possible
- Check console for errors

**Models not loading:**
- Check internet connection (CDN)
- Or download models locally (see Setup #2)

**Verification always fails:**
- Re-enroll face with better lighting
- Adjust threshold in `backend/src/routes/attendance.js` (line ~30)

## API Endpoints

- `POST /api/auth/enroll-face` - Enroll face photo and descriptor
- `GET /api/auth/face-status` - Check if face is enrolled
- All attendance endpoints now require `faceDescriptor` in body

## Notes

- Face recognition uses **face-api.js** library
- Models load from CDN by default (~5-10MB)
- Verification happens in real-time
- Face descriptors are 128-dimensional vectors
- No actual photos stored in attendance records (only descriptors)
