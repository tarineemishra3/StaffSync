import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeAPI, attendanceAPI, leaveAPI } from '../../api/index.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Action feedback states
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchManagerData = () => {
    Promise.allSettled([
      employeeAPI.getTeam(),
      attendanceAPI.getTeam(),
      leaveAPI.getTeam()
    ]).then(([teamRes, attRes, leaveRes]) => {
      if (teamRes.status === 'fulfilled') {
        setTeamMembers(teamRes.value.data.team || []);
      }
      if (attRes.status === 'fulfilled') {
        setTodayAttendance(attRes.value.data.attendance || []);
      }
      if (leaveRes.status === 'fulfilled') {
        const all = leaveRes.value.data.leaves || [];
        setPendingLeaves(all.filter((l) => l.status === 'pending'));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleReviewLeave = async (leaveId, decision) => {
    const remarks = window.prompt(`Enter optional review remarks for ${decision.toUpperCase()}:`) || '';
    setReviewingId(leaveId);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await leaveAPI.review(leaveId, decision, remarks);
      setActionMessage(res.data.message || `Leave request successfully ${decision}.`);
      fetchManagerData();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${decision} leave request`);
    } finally {
      setReviewingId(null);
    }
  };

  const teamCount = teamMembers.length;
  const presentCount = todayAttendance.length;
  const absentCount = Math.max(0, teamCount - presentCount);
  const attendanceRate = teamCount > 0 ? Math.round((presentCount / teamCount) * 100) : 0;

  // Set of user IDs that checked in today
  const checkedInUserIds = new Set(
    todayAttendance.map((a) => (a.user?._id ? a.user._id.toString() : ''))
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-briefcase text-warning me-2" />
            Manager Dashboard
          </h4>
          <p className="text-muted mb-0">
            Welcome, <strong>{user?.name}</strong> · Department Team Management Hub
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/manager/leaves" className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-calendar2-check" /> Leave Approvals
            {pendingLeaves.length > 0 && <span className="badge bg-danger ms-1">{pendingLeaves.length}</span>}
          </Link>
          <Link to="/manager/team" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-people" /> Team Roster
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{actionMessage}
          <button type="button" className="btn-close" onClick={() => setActionMessage(null)} />
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{actionError}
          <button type="button" className="btn-close" onClick={() => setActionError(null)} />
        </div>
      )}

      {/* KPI Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center h-100" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-primary">{loading ? '…' : teamCount}</div>
            <div className="small text-muted">Direct Reports</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center h-100" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-success">{loading ? '…' : presentCount}</div>
            <div className="small text-muted">Present Today</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center h-100" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-secondary">{loading ? '…' : absentCount}</div>
            <div className="small text-muted">Not Checked In</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center h-100" style={{ borderRadius: 12 }}>
            <div className="fs-2 fw-bold text-warning">{loading ? '…' : pendingLeaves.length}</div>
            <div className="small text-muted">Pending Approvals</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="row g-4 mb-4">
        {/* 1. Review, Approve, and Reject Leave Requests */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-calendar2-x me-2 text-warning" />
                Pending Team Leave Approvals
                {pendingLeaves.length > 0 && (
                  <span className="badge bg-danger ms-2">{pendingLeaves.length} action required</span>
                )}
              </h6>
              <Link to="/manager/leaves" className="btn btn-sm btn-outline-warning">View All</Link>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-check-circle display-6 d-block mb-2 text-success opacity-50" />
                  All team leave requests are up to date. No pending decisions.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th className="text-end">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((l) => (
                        <tr key={l._id}>
                          <td>
                            <div className="fw-semibold">{l.user?.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.user?.email}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize">
                              {l.leaveType}
                            </span>
                          </td>
                          <td>
                            <div>{new Date(l.startDate).toLocaleDateString()}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.totalDays} day(s)</div>
                          </td>
                          <td style={{ maxWidth: '180px' }} className="text-truncate" title={l.reason}>
                            {l.reason}
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-success py-1 px-2"
                                onClick={() => handleReviewLeave(l._id, 'approved')}
                                disabled={reviewingId === l._id}
                                title="Approve Request"
                              >
                                <i className="bi bi-check-lg" /> Approve
                              </button>
                              <button
                                className="btn btn-danger py-1 px-2"
                                onClick={() => handleReviewLeave(l._id, 'rejected')}
                                disabled={reviewingId === l._id}
                                title="Reject Request"
                              >
                                <i className="bi bi-x-lg" /> Reject
                              </button>
                            </div>
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

        {/* 2. Team Attendance Today */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-clock-history me-2 text-success" />
                Today's Team Attendance
              </h6>
              <Link to="/manager/attendance" className="btn btn-sm btn-outline-success">Full Report</Link>
            </div>
            <div className="card-body p-0">
              {todayAttendance.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  No check-ins recorded yet for your team today.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Check-In</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAttendance.slice(0, 6).map((a) => (
                        <tr key={a._id}>
                          <td>
                            <div className="fw-semibold">{a.user?.name}</div>
                          </td>
                          <td>
                            {new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            {a.totalHours > 0 ? `${a.totalHours}h` : 'Active'}
                          </td>
                          <td>
                            <span className={`badge bg-${a.status === 'present' ? 'success' : 'warning text-dark'}`}>
                              {a.status}
                            </span>
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
      </div>

      {/* 3. Team Member Overview & Training/Performance */}
      <div className="row g-4">
        {/* Team Members Roster */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-people me-2 text-primary" />
                Team Members Overview
              </h6>
              <Link to="/manager/team" className="btn btn-sm btn-outline-primary">Manage Team</Link>
            </div>
            <div className="card-body p-0">
              {teamMembers.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  No direct reports assigned to you yet. HR assigns reporting managers in Employee Management.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Member</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Today Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.slice(0, 6).map((m) => {
                        const isPresent = checkedInUserIds.has(m.user?._id?.toString() || '');
                        return (
                          <tr key={m._id}>
                            <td>
                              <div className="fw-semibold">{m.user?.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.user?.email}</div>
                            </td>
                            <td>{m.designation || 'Staff'}</td>
                            <td>{m.department || 'General'}</td>
                            <td>
                              {isPresent ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1" />Present
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  Not Checked In
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Training & Performance Section */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-graph-up-arrow me-2 text-info" />
                Team Performance &amp; Training
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Today's Team Attendance Rate</span>
                  <span className="fw-bold">{attendanceRate}%</span>
                </div>
                <div className="progress" style={{ height: 8 }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${attendanceRate}%` }}
                    aria-valuenow={attendanceRate}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>

              <div className="p-3 bg-light rounded small mt-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-warning text-dark">Feature Status</span>
                  <strong className="text-dark">Training &amp; Appraisal Programs</strong>
                </div>
                <p className="text-muted mb-2" style={{ lineHeight: 1.4 }}>
                  Team attendance logs, working hours, and leave approval workflows are fully active. Formal training cohort assignment and quarterly appraisal reviews are scheduled for the next development milestone.
                </p>
                <div className="text-muted small fst-italic">
                  <i className="bi bi-info-circle me-1" />
                  Managers will be able to enroll direct reports into company courses once published by HR.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
