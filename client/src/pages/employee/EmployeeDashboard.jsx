import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceAPI, leaveAPI, announcementAPI, profileAPI } from '../../api/index.js';

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
      <div className="card-body d-flex align-items-center gap-3 p-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 52, height: 52, background: bg || '#eff6ff' }}
        >
          <i className={`bi ${icon} fs-4`} style={{ color: color || '#2563eb' }} />
        </div>
        <div>
          <div className="fs-3 fw-bold" style={{ color: color || '#1f2937' }}>{value}</div>
          <div className="small text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    attendanceAPI.getToday().then(r => setTodayStatus(r.data)).catch(() => {});
    attendanceAPI.getMine({ limit: 100 }).then(r => setSummary(r.data.summary)).catch(() => {});
    leaveAPI.getMine().then(r => {
      const pending = (r.data.leaves || []).filter(l => l.status === 'pending').length;
      setPendingLeaves(pending);
    }).catch(() => {});
    announcementAPI.getAll({ limit: 3 }).then(r => setAnnouncements(r.data.announcements || [])).catch(() => {});
    profileAPI.getMyProfile().then(r => setProfile(r.data.profile)).catch(() => {});
  }, []);

  const priorityBadge = { urgent: 'danger', high: 'warning', normal: 'primary', low: 'secondary' };

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h4>
        <p className="text-muted mb-0">
          {profile?.designation || 'Employee'} · {profile?.department || 'General'}
        </p>
      </div>

      {/* Today's status banner */}
      <div
        className="card border-0 mb-4 p-3 d-flex flex-row align-items-center gap-3"
        style={{
          background: todayStatus?.hasCheckedOut
            ? 'linear-gradient(90deg,#dcfce7,#f0fdf4)'
            : todayStatus?.hasCheckedIn
            ? 'linear-gradient(90deg,#fef3c7,#fffbeb)'
            : 'linear-gradient(90deg,#eff6ff,#dbeafe)',
          borderRadius: 12
        }}
      >
        <i
          className={`bi ${todayStatus?.hasCheckedOut ? 'bi-check-circle-fill text-success' : todayStatus?.hasCheckedIn ? 'bi-clock-fill text-warning' : 'bi-circle text-primary'} fs-3`}
        />
        <div className="flex-grow-1">
          <div className="fw-semibold">
            {todayStatus?.hasCheckedOut
              ? `Shift complete — ${todayStatus?.attendance?.totalHours} hrs logged`
              : todayStatus?.hasCheckedIn
              ? 'Shift in progress — remember to check out'
              : "You haven't checked in today yet"}
          </div>
          <div className="small text-muted">{todayStatus?.date || '—'}</div>
        </div>
        <Link to="/attendance" className="btn btn-sm btn-outline-primary">
          {todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut ? 'Check Out' : 'Attendance'}
        </Link>
      </div>

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-calendar-check" label="Days Present" value={summary?.totalPresent ?? '—'} color="#16a34a" bg="#dcfce7" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clock" label="Hours Logged" value={summary?.totalWorkingHours ?? '—'} color="#2563eb" bg="#dbeafe" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-calendar2-x" label="Pending Leaves" value={pendingLeaves} color="#d97706" bg="#fef3c7" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-graph-up" label="Avg Hours/Day" value={summary?.averageHours ?? '—'} color="#7c3aed" bg="#ede9fe" />
        </div>
      </div>

      {/* Quick actions + Announcements */}
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-lightning-charge me-2 text-warning" />Quick Actions</h6>
            </div>
            <div className="card-body d-flex flex-column gap-2 p-3">
              <Link to="/attendance" className="btn btn-outline-primary d-flex align-items-center gap-2">
                <i className="bi bi-clock-history" /> Attendance &amp; Check-In
              </Link>
              <Link to="/leaves" className="btn btn-outline-success d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-plus" /> Apply for Leave
              </Link>
              <Link to="/profile" className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <i className="bi bi-person-gear" /> Update Profile
              </Link>
              <Link to="/announcements" className="btn btn-outline-info d-flex align-items-center gap-2">
                <i className="bi bi-megaphone" /> View Announcements
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="bi bi-megaphone me-2 text-primary" />Latest Announcements</h6>
              <Link to="/announcements" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-3">
              {announcements.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-megaphone display-6 d-block mb-2 opacity-25" />
                  No announcements yet
                </div>
              ) : (
                announcements.map(a => (
                  <div key={a._id} className="mb-3 pb-3 border-bottom last-no-border">
                    <div className="d-flex align-items-start gap-2 mb-1">
                      <span className={`badge bg-${priorityBadge[a.priority] || 'secondary'} text-capitalize`}>
                        {a.priority}
                      </span>
                      <span className="fw-semibold small">{a.title}</span>
                    </div>
                    <p className="small text-muted mb-0" style={{ lineHeight: 1.5 }}>
                      {a.content.length > 120 ? a.content.slice(0, 120) + '…' : a.content}
                    </p>
                    <div className="small text-muted mt-1">
                      <i className="bi bi-person me-1" />{a.author?.name} · {new Date(a.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
