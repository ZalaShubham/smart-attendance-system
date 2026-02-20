# API Routes Documentation

Base URL: `http://localhost:5000/api` (or proxied via frontend at `/api`)

All authenticated routes require header: `Authorization: Bearer <token>`

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register (student/teacher) |
| POST | /auth/login | No | Login, returns token |
| GET | /auth/me | Yes | Current user profile |
| PUT | /auth/profile | Yes | Update interests, goals |

**Register body:** `{ name, email, password, role?, interests?, goals?, improvementAreas? }`

**Login body:** `{ email, password }`

---

## Timetable

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /timetable | Yes | All | Get timetable, ?day=0-6 |
| POST | /timetable | Yes | Teacher/Admin | Create entry |
| PUT | /timetable/:id | Yes | Teacher/Admin | Update entry |
| DELETE | /timetable/:id | Yes | Teacher/Admin | Delete entry |

**Create body:** `{ subject, classroom, startTime, endTime, dayOfWeek }`

---

## Attendance

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /attendance/qr/generate | Yes | Teacher/Admin | Generate QR code |
| POST | /attendance/qr/scan | Yes | Student | Mark via QR scan |
| POST | /attendance/proximity | Yes | Student | Simulate proximity |
| POST | /attendance/face | Yes | Student | Face recognition stub |
| GET | /attendance | Yes | All | List records (?studentId, ?subject) |
| GET | /attendance/lecture/:lectureId | Yes | Teacher/Admin | Lecture attendance |
| GET | /attendance/stats | Yes | All | Student stats (?studentId) |

**QR generate body:** `{ subject }`

**QR scan body:** `{ lectureId, subject }`

**Proximity/Face body:** `{ subject }`

---

## Users

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /users | Yes | Admin | All users |
| GET | /users/students | Yes | All | All students |

---

## Miscellaneous

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /suggestions | No | Free period suggestions |
| GET | /health | No | Health check |

---

## Socket.io Events

**Client → Server:**
- `join-lecture` (lectureId) - Subscribe to lecture updates
- `leave-lecture` (lectureId) - Unsubscribe

**Server → Client:**
- `attendance-update` - { student, subject, time } when student marks attendance
