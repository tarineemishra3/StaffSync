# StaffSync — Modern Human Resource Management System (HRMS)

StaffSync is a full-stack MERN application designed to manage organizational workforce operations including role-based access control, employee directories, attendance tracking, leave applications, announcements, and training programs.

---

## Tech Stack

- **Frontend**: React.js with Vite, React Router v7, Bootstrap 5, Bootstrap Icons, Axios
- **Backend**: Node.js & Express.js
- **Database**: MongoDB with Mongoose (with in-memory fallback for automated tests)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Testing**: Jest & Supertest

---

## User Roles & Permissions Overview

| Role | Responsibilities |
| :--- | :--- |
| **Employee** | Record attendance, apply for leave, view announcements, enroll in training sessions, update profile. |
| **Manager** | View team attendance, approve or reject leave applications for reporting employees. |
| **HR** | Full administrative control: manage employees, assign roles, publish announcements, manage training programs. |

*Note: Public registration enforces `Employee` role assignment strictly. Manager and HR roles can only be granted by existing HR staff.*

---

## Project Structure

```
StaffSync/
├── .gitignore
├── README.md
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── server.js        # Server listener
│   │   └── app.js           # Express app & route mounting
│   └── tests/               # Jest & Supertest test suites
└── client/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx          # Root component & health checker
        └── main.jsx         # React mounting with Bootstrap 5
```

---

## Local Setup & Development Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Git

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env    # In Windows PowerShell: Copy-Item .env.example .env
npm run dev
```
The API server starts on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

### 2. Frontend Setup
```bash
cd client
npm install
cp .env.example .env    # In Windows PowerShell: Copy-Item .env.example .env
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## Running Automated Tests

Run backend integration and health check tests:
```bash
cd server
npm test
```

---

## Environment Variables Reference

### Backend (`server/.env.example`)
| Variable | Description | Default Placeholder |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `NODE_ENV` | Runtime environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://<username>:<password>@cluster.mongodb.net/staffsync` |
| `JWT_SECRET` | Secret key used for signing JWTs | `your_jwt_secret_key_change_in_production` |
| `JWT_EXPIRES_IN` | Token expiration lifespan | `7d` |
| `CLIENT_URL` | Allowed origin for CORS | `http://localhost:5173` |

### Frontend (`client/.env.example`)
| Variable | Description | Default Placeholder |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for backend API requests | `http://localhost:5000/api` |

---

## Development Milestones Status

- [x] **Phase 1**: Project initialization, Git setup, MERN scaffolding, health check API, and connectivity verification.
- [ ] **Phase 2**: Backend Core, Database & Secure Authentication (JWT, bcryptjs, RBAC).
- [ ] **Phase 3**: Employee Profiles & HR Management APIs.
- [ ] **Phase 4**: Attendance & Leave Workflows (Validation & Business Rules).
- [ ] **Phase 5**: Announcements, Trainings & Notifications.
- [ ] **Phase 6**: Frontend Bootstrap UI, Responsive Layout & Auth.
- [ ] **Phase 7**: Frontend Feature Modules & Role Dashboards.
- [ ] **Phase 8**: Fictional Seed Data, Full Test Suite & Deployment Configuration.
