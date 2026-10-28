import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeAPI, attendanceAPI, leaveAPI } from '../../api/index.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active operations tab
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'attendance', 'roster', 'performance', 'training'

  // Action feedback states
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Review Modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewDecision, setReviewDecision] = useState(null); // 'approved' or 'rejected'
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Team Training management state
  const [teamTrainings, setTeamTrainings] = useState([
    {
      courseId: 'TRN-101',
      courseTitle: 'Corporate Data Security & Cyber Hygiene 2026',
      assignedCount: 4,
      completedCount: 3,
      complianceRate: 75,
      deadline: '2026-11-15'
    },
    {
      courseId: 'TRN-102',
      courseTitle: 'Workplace Ethics & Diversity Standards',
      assignedCount: 4,
      completedCount: 4,
      complianceRate: 100,
      deadline: '2026-10-31'
    },
    {
      courseId: 'TRN-103',
      courseTitle: 'Agile & Modern Team Collaboration',
      assignedCount: 4,
      completedCount: 2,
      complianceRate: 50,
      deadline: '2026-12-01'
    }
  ]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ memberId: '', courseTitle: 'Corporate Data Security & Cyber Hygiene 2026' });

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
        setTeamLeaves(leaveRes.value.data.leaves || []);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const openReviewModal = (leave, decision) => {
    setSelectedLeave(leave);
    setReviewDecision(decision);
    setReviewRemarks(decision === 'approved' ? 'Approved as requested. Shift covered.' : 'Unable to approve due to team operational requirements.');
  };

  const handleConfirmReview = async (e) => {
    e.preventDefault();
    if (!selectedLeave || !reviewDecision) return;

    setReviewLoading(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await leaveAPI.review(selectedLeave._id, reviewDecision, reviewRemarks.trim());
      setActionMessage(res.data.message || `Leave request successfully ${reviewDecision}!`);
      setSelectedLeave(null);
      setReviewDecision(null);
      setReviewRemarks('');
      fetchManagerData();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${reviewDecision} leave request.`);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAssignCourse = (e) => {
    e.preventDefault();
    setActionMessage(`Training program "${assignForm.courseTitle}" assigned successfully to team member.`);
    setShowAssignModal(false);
  };

  const pendingLeaves = teamLeaves.filter(l => l.status === 'pending');
  const teamCount = teamMembers.length;
  const presentCount = todayAttendance.length;
  const absentCount = Math.max(0, teamCount - presentCount);
  const attendanceRate = teamCount > 0 ? Math.round((presentCount / teamCount) * 100) : 0;

  // Set of checked-in user IDs
  const checkedInUserIds = new Set(
    todayAttendance.map(a => a.user?._id?.toString() || '')
  );

  return (
    <div>
      {/* ─── Manager Operations Command Banner ─── */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          background: '#EAF7EE',
          borderRadius: '14px',
          border: '1px solid #d2eed9'
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold fs-4"
              style={{ width: 52, height: 52, background: '#ffffff', color: '#245C3B', border: '2px solid #c2e8cb' }}
            >
              <i className="bi bi-briefcase-fill" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0" style={{ color: '#245C3B' }}>Team Leadership &amp; Operations Center</h4>
                <span className="badge fw-semibold px-2 py-1" style={{ background: '#d7f0df', color: '#245C3B', border: '1px solid #bfe7cc' }}>
                  Manager Hub
                </span>
              </div>
              <p className="mb-0 small mt-1" style={{ color: '#386c4c' }}>
                Lead: <strong>{user?.name}</strong> · Direct Reports: <strong>{teamCount} members</strong> · Shift Compliance: <strong>{attendanceRate}% Present</strong>
              </p>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
              style={{ background: '#ffffff', color: '#245C3B', border: '1px solid #c0e5cb' }}
              onClick={() => setActiveTab('approvals')}
            >
              <i className="bi bi-calendar2-check-fill" style={{ color: '#245C3B' }} />
              Approvals Queue
              {pendingLeaves.length > 0 && (
                <span className="badge bg-danger ms-1">{pendingLeaves.length}</span>
              )}
            </button>
            <Link
              to="/manager/team"
              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
              style={{ background: 'transparent', color: '#245C3B', border: '1px solid #245C3B' }}
            >
              <i className="bi bi-people" /> Roster
            </Link>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{actionMessage}
          <button type="button" className="btn-close" onClick={() => setActionMessage(null)} />
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{actionError}
          <button type="button" className="btn-close" onClick={() => setActionError(null)} />
        </div>
      )}

      {/* ─── Operations KPI Strip ─── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border shadow-sm px-3 py-2 h-100" style={{ borderRadius: 10, borderColor: '#e9ecef', borderLeft: '3px solid #059669' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Team Size</span>
                <span className="fs-4 fw-bold text-dark lh-1">{loading ? '…' : teamCount}</span>
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>direct reports</span>
              </div>
              <div className="d-flex align-items-center justify-content-center bg-emerald bg-opacity-10 rounded-circle text-emerald" style={{ width: 36, height: 36 }}>
                <i className="bi bi-people-fill fs-5" style={{ color: '#059669' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border shadow-sm px-3 py-2 h-100" style={{ borderRadius: 10, borderColor: '#e9ecef', borderLeft: '3px solid #16a34a' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Clocked In Today</span>
                <span className="fs-4 fw-bold text-success lh-1">{loading ? '…' : presentCount}</span>
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>on active duty</span>
              </div>
              <div className="d-flex align-items-center justify-content-center bg-success-subtle rounded-circle text-success" style={{ width: 36, height: 36 }}>
                <i className="bi bi-person-check-fill fs-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border shadow-sm px-3 py-2 h-100" style={{ borderRadius: 10, borderColor: '#e9ecef', borderLeft: '3px solid #64748b' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Not Clocked In</span>
                <span className="fs-4 fw-bold text-secondary lh-1">{loading ? '…' : absentCount}</span>
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>absent or off</span>
              </div>
              <div className="d-flex align-items-center justify-content-center bg-secondary-subtle rounded-circle text-secondary" style={{ width: 36, height: 36 }}>
                <i className="bi bi-person-x-fill fs-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card border shadow-sm px-3 py-2 h-100 ${pendingLeaves.length > 0 ? 'bg-warning-subtle border-warning' : ''}`}
            style={{ borderRadius: 10, borderColor: '#e9ecef', borderLeft: '3px solid #f59e0b' }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Pending Approvals</span>
                <span className="fs-4 fw-bold text-warning-emphasis lh-1">{loading ? '…' : pendingLeaves.length}</span>
                <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>action required</span>
              </div>
              <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-25 rounded-circle text-warning-emphasis" style={{ width: 36, height: 36 }}>
                <i className="bi bi-hourglass-bottom fs-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Manager Operations Tabs ─── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px' }}>
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs card-header-tabs mx-3 mt-2 border-bottom-0">
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'approvals' ? 'active text-success border-bottom border-success border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('approvals')}
              >
                <i className="bi bi-calendar2-check" />
                Leave Approvals Queue
                {pendingLeaves.length > 0 && (
                  <span className="badge bg-danger rounded-pill px-2">{pendingLeaves.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'attendance' ? 'active text-success border-bottom border-success border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('attendance')}
              >
                <i className="bi bi-clock-history" />
                Live Shift Attendance ({presentCount}/{teamCount})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'roster' ? 'active text-success border-bottom border-success border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('roster')}
              >
                <i className="bi bi-people" />
                Direct Reports Roster ({teamCount})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'training' ? 'active text-success border-bottom border-success border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('training')}
              >
                <i className="bi bi-mortarboard" />
                Team Skills &amp; Training
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'performance' ? 'active text-success border-bottom border-success border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('performance')}
              >
                <i className="bi bi-speedometer" />
                Team Performance Analytics
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* ──── Tab 1: Leave Approvals Queue ──── */}
          {activeTab === 'approvals' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Pending Leave Requests from Direct Reports</h6>
                  <span className="text-muted small">Review, approve, or reject team leave applications</span>
                </div>
                <Link to="/manager/leaves" className="btn btn-sm btn-outline-success">
                  Full Approvals History
                </Link>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-check-circle display-4 d-block mb-3 text-success opacity-50" />
                  <h6 className="fw-bold text-dark">All Team Leave Requests are Cleared</h6>
                  <p className="small mb-0">No pending leave requests awaiting your decision.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {pendingLeaves.map((l) => (
                    <div key={l._id} className="p-3 border rounded-3 bg-light shadow-sm">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                            style={{ width: 44, height: 44, background: '#059669' }}
                          >
                            {l.user?.name?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <strong className="fs-6 text-dark d-block">{l.user?.name}</strong>
                            <span className="text-muted small">{l.user?.email}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-3 flex-wrap">
                          <div>
                            <span className="badge bg-light text-dark border text-capitalize px-2 py-1 me-2">
                              {l.leaveType} Leave
                            </span>
                            <span className="fw-bold text-dark">
                              {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                            </span>
                            <span className="badge bg-primary-subtle text-primary ms-2">{l.totalDays} day(s)</span>
                          </div>

                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success d-flex align-items-center gap-1 px-3 py-1"
                              onClick={() => openReviewModal(l, 'approved')}
                            >
                              <i className="bi bi-check-lg" /> Approve
                            </button>
                            <button
                              className="btn btn-danger d-flex align-items-center gap-1 px-3 py-1"
                              onClick={() => openReviewModal(l, 'rejected')}
                            >
                              <i className="bi bi-x-lg" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-top small text-secondary">
                        <strong>Reason given:</strong> <em>"{l.reason}"</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──── Tab 2: Live Shift Attendance ──── */}
          {activeTab === 'attendance' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Today's Real-Time Team Attendance Matrix</h6>
                  <span className="text-muted small">Live punch times and working duration of direct reports</span>
                </div>
                <Link to="/manager/attendance" className="btn btn-sm btn-outline-success">
                  Full Shift Report
                </Link>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-people display-4 d-block mb-2 opacity-25" />
                  No direct reports assigned to your management group yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Team Member</th>
                        <th>Designation</th>
                        <th>Check-In Time</th>
                        <th>Duration Logged</th>
                        <th>Work Location / Note</th>
                        <th>Today's Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((m) => {
                        const att = todayAttendance.find(
                          (a) => (a.user?._id || a.user) === (m.user?._id || m.user)
                        );
                        const isPresent = Boolean(att);

                        return (
                          <tr key={m._id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{ width: 32, height: 32, background: '#059669', fontSize: 13 }}
                                >
                                  {m.user?.name?.[0]?.toUpperCase() || 'M'}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">{m.user?.name}</div>
                                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>{m.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{m.designation || 'Staff'}</td>
                            <td>
                              {att?.checkInTime ? (
                                <span className="fw-semibold text-dark">
                                  {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-muted">—:—</span>
                              )}
                            </td>
                            <td>
                              {att?.totalHours > 0 ? (
                                <span className="fw-bold text-success">{att.totalHours} hrs</span>
                              ) : isPresent ? (
                                <span className="text-primary fw-semibold">Tracking...</span>
                              ) : (
                                <span className="text-muted">0 hrs</span>
                              )}
                            </td>
                            <td>
                              <span className="text-muted small">{att?.remarks || '—'}</span>
                            </td>
                            <td>
                              {isPresent ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                  <i className="bi bi-check-circle-fill me-1" /> Present &amp; Working
                                </span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                                  <i className="bi bi-moon me-1" /> Not Checked In
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
          )}

          {/* ──── Tab 3: Direct Reports Roster ──── */}
          {activeTab === 'roster' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Direct Reports Team Directory</h6>
                  <span className="text-muted small">Manage and review direct reporting employee records</span>
                </div>
                <Link to="/manager/team" className="btn btn-sm btn-outline-success">
                  Manage Roster
                </Link>
              </div>

              <div className="row g-3">
                {teamMembers.map((emp) => (
                  <div key={emp._id} className="col-12 col-md-6 col-lg-4">
                    <div className="card border h-100 shadow-sm" style={{ borderRadius: 12 }}>
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{ width: 44, height: 44, background: '#059669', fontSize: 16 }}
                          >
                            {emp.user?.name?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div className="overflow-hidden">
                            <strong className="text-dark d-block text-truncate">{emp.user?.name}</strong>
                            <span className="text-muted small text-truncate d-block">{emp.user?.email}</span>
                          </div>
                        </div>

                        <div className="small text-muted mb-2">
                          <div><strong>Designation:</strong> {emp.designation || 'Staff Member'}</div>
                          <div><strong>Department:</strong> {emp.department || 'Operations'}</div>
                          <div><strong>Phone:</strong> {emp.phone || 'Not listed'}</div>
                        </div>

                        <div className="d-flex flex-wrap gap-1 mt-2 border-top pt-2">
                          {emp.skills && emp.skills.length > 0 ? (
                            emp.skills.map((s, idx) => (
                              <span key={idx} className="badge bg-light text-dark border" style={{ fontSize: '0.68rem' }}>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small fst-italic">Standard skills profile</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── Tab 4: Team Skills & Training ──── */}
          {activeTab === 'training' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Team Upskilling &amp; Compliance Management</h6>
                  <span className="text-muted small">Oversee team certifications and compliance courses</span>
                </div>
                <button className="btn btn-sm btn-success" onClick={() => setShowAssignModal(true)}>
                  <i className="bi bi-plus-lg me-1" /> Assign Course
                </button>
              </div>

              <div className="row g-3 mb-4">
                {teamTrainings.map((trn) => (
                  <div key={trn.courseId} className="col-12 col-md-4">
                    <div className="card border h-100 p-3 shadow-sm" style={{ borderRadius: 12 }}>
                      <span className="badge bg-emerald text-white small mb-2 w-auto align-self-start">
                        {trn.courseId}
                      </span>
                      <h6 className="fw-bold text-dark mb-1">{trn.courseTitle}</h6>
                      <div className="small text-muted mb-2">
                        Target Deadline: <strong>{trn.deadline}</strong>
                      </div>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Team Completed: {trn.completedCount} / {trn.assignedCount}</span>
                          <span className="fw-bold text-success">{trn.complianceRate}%</span>
                        </div>
                        <div className="progress" style={{ height: 8 }}>
                          <div className="progress-bar bg-success" style={{ width: `${trn.complianceRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-light rounded-3 border small text-muted">
                <i className="bi bi-info-circle me-1 text-primary" />
                Managers can assign corporate learning tracks to direct reports. Training completion data feeds into employee performance evaluations.
              </div>
            </div>
          )}

          {/* ──── Tab 5: Team Performance Analytics ──── */}
          {activeTab === 'performance' && (
            <div>
              <div className="mb-3">
                <h6 className="fw-bold mb-0">Team Performance &amp; Attendance Metrics</h6>
                <span className="text-muted small">Real attendance compliance and team capacity benchmarks</span>
              </div>

              <div className="row g-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 bg-light">
                    <h6 className="small fw-bold text-muted mb-2">Today's Team Shift Compliance</h6>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fs-3 fw-bold text-success">{attendanceRate}%</span>
                      <span className="text-muted small">{presentCount} of {teamCount} on duty</span>
                    </div>
                    <div className="progress mb-3" style={{ height: 10 }}>
                      <div className="progress-bar bg-success" style={{ width: `${attendanceRate}%` }} />
                    </div>
                    <p className="small text-muted mb-0">
                      Evaluated against active direct reports assigned to your reporting structure.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 bg-light">
                    <h6 className="small fw-bold text-muted mb-2">Direct Reports Leave Health</h6>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fs-3 fw-bold text-warning">{pendingLeaves.length}</span>
                      <span className="text-muted small">Pending approval decisions</span>
                    </div>
                    <div className="small text-muted mb-2">
                      Historical team requests: <strong>{teamLeaves.length} total</strong>
                    </div>
                    <p className="small text-muted mb-0">
                      Approved: <strong>{teamLeaves.filter(l => l.status === 'approved').length}</strong> ·
                      Rejected: <strong>{teamLeaves.filter(l => l.status === 'rejected').length}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Leave Review Modal ─── */}
      {selectedLeave && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {reviewDecision === 'approved' ? (
                    <span className="text-success"><i className="bi bi-check-circle me-2" />Approve Leave Request</span>
                  ) : (
                    <span className="text-danger"><i className="bi bi-x-circle me-2" />Reject Leave Request</span>
                  )}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLeave(null)} />
              </div>
              <form onSubmit={handleConfirmReview}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <div><strong>Applicant:</strong> {selectedLeave.user?.name} ({selectedLeave.user?.email})</div>
                    <div><strong>Type:</strong> <span className="text-capitalize">{selectedLeave.leaveType}</span></div>
                    <div><strong>Dates:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()} ({selectedLeave.totalDays} days)</div>
                    <div><strong>Reason:</strong> <em>"{selectedLeave.reason}"</em></div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">
                      Review Remarks {reviewDecision === 'rejected' && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Add operational notes or instructions for the applicant..."
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      required={reviewDecision === 'rejected'}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedLeave(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm ${reviewDecision === 'approved' ? 'btn-success' : 'btn-danger'} px-3 fw-semibold`}
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? 'Processing...' : `Confirm ${reviewDecision === 'approved' ? 'Approval' : 'Rejection'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Assign Course Modal ─── */}
      {showAssignModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-mortarboard text-success me-2" />
                  Assign Course to Team Member
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
              </div>
              <form onSubmit={handleAssignCourse}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Direct Report</label>
                    <select
                      className="form-select form-select-sm"
                      value={assignForm.memberId}
                      onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                      required
                    >
                      <option value="">Choose a team member...</option>
                      {teamMembers.map(m => (
                        <option key={m._id} value={m._id}>{m.user?.name} ({m.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Select Course</label>
                    <select
                      className="form-select form-select-sm"
                      value={assignForm.courseTitle}
                      onChange={(e) => setAssignForm({ ...assignForm, courseTitle: e.target.value })}
                      required
                    >
                      <option value="Corporate Data Security & Cyber Hygiene 2026">Corporate Data Security &amp; Cyber Hygiene 2026</option>
                      <option value="Workplace Ethics & Diversity Standards">Workplace Ethics &amp; Diversity Standards</option>
                      <option value="Agile & Modern Team Collaboration">Agile &amp; Modern Team Collaboration</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success px-3 fw-semibold">
                    Assign Course
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