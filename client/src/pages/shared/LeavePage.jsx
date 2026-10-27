import React from 'react';
import LeaveView from '../../components/LeaveView.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LeavePage() {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-calendar2-check me-2 text-primary" />Leave Management</h4>
        <p className="text-muted mb-0">Apply for leave, view history, and manage team requests</p>
      </div>
      <LeaveView userRole={user?.role} />
    </div>
  );
}
