import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceAPI, leaveAPI, announcementAPI, profileAPI } from '../../api/index.js';

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
      <div className="card-body d-flex align-items-center gap-3 p-3 p-md-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 48, height: 48, background: bg || '#eff6ff' }}
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
  const [profile, setProfile] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Check-in / check-out UI state
  const [remarks, setRemarks] = useState('');
  const [attLoading, setAttLoading] = useState(false);
  const [attMessage, setAttMessage] = useState(null);
  const [attError, setAttError] = useState(null);

  // Quick leave application form state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState(null);
  const [leaveError, setLeaveError] = useState(null);

  const fetchDashboardData = () => {
    attendanceAPI.getToday()
      .then(r => setTodayStatus(r.data))
      .catch(() => {});

    attendanceAPI.getMine({ limit: 100 })
      .then(r => setSummary(r.data.summary))
      .catch(() => {});

    leaveAPI.getMine()
      .then(r => setMyLeaves(r.data.leaves || []))
      .catch(() => {});

    announcementAPI.getAll({ limit: 4 })
      .then(r => setAnnouncements(r.data.announcements || []))
      .catch(() => {});

    profileAPI.getMyProfile()
      .then(r => setProfile(r.data.profile))
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setAttLoading(true);
    setAttMessage(null);
    setAttError(null);
    try {
      const res = await attendanceAPI.checkIn(remarks);
      setAttMessage(res.data.message || 'Check-in recorded successfully!');
      setRemarks('');
      attendanceAPI.getToday().then(r => setTodayStatus(r.data)).catch(() => {});
      attendanceAPI.getMine({ limit: 100 }).then(r => setSummary(r.data.summary)).catch(() => {});
    } catch (err) {
      setAttError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setAttLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setAttLoading(true);
    setAttMessage(null);
    setAttError(null);
    try {
      const res = await attendanceAPI.checkOut(remarks);
      setAttMessage(res.data.message || 'Check-out recorded successfully!');
      setRemarks('');
      attendanceAPI.getToday().then(r => setTodayStatus(r.data)).catch(() => {});
      attendanceAPI.getMine({ limit: 100 }).then(r => setSummary(r.data.summary)).catch(() => {});
    } catch (err) {
      setAttError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setAttLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveLoading(true);
    setLeaveMessage(null);
    setLeaveError(null);
    try {
      const res = await leaveAPI.apply(leaveForm);
      setLeaveMessage(res.data.message || 'Leave application submitted successfully!');
      setLeaveForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      setShowApplyModal(false);
      leaveAPI.getMine().then(r => setMyLeaves(r.data.leaves || [])).catch(() => {});
    } catch (err) {
      setLeaveError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await leaveAPI.cancel(leaveId);
      leaveAPI.getMine().then(r => setMyLeaves(r.data.leaves || [])).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const pendingLeavesCount = myLeaves.filter(l => l.status === 'pending').length;
  const approvedLeavesCount = myLeaves.filter(l => l.status === 'approved').length;

  const priorityBadge = {
    urgent: 'danger',
    high: 'warning text-dark',
    normal: 'primary',
    low: 'secondary'
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-person-badge text-primary me-2" />
            Employee Dashboard
          </h4>
          <p className="text-muted mb-0">
            Welcome back, <strong>{user?.name}</strong> · {profile?.designation || 'Staff Member'} ({profile?.department || 'General'})
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/profile" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-person-gear" /> Manage Profile
          </Link>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => setShowApplyModal(true)}
          >
            <i className="bi bi-plus-circle" /> Apply for Leave
          </button>
        </div>
      </div>

      {attMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{attMessage}
          <button type="button" className="btn-close" onClick={() => setAttMessage(null)} />
        </div>
      )}
      {attError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{attError}
          <button type="button" className="btn-close" onClick={() => setAttError(null)} />
        </div>
      )}
      {leaveMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{leaveMessage}
          <button type="button" className="btn-close" onClick={() => setLeaveMessage(null)} />
        </div>
      )}

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            icon="bi-calendar-check"
            label="Days Present"
            value={summary?.totalPresent ?? '0'}
            color="#16a34a"
            bg="#dcfce7"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="bi-clock-history"
            label="Hours Logged"
            value={summary?.totalWorkingHours ? `${summary.totalWorkingHours}h` : '0h'}
            color="#2563eb"
            bg="#dbeafe"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="bi-hourglass-split"
            label="Pending Leaves"
            value={pendingLeavesCount}
            color="#d97706"
            bg="#fef3c7"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="bi-check2-circle"
            label="Approved Leaves"
            value={approvedLeavesCount}
            color="#7c3aed"
            bg="#ede9fe"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* 1. Personal Attendance & Check-In/Check-Out Control */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-clock me-2 text-primary" />
                Personal Attendance Shift
              </h6>
              <Link to="/attendance" className="btn btn-sm btn-outline-primary">Full History</Link>
            </div>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <div className="small text-muted">Today's Workday</div>
                  <div className="fw-bold fs-5 text-dark">{todayStatus?.date || new Date().toISOString().split('T')[0]}</div>
                </div>
                <div>
                  {todayStatus?.hasCheckedOut ? (
                    <span className="badge bg-success px-3 py-2 fs-6">Shift Completed</span>
                  ) : todayStatus?.hasCheckedIn ? (
                    <span className="badge bg-warning text-dark px-3 py-2 fs-6">
                      <span className="spinner-grow spinner-grow-sm me-1" role="status" />
                      Shift In Progress
                    </span>
                  ) : (
                    <span className="badge bg-secondary px-3 py-2 fs-6">Not Checked In</span>
                  )}
                </div>
              </div>

              {todayStatus?.attendance && (
                <div className="bg-light p-3 rounded mb-3 small">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="text-muted">Check-In</div>
                      <div className="fw-semibold">
                        {new Date(todayStatus.attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted">Check-Out</div>
                      <div className="fw-semibold">
                        {todayStatus.attendance.checkOutTime
                          ? new Date(todayStatus.attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted">Duration</div>
                      <div className="fw-bold text-primary">
                        {todayStatus.attendance.totalHours > 0 ? `${todayStatus.attendance.totalHours} hrs` : 'Logging...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Check-In / Check-Out Actions */}
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm mb-3"
                  placeholder="Optional shift remarks (e.g., Remote office, client site)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={attLoading || todayStatus?.hasCheckedOut}
                />
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-fill fw-semibold py-2"
                    onClick={handleCheckIn}
                    disabled={attLoading || todayStatus?.hasCheckedIn}
                  >
                    <i className="bi bi-box-arrow-in-right me-1" />
                    {todayStatus?.hasCheckedIn ? 'Checked In Today' : 'Punch Check In'}
                  </button>
                  <button
                    className="btn btn-outline-danger flex-fill fw-semibold py-2"
                    onClick={handleCheckOut}
                    disabled={attLoading || !todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut}
                  >
                    <i className="bi bi-box-arrow-right me-1" />
                    {todayStatus?.hasCheckedOut ? 'Checked Out Today' : 'Punch Check Out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Employee Profile Overview */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-person-circle me-2 text-info" />
                My Profile Details
              </h6>
              <Link to="/profile" className="btn btn-sm btn-outline-secondary">Edit Profile</Link>
            </div>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
                  style={{ width: 56, height: 56, background: '#2563eb' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'E'}
                </div>
                <div>
                  <h6 className="fw-bold mb-0">{user?.name}</h6>
                  <div className="small text-muted">{user?.email}</div>
                  <span className="badge bg-info text-dark mt-1 text-uppercase">{user?.role}</span>
                </div>
              </div>

              <div className="row g-2 small border-top pt-3">
                <div className="col-6">
                  <span className="text-muted d-block">Department</span>
                  <span className="fw-semibold">{profile?.department || 'General'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Designation</span>
                  <span className="fw-semibold">{profile?.designation || 'Staff Member'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Reporting Manager</span>
                  <span className="fw-semibold">{profile?.reportingManager?.name || 'HR Administration'}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Phone Contact</span>
                  <span className="fw-semibold">{profile?.phone || 'Not provided'}</span>
                </div>
                <div className="col-12 mt-2">
                  <span className="text-muted d-block mb-1">Skills &amp; Capabilities</span>
                  {profile?.skills && profile.skills.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {profile.skills.map((s, idx) => (
                        <span key={idx} className="badge bg-light text-dark border">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted fst-italic">No skills listed yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* 3. Leave Requests & Status */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-calendar2-check me-2 text-success" />
                My Leave Requests
              </h6>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowApplyModal(true)}
                >
                  <i className="bi bi-plus-lg me-1" /> New Request
                </button>
                <Link to="/leaves" className="btn btn-sm btn-outline-secondary">All Leaves</Link>
              </div>
            </div>
            <div className="card-body p-0">
              {myLeaves.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-calendar2-plus display-6 d-block mb-2 opacity-25" />
                  No leave requests found. Click "New Request" to apply.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.slice(0, 5).map((l) => (
                        <tr key={l._id}>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize">
                              {l.leaveType}
                            </span>
                          </td>
                          <td>
                            {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                          </td>
                          <td className="fw-semibold">{l.totalDays}d</td>
                          <td>
                            <span
                              className={`badge ${
                                l.status === 'approved'
                                  ? 'bg-success'
                                  : l.status === 'rejected'
                                  ? 'bg-danger'
                                  : l.status === 'cancelled'
                                  ? 'bg-secondary'
                                  : 'bg-warning text-dark'
                              } text-capitalize`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === 'pending' ? (
                              <button
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                onClick={() => handleCancelLeave(l._id)}
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Announcements & Training Programs */}
        <div className="col-12 col-lg-5">
          <div className="d-flex flex-column gap-4">
            {/* Announcements Card */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-megaphone me-2 text-warning" />
                  Latest Announcements
                </h6>
                <Link to="/announcements" className="btn btn-sm btn-outline-primary">View All</Link>
              </div>
              <div className="card-body p-3">
                {announcements.length === 0 ? (
                  <div className="text-center text-muted py-3 small">
                    No active company announcements.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a._id} className="mb-3 pb-3 border-bottom last-no-border">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`badge bg-${priorityBadge[a.priority] || 'secondary'} text-capitalize`}>
                          {a.priority}
                        </span>
                        <span className="fw-semibold small text-truncate">{a.title}</span>
                      </div>
                      <p className="small text-muted mb-1" style={{ lineHeight: 1.4 }}>
                        {a.content?.length > 100 ? `${a.content.slice(0, 100)}…` : a.content}
                      </p>
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-clock me-1" />
                        {new Date(a.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Training Programs Notice */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-mortarboard me-2 text-purple" style={{ color: '#7c3aed' }} />
                  Training &amp; Development
                </h6>
              </div>
              <div className="card-body p-3">
                <div className="p-3 bg-light rounded small">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-secondary">Catalog Notice</span>
                    <strong className="text-dark">Upcoming Q4 Programs</strong>
                  </div>
                  <p className="text-muted mb-2">
                    HR is scheduling corporate compliance, engineering upskilling, and management readiness courses.
                  </p>
                  <div className="text-muted small fst-italic">
                    <i className="bi bi-info-circle me-1" />
                    Self-service enrollment and program tracking will open here as courses are published by HR.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Application Modal */}
      {showApplyModal && (
        <div
          className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus me-2 text-primary" />
                  Apply for Leave
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApplyModal(false)}
                />
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-4">
                  {leaveError && <div className="alert alert-danger small py-2">{leaveError}</div>}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Leave Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                      required
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="annual">Annual Leave</option>
                      <option value="unpaid">Unpaid Leave</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Start Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">End Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Reason for Leave</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Brief reason for your leave request (min 5 characters)..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowApplyModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={leaveLoading}
                  >
                    {leaveLoading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
