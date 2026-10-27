import React from 'react';
import AttendanceView from '../../components/AttendanceView.jsx';

export default function AttendancePage() {
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-clock-history me-2 text-primary" />My Attendance</h4>
        <p className="text-muted mb-0">Track your daily check-in/check-out and attendance history</p>
      </div>
      <AttendanceView />
    </div>
  );
}
