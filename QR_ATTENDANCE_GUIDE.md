# QR Attendance Feature - Complete Guide

## How It Works

### 1. **Teacher Generates QR Code**
- Login as teacher/admin
- Go to **"QR Attendance"** in sidebar
- Enter subject name (e.g., "Mathematics")
- Click **"Generate QR"**
- **Each subject gets a unique QR code** with unique `lectureId`
- QR code is valid for **15 minutes**
- QR code contains: `{ lectureId, subject, timestamp }`

### 2. **Student Scans QR Code**
- Login as student
- Go to **"Mark Attendance"**
- Click **"QR Code Scan"**
- Camera opens automatically
- Point camera at teacher's QR code
- QR code is scanned and parsed
- Face verification screen appears automatically

### 3. **Face Verification**
- Camera opens for face capture
- Face is detected and verified against enrolled face
- If verified → Attendance recorded ✅
- If not verified → Error shown ❌

### 4. **Live Attendance View**
- Teacher can click **"Open Live Attendance View"** link
- Shows real-time list of students who marked attendance
- Updates automatically via Socket.io

## Features

✅ **Unique QR per subject** - Each subject gets a unique `lectureId`  
✅ **15-minute validity** - QR codes expire after 15 minutes  
✅ **Face verification required** - Prevents unauthorized attendance  
✅ **Real-time updates** - Live attendance view updates instantly  
✅ **Error handling** - Clear error messages for invalid/expired QR codes  

## Testing Steps

### Step 1: Generate QR Code (Teacher)
1. Login as `sarah@school.com` / `teacher123`
2. Navigate to **QR Attendance**
3. Enter subject: `Mathematics`
4. Click **Generate QR**
5. QR code appears with subject name

### Step 2: Scan QR Code (Student)
1. Login as `alex@student.com` / `student123` (in another browser/device)
2. **Important**: Student must enroll face first!
   - Go to **"Enroll Face"**
   - Capture face photo
3. Go to **"Mark Attendance"**
4. Click **"QR Code Scan"**
5. Camera opens
6. Point at teacher's QR code
7. QR code is scanned → "QR code scanned successfully!" message
8. Face verification screen appears
9. Capture face → Attendance marked ✅

### Step 3: View Live Attendance (Teacher)
1. After generating QR, click **"Open Live Attendance View"**
2. Keep this tab open
3. When student scans QR and marks attendance, list updates automatically

## Troubleshooting

**QR code not scanning:**
- Check camera permissions
- Ensure good lighting
- Hold phone steady
- Try refreshing the page

**"Invalid QR code" error:**
- Make sure you're scanning the correct QR code
- QR code might be expired (15 minutes)
- Teacher needs to generate a new QR code

**Camera not opening:**
- Check browser permissions
- Use HTTPS or localhost
- Try Chrome/Edge browser

**Face verification fails:**
- Make sure face is enrolled first
- Ensure good lighting
- Face camera directly
- Re-enroll face if needed

## Technical Details

### QR Code Format
```json
{
  "lectureId": "uuid-v4-string",
  "subject": "Mathematics",
  "timestamp": 1234567890
}
```

### Backend Storage
- QR sessions stored in memory: `Map<lectureId, sessionData>`
- Session expires after 15 minutes
- Each QR code is unique per generation

### API Endpoints
- `POST /api/attendance/qr/generate` - Generate QR (teacher)
- `POST /api/attendance/qr/scan` - Scan QR (student)
- `GET /api/attendance/lecture/:lectureId` - Get attendance list

## Notes

- QR codes are **unique per generation** (even same subject)
- Each QR code has a unique `lectureId` (UUID v4)
- QR codes expire after 15 minutes for security
- Face verification is **required** for all attendance methods
- Multiple students can scan the same QR code (each gets unique attendance record)
