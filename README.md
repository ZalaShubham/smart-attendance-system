cd # Smart Curriculum Activity & Attendance App

A full-stack web application that **automates attendance** (QR / Proximity / Face placeholder) and helps students **use free periods productively** via personalized suggestions and a daily routine generator.

## Tech stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, `html5-qrcode`, `face-api.js`, Socket.io Client
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT Auth, Socket.io

## What this project can do (functionality)

- **Authentication**
  - Student / Teacher registration + login
  - JWT-based sessions
  - Role-based UI + API access (student / teacher / admin)
- **Timetable management**
  - Teacher/Admin: create and delete timetable entries
  - Students: view daily timetable
- **Smart attendance** (ALL methods require face verification)
  - **QR attendance**: teacher generates QR → student scans QR → face verification → attendance recorded
  - **Proximity (simulated)**: enter subject → face verification → attendance recorded
  - **Face recognition**: enter subject → face capture → verification → attendance recorded
  - **Face enrollment**: students must enroll face photo first (one-time setup)
- **Real-time classroom attendance**
  - Teacher live view shows **present count + list**, updates instantly using Socket.io
- **Free period smart suggestions**
  - Suggestions based on student’s **interests / goals / improvement areas**
- **Daily routine generator**
  - Builds a day plan combining **classes + free-time slots + goals**
- **Dashboards & analytics**
  - Student: engagement snapshot (sessions, productivity score), timetable, recent attendance
  - Teacher: attendance overview + subject-wise totals
  - Admin: users + overall attendance stats

## Project structure

```
Smart Attendance And Curricular System/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/                 # User, Timetable, Attendance
│   │   ├── middleware/auth.js      # JWT auth, role checks
│   │   ├── routes/                 # auth, timetable, attendance, users
│   │   ├── index.js                # Express + Socket.io server
│   │   └── seed.js                 # mock data seeder
│   ├── .env.example
│   ├── .env                        # (local dev) update with your values
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Layout, ProtectedRoute
│   │   ├── context/                # AuthContext, SocketContext
│   │   ├── pages/                  # all screens
│   │   └── services/api.js         # Axios base client
│   ├── vite.config.js              # dev proxy to backend + ws
│   └── package.json
├── API_ROUTES.md                   # API documentation
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** (local OR MongoDB Atlas)
- **npm**

## Pending details you must fill (your own values)

Edit `backend/.env` (or create it from `.env.example`) and set:

- **`MONGODB_URI`**: your MongoDB connection string
  - Local example: `mongodb://localhost:27017/smart-attendance`
  - Atlas example: `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`
- **`JWT_SECRET`**: change to a long random secret (important for security)
  - Recommended: 32+ characters
- **`CLIENT_URL`**: where your frontend runs
  - Dev: `http://localhost:5173`
- **`PORT`**: backend port (default `5000`)

Optional (your customization):

- **Mock users/timetable**: edit `backend/src/seed.js` to change test accounts and timetable data.

## Setup (Windows / PowerShell)

From the workspace root:

### 1) Install dependencies

```powershell
cd "c:\Smart Attendance And Curricular System\backend"
npm install

cd "c:\Smart Attendance And Curricular System\frontend"
npm install
```

### 2) Configure environment

```powershell
cd "c:\Smart Attendance And Curricular System\backend"
copy .env.example .env
notepad .env
```

### 3) Seed mock data (recommended for testing)

```powershell
cd "c:\Smart Attendance And Curricular System\backend"
npm run seed
```

### 4) Run backend + frontend (live preview)

**Terminal 1 (Backend):**

```powershell
cd "c:\Smart Attendance And Curricular System\backend"
npm run dev
```

**Terminal 2 (Frontend):**

```powershell
cd "c:\Smart Attendance And Curricular System\frontend"
npm run dev
```

### 5) Open the app

- **Frontend (Live preview):** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`

## Test accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Teacher | sarah@school.com | teacher123 |
| Teacher | mike@school.com | teacher123 |
| Student | alex@student.com | student123 |
| Student | emma@student.com | student123 |
| Student | james@student.com | student123 |

## How JWT token works (how to “take” the token)

- On **Login** (`POST /api/auth/login`) or **Register** (`POST /api/auth/register`), the backend returns a JSON response containing `token`.
- The frontend automatically saves it in **`localStorage`** as `token` and sends it as:
  - `Authorization: Bearer <token>`

If you’re testing with Postman/Thunder Client:

1. Call `POST /api/auth/login`
2. Copy the `token` from the response
3. Add header `Authorization: Bearer <token>` to protected requests

## Screens / flows to test (end-to-end)

### Student

1. Login as a student
2. Open **Timetable** (daily classes)
3. Open **Free Period** (personalized suggestions)
4. Open **Daily Routine** (schedule + free slots)
5. Open **Mark Attendance**
   - **QR scan**: requires teacher to generate QR first
   - **Proximity**: type subject → mark
   - **Face**: placeholder → records attendance

### Teacher

1. Login as teacher
2. Open **Manage Timetable** → add a few entries
3. Open **QR Attendance** → generate QR (subject)
4. Click **Open live attendance view**
5. Ask a student to scan the QR → the live page updates in real-time

### Admin

1. Login as admin
2. Open **Admin Dashboard** for user + attendance insights

## API documentation

See `API_ROUTES.md` for all endpoints, request bodies, and Socket.io events.

## Troubleshooting

- **MongoDB connection error**
  - Make sure MongoDB is running, and `MONGODB_URI` is correct.
- **Camera not working for QR scan**
  - Use HTTPS or `http://localhost`, allow camera permission in the browser.
  - Try Chrome/Edge; close other apps using the camera.
- **CORS errors**
  - Ensure `CLIENT_URL` in `backend/.env` matches your frontend URL.
- **Ports already in use**
  - Change `PORT` in backend `.env`, and update `frontend/vite.config.js` proxy target if needed.

## Face Recognition

**Real face recognition is now implemented!** See `FACE_RECOGNITION_SETUP.md` for details.

- Students must enroll face photo before marking attendance
- All attendance methods (QR, Proximity, Face) require face verification
- Uses face-api.js for face detection and matching
- Prevents proximity abuse (can't just click button without verification)

## Notes / limitations

- Face models load from CDN (~5-10MB) - ensure internet connection
- Camera permission required (HTTPS or localhost)
- The QR “lecture session” is stored in memory on the backend for 15 minutes (valid for demo/dev).

## License

MIT
