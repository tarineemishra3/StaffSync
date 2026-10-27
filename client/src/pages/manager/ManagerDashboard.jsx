import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeAPI, attendanceAPI, leaveAPI } from '../../api/index.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [teamCount, setTeamCount] = useState('—');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      employeeAPI.getTeam(),
      attendanceAPI.getTeam(),
      leaveAPI.getTeam()
    ]).then(([teamRes, attRes, leaveRes]) => {
      if (teamRes.status === 'fulfilled') setTeamCount(teamRes.value.data.count ?? 0);
      if (attRes.status === 'fulfilled') setTodayAttendance(attRes.value.data.attendance || []);
      if (leaveRes.status === 'fulfilled') {
        const all = leaveRes.value.data.leaves || [];
        setPendingLeaves(all.filter(l => l.status === 'pending'));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Manager Dashboard</h4>
        <p className="text-muted mb-0">Welcome, {user?.name}. Manage your team from here.</p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-primary">{teamCount}</div>
            <div className="small text-muted">Team Members</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-success">{todayAttendance.length}</div>
            <div className="small text-muted">Present Today</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-warning">{pendingLeaves.length}</div>
            <div className="small text-muted">Pending Leaves</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-secondary">
              {typeof teamCount === 'number' ? Math.max(0, teamCount - todayAttendance.length) : '—'}
            </div>
            <div className="small text-muted">Absent Today</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Quick links */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-lightning-charge me-2 text-warning" />Quick Actions</h6>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-2">
              <Link to="/manager/team" className="btn btn-outline-primary d-flex align-items-center gap-2">
                <i className="bi bi-people" />View My Team
              </Link>
              <Link to="/manager/leaves" className="btn btn-outline-warning d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-check" />Review Leave Requests
                {pendingLeaves.length > 0 && <span className="badge bg-danger ms-auto">{pendingLeaves.length}</span>}
              </Link>
              <Link to="/manager/attendance" className="btn btn-outline-success d-flex align-items-center gap-2">
                <i className="bi bi-clock-history" />Team Attendance
              </Link>
              <Link to="/announcements" className="btn btn-outline-info d-flex align-items-center gap-2">
                <i className="bi bi-megaphone" />Announcements
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="bi bi-calendar2-x me-2 text-danger" />Pending Leave Approvals</h6>
              <Link to="/manager/leaves" className="btn btn-sm btn-outline-warning">View All</Link>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-check-circle display-6 d-block mb-2 opacity-25" />No pending leave requests
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th><th>Type</th><th>Dates</th><th>Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.slice(0, 5).map(l => (
                        <tr key={l._id}>
                          <td><div className="fw-semibold">{l.user?.name}</div><div className="text-muted">{l.user?.email}</div></td>
                          <td><span className="badge bg-light text-dark border text-capitalize">{l.leaveType}</span></td>
                          <td>{new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}</td>
                          <td>{l.totalDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
