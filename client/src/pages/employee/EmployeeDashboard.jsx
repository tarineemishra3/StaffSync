import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceAPI, leaveAPI, announcementAPI, profileAPI } from '../../api/index.js';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Active view tab
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves', 'training', 'announcements', 'profile'
  const [leaveFilter, setLeaveFilter] = useState('all');

  // Check-in / check-out state
  const [workMode, setWorkMode] = useState('Office');
  const [remarks, setRemarks] = useState('');
  const [attLoading, setAttLoading] = useState(false);
  const [attMessage, setAttMessage] = useState(null);
  const [attError, setAttError] = useState(null);

  // Apply Leave Modal state
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

  // Interactive Training Programs state
  const [trainings, setTrainings] = useState([
    {
      id: 'TRN-101',
      title: 'Corporate Data Security & Cyber Hygiene 2026',
      category: 'Information Security',
      totalModules: 4,
      completedModules: 3,
      duration: '3.5 Hours',
      status: 'in-progress',
      instructor: 'SecOps Team',
      description: 'Essential security guidelines covering credential safety, phishing detection, and remote work encryption.'
    },
    {
      id: 'TRN-102',
      title: 'Workplace Ethics & Diversity Standards',
      category: 'HR Compliance',
      totalModules: 3,
      completedModules: 3,
      duration: '2.0 Hours',
      status: 'completed',
      instructor: 'HR People & Culture',
      description: 'Comprehensive overview of professional conduct, diversity, anti-harassment policy, and workplace respect.'
    },
    {
      id: 'TRN-103',
      title: 'Agile & Modern Team Collaboration',
      category: 'Professional Skills',
      totalModules: 5,
      completedModules: 1,
      duration: '4.0 Hours',
      status: 'in-progress',
      instructor: 'Product Operations',
      description: 'Best practices for asynchronous standups, sprint retrospectives, and cross-functional team delivery.'
    },
    {
      id: 'TRN-104',
      title: 'Mental Wellness & Work-Life Balance',
      category: 'Wellness & Health',
      totalModules: 2,
      completedModules: 0,
      duration: '1.5 Hours',
      status: 'enrolled',
      instructor: 'Wellness Council',
      description: 'Strategies for preventing burnout, optimizing digital ergonomics, and maintaining healthy boundaries.'
    }
  ]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [showCertModal, setShowCertModal] = useState(null);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

    announcementAPI.getAll({ limit: 8 })
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
      const fullRemarks = `[${workMode}] ${remarks.trim()}`.trim();
      const res = await attendanceAPI.checkIn(fullRemarks);
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
      const fullRemarks = remarks.trim() ? `[${workMode}] ${remarks.trim()}` : '';
      const res = await attendanceAPI.checkOut(fullRemarks);
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
      setLeaveMessage('Leave request cancelled successfully.');
      leaveAPI.getMine().then(r => setMyLeaves(r.data.leaves || [])).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  // Compute Leave Balances (based on approved leaves)
  const approvedLeaves = myLeaves.filter(l => l.status === 'approved');
  const usedCasual = approvedLeaves.filter(l => l.leaveType === 'casual').reduce((acc, c) => acc + (c.totalDays || 1), 0);
  const usedSick = approvedLeaves.filter(l => l.leaveType === 'sick').reduce((acc, c) => acc + (c.totalDays || 1), 0);
  const usedAnnual = approvedLeaves.filter(l => l.leaveType === 'annual').reduce((acc, c) => acc + (c.totalDays || 1), 0);

  const balances = {
    casual: Math.max(0, 12 - usedCasual),
    sick: Math.max(0, 10 - usedSick),
    annual: Math.max(0, 15 - usedAnnual)
  };

  // Filter leaves
  const filteredLeaves = myLeaves.filter(l => {
    if (leaveFilter === 'all') return true;
    return l.status === leaveFilter;
  });

  const priorityColors = {
    urgent: 'danger',
    high: 'warning text-dark',
    normal: 'primary',
    low: 'secondary'
  };

  // Interactive training module progression
  const handleCompleteModule = (courseId) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === courseId) {
        const nextCount = Math.min(t.totalModules, t.completedModules + 1);
        return {
          ...t,
          completedModules: nextCount,
          status: nextCount === t.totalModules ? 'completed' : 'in-progress'
        };
      }
      return t;
    }));
  };

  return (
    <div>
      {/* ─── Hero Workplace Greeting Banner ─── */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          background: '#EAF3FF',
          borderRadius: '14px',
          border: '1px solid #d4e5fa'
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold fs-4"
              style={{ width: 52, height: 52, background: '#ffffff', color: '#244A78', border: '2px solid #cce0fa' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0" style={{ color: '#244A78' }}>Welcome back, {user?.name}!</h4>
                <span className="badge fw-semibold px-2 py-1" style={{ background: '#dcebff', color: '#244A78', border: '1px solid #c5ddfc' }}>
                  Employee Self-Service
                </span>
              </div>
              <p className="mb-0 small mt-1" style={{ color: '#3b628c' }}>
                {profile?.designation || 'Staff Member'} · {profile?.department || 'General Department'} · ID: {profile?.employeeId || 'SS-EMP'}
              </p>
            </div>
          </div>

          {/* Live Digital Clock Widget */}
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: '#ffffff', border: '1px solid #d0e2fa', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <i className="bi bi-clock-history fs-5" style={{ color: '#244A78' }} />
            <div className="text-end">
              <div className="fs-6 fw-bold lh-1 font-monospace" style={{ color: '#244A78' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ color: '#5a789c', fontSize: '0.72rem' }}>
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {attMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{attMessage}
          <button type="button" className="btn-close" onClick={() => setAttMessage(null)} />
        </div>
      )}
      {attError && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{attError}
          <button type="button" className="btn-close" onClick={() => setAttError(null)} />
        </div>
      )}
      {leaveMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{leaveMessage}
          <button type="button" className="btn-close" onClick={() => setLeaveMessage(null)} />
        </div>
      )}

      {/* ─── Punch In / Out Shift Desk ─── */}
      <div className="row g-4 mb-4">
        {/* Live Attendance Clock Card */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '14px', borderLeft: '4px solid #2563eb' }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="p-2 rounded bg-primary-subtle text-primary">
                  <i className="bi bi-fingerprint fs-5" />
                </span>
                <div>
                  <h6 className="fw-bold mb-0">Daily Shift Attendance Punch</h6>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Automated business shift logger</span>
                </div>
              </div>
              <div>
                {todayStatus?.hasCheckedOut ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
                    <i className="bi bi-check2-all me-1" /> Shift Completed
                  </span>
                ) : todayStatus?.hasCheckedIn ? (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fw-semibold">
                    <span className="spinner-grow spinner-grow-sm me-1" role="status" /> In Progress
                  </span>
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 fw-semibold">
                    <i className="bi bi-moon me-1" /> Not Punched In
                  </span>
                )}
              </div>
            </div>

            <div className="card-body p-4">
              {/* Shift Timing Strip */}
              <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <div className="row text-center g-2">
                  <div className="col-4 border-end">
                    <span className="text-muted small d-block">Punch-In</span>
                    <strong className="fs-6 text-dark">
                      {todayStatus?.attendance?.checkInTime
                        ? new Date(todayStatus.attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—:—'}
                    </strong>
                  </div>
                  <div className="col-4 border-end">
                    <span className="text-muted small d-block">Punch-Out</span>
                    <strong className="fs-6 text-dark">
                      {todayStatus?.attendance?.checkOutTime
                        ? new Date(todayStatus.attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—:—'}
                    </strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted small d-block">Duration Logged</span>
                    <strong className="fs-6 text-primary">
                      {todayStatus?.attendance?.totalHours > 0 ? `${todayStatus.attendance.totalHours} hrs` : (todayStatus?.hasCheckedIn ? 'Tracking...' : '0 hrs')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Work Mode & Remarks Input */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Work Location</label>
                  <select
                    className="form-select form-select-sm"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    disabled={attLoading || todayStatus?.hasCheckedOut}
                  >
                    <option value="Office">🏢 Office (In-Person)</option>
                    <option value="Remote">🏠 Remote (WFH)</option>
                    <option value="Client Site">📍 Client Site</option>
                  </select>
                </div>
                <div className="col-12 col-md-8">
                  <label className="form-label small fw-semibold text-muted mb-1">Shift Note / Remarks</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Standard shift, morning standup attended..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={attLoading || todayStatus?.hasCheckedOut}
                  />
                </div>
              </div>

              {/* Punch Actions */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-fill fw-semibold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={handleCheckIn}
                  disabled={attLoading || todayStatus?.hasCheckedIn}
                >
                  <i className="bi bi-box-arrow-in-right fs-5" />
                  {todayStatus?.hasCheckedIn ? 'Checked In Today' : 'Punch Check In'}
                </button>
                <button
                  className="btn btn-outline-danger flex-fill fw-semibold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={handleCheckOut}
                  disabled={attLoading || !todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut}
                >
                  <i className="bi bi-box-arrow-right fs-5" />
                  {todayStatus?.hasCheckedOut ? 'Checked Out Today' : 'Punch Check Out'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Month-to-Date Performance */}
        <div className="col-12 col-lg-5">
          <div className="card border shadow-sm h-100" style={{ borderRadius: '12px', borderColor: '#e9ecef' }}>
            <div className="card-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 small">
                <i className="bi bi-bar-chart-line text-success me-2" />
                Monthly Attendance Performance
              </h6>
              <Link to="/attendance" className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.8rem' }}>History</Link>
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-around">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                <div>
                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Days Present This Month</span>
                  <span className="fs-4 fw-bold text-success lh-1">{summary?.totalPresent ?? 0}</span>
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>workdays</span>
                </div>
                <div className="d-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-calendar-check fs-5" />
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                <div>
                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Working Hours</span>
                  <span className="fs-4 fw-bold text-primary lh-1">{summary?.totalWorkingHours ?? 0}h</span>
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>logged</span>
                </div>
                <div className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-stopwatch fs-5" />
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-1">
                <div>
                  <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Active Leaves & Approvals</span>
                  <span className="fs-4 fw-bold text-warning-emphasis lh-1">{myLeaves.filter(l => l.status === 'pending').length}</span>
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>pending</span>
                </div>
                <div className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning-emphasis rounded-circle" style={{ width: 36, height: 36 }}>
                  <i className="bi bi-hourglass-split fs-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leave Balances Visual Strip ─── */}
      <div className="card border shadow-sm mb-4" style={{ borderRadius: '12px', background: '#ffffff', borderColor: '#e9ecef' }}>
        <div className="card-body p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div>
              <h6 className="fw-bold mb-0">
                <i className="bi bi-calendar-heart text-danger me-2" />
                Leave Balances &amp; Time Off
              </h6>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Annual standard employee quota for calendar year 2026</span>
            </div>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm py-1 px-2"
              style={{ fontSize: '0.8rem' }}
              onClick={() => setShowApplyModal(true)}
            >
              <i className="bi bi-plus-circle-fill" /> Apply for Leave
            </button>
          </div>

          <div className="row g-2">
            <div className="col-6 col-md-3">
              <div className="p-2 px-3 rounded-3 border h-100" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <span className="badge bg-success-subtle text-success small mb-1" style={{ fontSize: '0.7rem' }}>Casual Leave</span>
                <div className="fs-4 fw-bold text-success lh-1">{balances.casual} <span className="fs-6 text-muted fw-normal">/ 12 left</span></div>
                <div className="progress mt-2" style={{ height: 4 }}>
                  <div className="progress-bar bg-success" style={{ width: `${(balances.casual / 12) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-2 px-3 rounded-3 border h-100" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <span className="badge bg-primary-subtle text-primary small mb-1" style={{ fontSize: '0.7rem' }}>Sick Leave</span>
                <div className="fs-4 fw-bold text-primary lh-1">{balances.sick} <span className="fs-6 text-muted fw-normal">/ 10 left</span></div>
                <div className="progress mt-2" style={{ height: 4 }}>
                  <div className="progress-bar bg-primary" style={{ width: `${(balances.sick / 10) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-2 px-3 rounded-3 border h-100" style={{ background: '#fdf4ff', borderColor: '#f5d0fe' }}>
                <span className="badge bg-purple-subtle text-purple small mb-1" style={{ fontSize: '0.7rem' }}>Annual Leave</span>
                <div className="fs-4 fw-bold lh-1" style={{ color: '#9333ea' }}>{balances.annual} <span className="fs-6 text-muted fw-normal">/ 15 left</span></div>
                <div className="progress mt-2" style={{ height: 4 }}>
                  <div className="progress-bar bg-purple" style={{ width: `${(balances.annual / 15) * 100}%`, backgroundColor: '#9333ea' }} />
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-2 px-3 rounded-3 border h-100" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <span className="badge bg-secondary-subtle text-secondary small mb-1" style={{ fontSize: '0.7rem' }}>Pending Approval</span>
                <div className="fs-4 fw-bold text-dark lh-1">{myLeaves.filter(l => l.status === 'pending').length} <span className="fs-6 text-muted fw-normal">requests</span></div>
                <div className="text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                  <i className="bi bi-clock me-1" /> Awaiting review
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Employee Portal Tabs (Leaves, Training, Bulletins, Profile) ─── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px' }}>
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs card-header-tabs mx-3 mt-2 border-bottom-0">
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'leaves' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('leaves')}
              >
                <i className="bi bi-calendar2-check" />
                My Leave History ({myLeaves.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'training' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('training')}
              >
                <i className="bi bi-mortarboard-fill" />
                Training Programs ({trainings.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'announcements' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('announcements')}
              >
                <i className="bi bi-megaphone-fill" />
                Company Bulletins ({announcements.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'profile' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person-lines-fill" />
                Personal Profile Record
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* ──── Tab 1: Leaves ──── */}
          {activeTab === 'leaves' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className={`btn ${leaveFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setLeaveFilter('all')}
                  >
                    All ({myLeaves.length})
                  </button>
                  <button
                    className={`btn ${leaveFilter === 'pending' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setLeaveFilter('pending')}
                  >
                    Pending ({myLeaves.filter(l => l.status === 'pending').length})
                  </button>
                  <button
                    className={`btn ${leaveFilter === 'approved' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setLeaveFilter('approved')}
                  >
                    Approved ({myLeaves.filter(l => l.status === 'approved').length})
                  </button>
                  <button
                    className={`btn ${leaveFilter === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => setLeaveFilter('rejected')}
                  >
                    Rejected ({myLeaves.filter(l => l.status === 'rejected').length})
                  </button>
                </div>

                <button className="btn btn-sm btn-primary" onClick={() => setShowApplyModal(true)}>
                  <i className="bi bi-plus-lg me-1" /> New Leave Application
                </button>
              </div>

              {filteredLeaves.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-calendar-x display-5 d-block mb-2 opacity-25" />
                  No leave applications found for this filter.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Leave Type</th>
                        <th>Dates Requested</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Reviewer Notes</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaves.map((l) => (
                        <tr key={l._id}>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize px-2 py-1">
                              {l.leaveType}
                            </span>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Applied: {new Date(l.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="fw-bold">{l.totalDays}d</td>
                          <td style={{ maxWidth: 220 }} className="text-truncate" title={l.reason}>
                            {l.reason}
                          </td>
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
                              } text-capitalize px-2 py-1`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="text-muted small" style={{ maxWidth: 180 }}>
                            {l.reviewRemarks || (l.status === 'pending' ? 'Pending manager decision' : '—')}
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
          )}

          {/* ──── Tab 2: Interactive Training Programs ──── */}
          {activeTab === 'training' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Professional Learning &amp; Upskilling Catalog</h6>
                  <span className="text-muted small">Mandatory corporate compliance and voluntary skill-building courses</span>
                </div>
                <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 small">
                  <i className="bi bi-shield-check me-1" /> Real-Time Self-Paced Catalog
                </span>
              </div>

              <div className="row g-3">
                {trainings.map((trn) => {
                  const pct = Math.round((trn.completedModules / trn.totalModules) * 100);
                  return (
                    <div key={trn.id} className="col-12 col-md-6">
                      <div className="card border h-100 shadow-sm" style={{ borderRadius: 12 }}>
                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="badge bg-secondary-subtle text-secondary small">{trn.category}</span>
                              <span className={`badge ${trn.status === 'completed' ? 'bg-success' : 'bg-primary'} text-capitalize`}>
                                {trn.status === 'completed' ? 'Completed' : `${pct}% Done`}
                              </span>
                            </div>
                            <h6 className="fw-bold text-dark mb-1">{trn.title}</h6>
                            <p className="text-muted small mb-2" style={{ lineHeight: 1.4 }}>{trn.description}</p>
                          </div>

                          <div>
                            <div className="d-flex justify-content-between small text-muted mb-1">
                              <span>Modules: {trn.completedModules} / {trn.totalModules}</span>
                              <span>Duration: {trn.duration}</span>
                            </div>
                            <div className="progress mb-3" style={{ height: 8 }}>
                              <div
                                className={`progress-bar ${trn.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                              <span className="small text-muted">
                                <i className="bi bi-person me-1" /> {trn.instructor}
                              </span>
                              {trn.status === 'completed' ? (
                                <button
                                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                                  onClick={() => setShowCertModal(trn)}
                                >
                                  <i className="bi bi-award" /> Certificate
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                  onClick={() => handleCompleteModule(trn.id)}
                                >
                                  <i className="bi bi-play-circle" /> Complete Module
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="alert alert-light border mt-4 small text-muted d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary fs-5" />
                <span>
                  Course completions in this portal record toward your annual HR development appraisal. Formal certification records sync with corporate training logs.
                </span>
              </div>
            </div>
          )}

          {/* ──── Tab 3: Announcements ──── */}
          {activeTab === 'announcements' && (
            <div>
              <div className="mb-3">
                <h6 className="fw-bold mb-0">Official Company Bulletins &amp; Notices</h6>
                <span className="text-muted small">Stay updated on enterprise directives, events, and HR updates</span>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-megaphone display-5 d-block mb-2 opacity-25" />
                  No active company announcements at this time.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {announcements.map((a) => (
                    <div key={a._id} className="p-3 rounded-3 border bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge bg-${priorityColors[a.priority] || 'secondary'} text-capitalize`}>
                            {a.priority}
                          </span>
                          <strong className="fs-6 text-dark">{a.title}</strong>
                        </div>
                        <span className="text-muted small">
                          <i className="bi bi-calendar-event me-1" />
                          {new Date(a.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="mb-2 text-secondary small" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {a.content}
                      </p>
                      <div className="small text-muted d-flex align-items-center gap-3">
                        <span>Target: <strong>{a.targetDepartment || 'All Departments'}</strong></span>
                        {a.author?.name && <span>Published by: <strong>{a.author.name}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──── Tab 4: Profile Details ──── */}
          {activeTab === 'profile' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">My Employee Records &amp; Directory Profile</h6>
                  <span className="text-muted small">Official job title, contact information, and skill tags</span>
                </div>
                <Link to="/profile" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  <i className="bi bi-pencil" /> Edit Personal Information
                </Link>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 bg-light h-100">
                    <h6 className="small fw-bold text-muted mb-3 border-bottom pb-2">Employment Information (Read-Only)</h6>
                    <div className="row g-2 small">
                      <div className="col-6 text-muted">Full Name:</div>
                      <div className="col-6 fw-bold text-dark">{user?.name}</div>

                      <div className="col-6 text-muted">Email Address:</div>
                      <div className="col-6 fw-bold text-dark">{user?.email}</div>

                      <div className="col-6 text-muted">System Role:</div>
                      <div className="col-6"><span className="badge bg-info text-dark text-uppercase">{user?.role}</span></div>

                      <div className="col-6 text-muted">Department:</div>
                      <div className="col-6 fw-bold text-dark">{profile?.department || 'General'}</div>

                      <div className="col-6 text-muted">Official Designation:</div>
                      <div className="col-6 fw-bold text-dark">{profile?.designation || 'Staff Member'}</div>

                      <div className="col-6 text-muted">Employee ID:</div>
                      <div className="col-6 fw-bold text-primary">{profile?.employeeId || 'SS-EMP-001'}</div>

                      <div className="col-6 text-muted">Reporting Manager:</div>
                      <div className="col-6 fw-bold text-dark">{profile?.reportingManager?.name || 'HR Administration'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 bg-light h-100">
                    <h6 className="small fw-bold text-muted mb-3 border-bottom pb-2">Personal &amp; Contact Details</h6>
                    <div className="row g-2 small">
                      <div className="col-6 text-muted">Phone Number:</div>
                      <div className="col-6 fw-semibold">{profile?.phone || 'Not specified'}</div>

                      <div className="col-6 text-muted">Emergency Contact:</div>
                      <div className="col-6 fw-semibold">{profile?.emergencyContact || 'Not specified'}</div>

                      <div className="col-6 text-muted">Residential Address:</div>
                      <div className="col-6 fw-semibold">{profile?.address || 'Not specified'}</div>

                      <div className="col-12 mt-2">
                        <span className="text-muted d-block mb-1">Registered Skills &amp; Proficiencies:</span>
                        {profile?.skills && profile.skills.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {profile.skills.map((s, idx) => (
                              <span key={idx} className="badge bg-white text-dark border">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">No skills tagged yet. Click Edit Profile to add skills.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Apply for Leave Modal ─── */}
      {showApplyModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus text-primary me-2" />
                  Apply for Time Off / Leave
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)} />
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-4">
                  {leaveError && <div className="alert alert-danger small py-2">{leaveError}</div>}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Leave Category</label>
                    <select
                      className="form-select form-select-sm"
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                      required
                    >
                      <option value="casual">Casual Leave ({balances.casual} days available)</option>
                      <option value="sick">Sick Leave ({balances.sick} days available)</option>
                      <option value="annual">Annual Leave ({balances.annual} days available)</option>
                      <option value="unpaid">Unpaid / Extraordinary Leave</option>
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
                    <label className="form-label small fw-semibold">Reason for Absence</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Please describe reason for leave (minimum 5 characters)..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3 fw-semibold" disabled={leaveLoading}>
                    {leaveLoading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Training Certificate Modal ─── */}
      {showCertModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: 16 }}>
              <div className="mb-3">
                <i className="bi bi-patch-check-fill text-success display-3" />
              </div>
              <h4 className="fw-bold text-dark mb-1">Certificate of Completion</h4>
              <p className="text-muted small mb-3">StaffSync Learning &amp; Development Program</p>
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="text-muted small">This acknowledges that</div>
                <h5 className="fw-bold text-primary my-1">{user?.name}</h5>
                <div className="text-muted small">has successfully completed all modules for</div>
                <strong className="d-block mt-1 text-dark">{showCertModal.title}</strong>
                <span className="badge bg-success-subtle text-success mt-2">Verified Professional Credential</span>
              </div>
              <button className="btn btn-primary btn-sm mx-auto px-4" onClick={() => setShowCertModal(null)}>
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}