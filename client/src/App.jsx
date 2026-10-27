import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Auth pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Shared pages
import AttendancePage from './pages/shared/AttendancePage.jsx';
import LeavePage from './pages/shared/LeavePage.jsx';
import AnnouncementsPage from './pages/shared/AnnouncementsPage.jsx';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import ProfilePage from './pages/employee/ProfilePage.jsx';

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import TeamPage from './pages/manager/TeamPage.jsx';
import TeamAttendancePage from './pages/manager/TeamAttendancePage.jsx';
import ManagerLeavesPage from './pages/manager/ManagerLeavesPage.jsx';

// HR pages
import HRDashboard from './pages/hr/HRDashboard.jsx';
import EmployeeDirectory from './pages/hr/EmployeeDirectory.jsx';
import AddEmployee from './pages/hr/AddEmployee.jsx';
import EditEmployee from './pages/hr/EditEmployee.jsx';
import AttendanceReport from './pages/hr/AttendanceReport.jsx';
import LeaveManagement from './pages/hr/LeaveManagement.jsx';
import AnnouncementsManage from './pages/hr/AnnouncementsManage.jsx';

/** Smart root redirect based on authenticated user role */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const map = { employee: '/dashboard', manager: '/manager', hr: '/hr' };
  return <Navigate to={map[user.role] || '/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root → smart redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Employee routes ── */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['employee']}>
          <Layout><EmployeeDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout><AttendancePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/leaves" element={
        <ProtectedRoute>
          <Layout><LeavePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/announcements" element={
        <ProtectedRoute>
          <Layout><AnnouncementsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* ── Manager routes ── */}
      <Route path="/manager" element={
        <ProtectedRoute roles={['manager', 'hr']}>
          <Layout><ManagerDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/manager/team" element={
        <ProtectedRoute roles={['manager', 'hr']}>
          <Layout><TeamPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/manager/attendance" element={
        <ProtectedRoute roles={['manager', 'hr']}>
          <Layout><TeamAttendancePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/manager/leaves" element={
        <ProtectedRoute roles={['manager', 'hr']}>
          <Layout><ManagerLeavesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* ── HR routes ── */}
      <Route path="/hr" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><HRDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/employees" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><EmployeeDirectory /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/employees/add" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><AddEmployee /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/employees/edit/:id" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><EditEmployee /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/attendance" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><AttendanceReport /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/leaves" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><LeaveManagement /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr/announcements" element={
        <ProtectedRoute roles={['hr']}>
          <Layout><AnnouncementsManage /></Layout>
        </ProtectedRoute>
      } />

      {/* 404 catch-all */}
      <Route path="*" element={
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center">
            <div className="display-1 fw-bold text-primary">404</div>
            <h4 className="mb-3">Page Not Found</h4>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
