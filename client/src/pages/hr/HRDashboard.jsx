import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI, attendanceAPI, leaveAPI, announcementAPI } from '../../api/index.js';

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    employees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    announcements: 0,
    managers: 0,
    active: 0,
    inactive: 0
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Active HR Tab
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'leaves', 'broadcast', 'analytics', 'curriculum'

  // Directory search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Broadcast announcement form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postPriority, setPostPriority] = useState('normal');
  const [postDept, setPostDept] = useState('All');
  const [postingLoading, setPostingLoading] = useState(false);

  // Leave review modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewDecision, setReviewDecision] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Status toggle state
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // Alerts
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertError, setAlertError] = useState(null);

  const fetchHRData = () => {
    Promise.allSettled([
      employeeAPI.getAll({ limit: 100 }),
      attendanceAPI.getAll({ limit: 100 }),
      leaveAPI.getAll(),
      announcementAPI.getAll({ limit: 15 })
    ]).then(([empRes, attRes, leaveRes, annRes]) => {
      const newStats = {
        employees: 0,
        presentToday: 0,
        pendingLeaves: 0,
        announcements: 0,
        managers: 0,
        active: 0,
        inactive: 0
      };

      if (empRes.status === 'fulfilled') {
        const emps = empRes.value.data.employees || [];
        setEmployees(emps);
        newStats.employees = empRes.value.data.total || emps.length;

        let mgrCount = 0;
        let actCount = 0;
        let inactCount = 0;
        const depts = {};

        emps.forEach((e) => {
          if (e.user?.role === 'manager') mgrCount++;
          if (e.user?.status === 'active') actCount++;
          if (e.user?.status === 'inactive') inactCount++;
          const dept = e.department || 'General';
          depts[dept] = (depts[dept] || 0) + 1;
        });

        newStats.managers = mgrCount;
        newStats.active = actCount;
        newStats.inactive = inactCount;
        setDepartmentCounts(depts);
      }

      if (attRes.status === 'fulfilled') {
        newStats.presentToday = attRes.value.data.total || (attRes.value.data.records || []).length;
      }

      if (leaveRes.status === 'fulfilled') {
        const leaves = leaveRes.value.data.leaves || [];
        setAllLeaves(leaves);
        const pending = leaves.filter((l) => l.status === 'pending');
        newStats.pendingLeaves = pending.length;
        setPendingLeaves(pending);
      }

      if (annRes.status === 'fulfilled') {
        const anns = annRes.value.data.announcements || [];
        newStats.announcements = annRes.value.data.total || anns.length;
        setAnnouncements(anns);
      }

      setStats(newStats);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      setAlertError('Please enter both title and content.');
      return;
    }

    setPostingLoading(true);
    setAlertMessage(null);
    setAlertError(null);

    try {
      const res = await announcementAPI.create({
        title: postTitle.trim(),
        content: postContent.trim(),
        priority: postPriority,
        targetDepartment: postDept
      });
      setAlertMessage(res.data.message || 'Announcement broadcasted successfully!');
      setPostTitle('');
      setPostContent('');
      setPostPriority('normal');
      setPostDept('All');
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setPostingLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company bulletin?')) return;
    try {
      await announcementAPI.delete(id);
      setAlertMessage('Announcement deleted successfully.');
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const openReviewModal = (leave, decision) => {
    setSelectedLeave(leave);
    setReviewDecision(decision);
    setReviewRemarks(decision === 'approved' ? 'Approved by HR Administration.' : 'Declined per HR policy.');
  };

  const handleConfirmReview = async (e) => {
    e.preventDefault();
    if (!selectedLeave || !reviewDecision) return;

    setReviewLoading(true);
    setAlertMessage(null);
    setAlertError(null);

    try {
      const res = await leaveAPI.review(selectedLeave._id, reviewDecision, reviewRemarks.trim());
      setAlertMessage(res.data.message || `Leave request ${reviewDecision} successfully.`);
      setSelectedLeave(null);
      setReviewDecision(null);
      setReviewRemarks('');
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Failed to review leave.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.user?.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to change ${emp.user?.name}'s account status to ${newStatus.toUpperCase()}?`)) return;

    setStatusLoadingId(emp._id);
    try {
      await employeeAPI.updateStatus(emp._id, newStatus);
      setAlertMessage(`Employee status successfully set to ${newStatus}.`);
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Failed to update employee status.');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = emp.user?.name?.toLowerCase().includes(q) || false;
    const emailMatch = emp.user?.email?.toLowerCase().includes(q) || false;
    const deptMatch = emp.department?.toLowerCase().includes(q) || false;
    const desigMatch = emp.designation?.toLowerCase().includes(q) || false;
    const queryPass = !q || nameMatch || emailMatch || deptMatch || desigMatch;

    const rolePass = roleFilter === 'all' || emp.user?.role === roleFilter;
    const statusPass = statusFilter === 'all' || emp.user?.status === statusFilter;

    return queryPass && rolePass && statusPass;
  });

  const priorityBadge = {
    urgent: 'danger',
    high: 'warning text-dark',
    normal: 'primary',
    low: 'secondary'
  };

  const attendanceRate = stats.employees > 0
    ? Math.min(100, Math.round((stats.presentToday / stats.employees) * 100))
    : 0;

  return (
    <div>
      {/* ─── Executive HR Administration Banner ─── */}
      <div
        className="card border-0 text-white shadow-sm mb-4"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%)',
          borderRadius: '16px'
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-purple bg-white shadow fw-bold fs-3"
              style={{ width: 62, height: 62, color: '#7c3aed' }}
            >
              <i className="bi bi-shield-lock-fill" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0 text-white">Enterprise HR Administration Suite</h4>
                <span className="badge bg-purple text-white fw-semibold px-2 py-1" style={{ backgroundColor: '#9333ea' }}>
                  Global Governance
                </span>
              </div>
              <p className="mb-0 text-white-50 small mt-1">
                Company-wide workforce oversight · Total Staff: <strong>{stats.employees}</strong> · Active: <strong>{stats.active}</strong> · Presence: <strong>{stats.presentToday} checked in</strong>
              </p>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Link to="/hr/employees/add" className="btn btn-light btn-sm fw-semibold text-purple d-flex align-items-center gap-1 shadow-sm">
              <i className="bi bi-person-plus-fill" /> Add New Staff
            </Link>
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={() => setActiveTab('broadcast')}
            >
              <i className="bi bi-broadcast" /> Broadcast Notice
            </button>
            <Link to="/hr/attendance" className="btn btn-outline-light btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-file-earmark-bar-graph" /> Attendance Report
            </Link>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {alertMessage && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{alertMessage}
          <button type="button" className="btn-close" onClick={() => setAlertMessage(null)} />
        </div>
      )}
      {alertError && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{alertError}
          <button type="button" className="btn-close" onClick={() => setAlertError(null)} />
        </div>
      )}

      {/* ─── Executive KPI Ribbon ─── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12, borderLeft: '4px solid #7c3aed' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="small text-muted d-block">Total Workforce</span>
                <span className="fs-2 fw-bold text-dark">{loading ? '…' : stats.employees}</span>
                <span className="small text-muted d-block">{stats.active} active · {stats.inactive} inactive</span>
              </div>
              <div className="p-3 bg-purple-subtle text-purple rounded-circle">
                <i className="bi bi-people-fill fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12, borderLeft: '4px solid #16a34a' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="small text-muted d-block">Present Today</span>
                <span className="fs-2 fw-bold text-success">{loading ? '…' : stats.presentToday}</span>
                <span className="small text-muted d-block">{attendanceRate}% organization rate</span>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-circle">
                <i className="bi bi-clock-history fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12, borderLeft: '4px solid #d97706' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="small text-muted d-block">Pending Leaves</span>
                <span className="fs-2 fw-bold text-warning-emphasis">{loading ? '…' : stats.pendingLeaves}</span>
                <span className="small text-muted d-block">company-wide queue</span>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-circle">
                <i className="bi bi-calendar2-x fs-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12, borderLeft: '4px solid #0284c7' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="small text-muted d-block">Managers &amp; Leads</span>
                <span className="fs-2 fw-bold text-primary">{loading ? '…' : stats.managers}</span>
                <span className="small text-muted d-block">department leaders</span>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-circle">
                <i className="bi bi-briefcase-fill fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── HR Administration Multi-Domain Console ─── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs card-header-tabs mx-3 mt-2 border-bottom-0">
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'directory' ? 'active text-purple border-bottom border-purple border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('directory')}
              >
                <i className="bi bi-people-fill" />
                Workforce Directory ({employees.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'leaves' ? 'active text-purple border-bottom border-purple border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('leaves')}
              >
                <i className="bi bi-calendar2-check-fill" />
                Global Leave Oversight ({stats.pendingLeaves})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'broadcast' ? 'active text-purple border-bottom border-purple border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('broadcast')}
              >
                <i className="bi bi-broadcast" />
                Broadcast Announcements ({announcements.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'analytics' ? 'active text-purple border-bottom border-purple border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('analytics')}
              >
                <i className="bi bi-pie-chart-fill" />
                Workforce Analytics &amp; Reports
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-3 px-3 d-flex align-items-center gap-2 fw-semibold ${activeTab === 'curriculum' ? 'active text-purple border-bottom border-purple border-3' : 'text-muted'}`}
                onClick={() => setActiveTab('curriculum')}
              >
                <i className="bi bi-mortarboard-fill" />
                Corporate Training Architecture
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* ──── Tab 1: Workforce Directory ──── */}
          {activeTab === 'directory' && (
            <div>
              {/* Search & Filter Bar */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-5">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-search text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm border-start-0"
                      placeholder="Search by name, email, department or designation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles (Any)</option>
                    <option value="employee">Employees Only</option>
                    <option value="manager">Managers Only</option>
                    <option value="hr">HR Administrators Only</option>
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <div className="col-12 col-md-2 text-end">
                  <Link to="/hr/employees/add" className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1">
                    <i className="bi bi-plus-lg" /> Add Employee
                  </Link>
                </div>
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-person-x display-5 d-block mb-2 opacity-25" />
                  No workforce members match your search or filter.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Role Badge</th>
                        <th>Department &amp; Title</th>
                        <th>Reporting Lead</th>
                        <th>Status</th>
                        <th className="text-end">Manage Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                style={{ width: 34, height: 34, background: '#7c3aed', fontSize: 13 }}
                              >
                                {emp.user?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <strong className="text-dark d-block">{emp.user?.name}</strong>
                                <span className="text-muted" style={{ fontSize: '0.72rem' }}>{emp.user?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              emp.user?.role === 'hr'
                                ? 'bg-danger'
                                : emp.user?.role === 'manager'
                                ? 'bg-emerald text-white'
                                : 'bg-info text-dark'
                            } text-uppercase px-2 py-1`}>
                              {emp.user?.role}
                            </span>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{emp.designation || 'Staff'}</div>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{emp.department || 'General'}</span>
                          </td>
                          <td className="text-muted small">
                            {emp.reportingManager?.name || 'HR Admin'}
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm py-0 px-2 badge ${
                                emp.user?.status === 'active' ? 'bg-success' : 'bg-secondary'
                              } border-0`}
                              onClick={() => handleToggleStatus(emp)}
                              disabled={statusLoadingId === emp._id}
                              title="Click to toggle active/inactive"
                            >
                              {statusLoadingId === emp._id ? 'Updating...' : emp.user?.status}
                            </button>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <Link
                                to={`/hr/employees/edit/${emp.user?._id || emp._id}`}
                                className="btn btn-outline-secondary py-0 px-2"
                                title="Edit Employee Profile"
                              >
                                <i className="bi bi-pencil me-1" /> Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ──── Tab 2: Global Leave Oversight ──── */}
          {activeTab === 'leaves' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Company-Wide Leave Queue &amp; Executive Decisions</h6>
                  <span className="text-muted small">Review all pending and processed employee time-off requests</span>
                </div>
                <Link to="/hr/leaves" className="btn btn-sm btn-outline-purple">
                  Open Leave Desk
                </Link>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-check2-circle display-4 d-block mb-3 text-success opacity-50" />
                  <h6 className="fw-bold text-dark">No Pending Company Leaves</h6>
                  <p className="small mb-0">All leave requests across all departments are reviewed and closed.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Applicant</th>
                        <th>Category</th>
                        <th>Date Duration</th>
                        <th>Reason Given</th>
                        <th>Status</th>
                        <th className="text-end">HR Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((l) => (
                        <tr key={l._id}>
                          <td>
                            <strong className="text-dark d-block">{l.user?.name}</strong>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{l.user?.email}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize px-2 py-1">
                              {l.leaveType}
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold">
                              {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                            </div>
                            <span className="text-muted small">{l.totalDays} day(s)</span>
                          </td>
                          <td style={{ maxWidth: 240 }} className="text-truncate" title={l.reason}>
                            {l.reason}
                          </td>
                          <td>
                            <span className="badge bg-warning text-dark px-2 py-1">
                              Pending Review
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success py-1 px-2 d-flex align-items-center gap-1"
                                onClick={() => openReviewModal(l, 'approved')}
                              >
                                <i className="bi bi-check-lg" /> Approve
                              </button>
                              <button
                                className="btn btn-danger py-1 px-2 d-flex align-items-center gap-1"
                                onClick={() => openReviewModal(l, 'rejected')}
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
          )}

          {/* ──── Tab 3: Broadcast Communications ──── */}
          {activeTab === 'broadcast' && (
            <div>
              <div className="row g-4">
                {/* Publish Form */}
                <div className="col-12 col-lg-5">
                  <div className="p-3 border rounded-3 bg-light">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="bi bi-megaphone me-2 text-purple" />
                      Post Official Company Notice
                    </h6>
                    <form onSubmit={handlePostAnnouncement}>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Title</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Annual Company Offsite 2026..."
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Priority</label>
                          <select
                            className="form-select form-select-sm"
                            value={postPriority}
                            onChange={(e) => setPostPriority(e.target.value)}
                          >
                            <option value="low">Low Priority</option>
                            <option value="normal">Normal</option>
                            <option value="high">High Alert</option>
                            <option value="urgent">Urgent Broadcast</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Target Audience</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="All Departments"
                            value={postDept}
                            onChange={(e) => setPostDept(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Notice Body</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="4"
                          placeholder="Write the full announcement directive or company communication..."
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-sm w-100 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-1"
                        disabled={postingLoading}
                      >
                        <i className="bi bi-send-fill" />
                        {postingLoading ? 'Publishing Notice...' : 'Publish Official Bulletin'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Published List */}
                <div className="col-12 col-lg-7">
                  <h6 className="fw-bold text-dark mb-3">Active Organization Bulletins</h6>
                  {announcements.length === 0 ? (
                    <div className="text-center text-muted py-5 border rounded-3">
                      No active bulletins posted yet.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                      {announcements.map((a) => (
                        <div key={a._id} className="p-3 border rounded-3 bg-white shadow-sm">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge bg-${priorityBadge[a.priority] || 'secondary'} text-capitalize`}>
                                {a.priority}
                              </span>
                              <strong className="text-dark">{a.title}</strong>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              onClick={() => handleDeleteAnnouncement(a._id)}
                              title="Delete Announcement"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                          <p className="text-muted small mb-2" style={{ lineHeight: 1.4 }}>{a.content}</p>
                          <div className="small text-muted d-flex justify-content-between">
                            <span>Audience: <strong>{a.targetDepartment || 'All'}</strong></span>
                            <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──── Tab 4: Analytics & Reports ──── */}
          {activeTab === 'analytics' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Workforce Distribution &amp; Governance Reports</h6>
                  <span className="text-muted small">Aggregated personnel analytics across all enterprise units</span>
                </div>
                <Link to="/hr/attendance" className="btn btn-sm btn-outline-success">
                  <i className="bi bi-file-earmark-spreadsheet me-1" /> Export Attendance Logs
                </Link>
              </div>

              <div className="row g-4">
                <div className="col-12 col-md-6">
                  <div className="p-4 border rounded-3 bg-light h-100">
                    <h6 className="fw-bold text-dark mb-3">Department Headcount Distribution</h6>
                    {Object.keys(departmentCounts).length === 0 ? (
                      <div className="text-muted small">No department data available.</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {Object.entries(departmentCounts).map(([dept, count]) => {
                          const pct = stats.employees > 0 ? Math.round((count / stats.employees) * 100) : 0;
                          return (
                            <div key={dept}>
                              <div className="d-flex justify-content-between small text-dark mb-1">
                                <span className="fw-semibold">{dept}</span>
                                <span>{count} staff ({pct}%)</span>
                              </div>
                              <div className="progress" style={{ height: 8 }}>
                                <div
                                  className="progress-bar"
                                  style={{ width: `${pct}%`, backgroundColor: '#7c3aed' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-4 border rounded-3 bg-light h-100 d-flex flex-column justify-content-around">
                    <div>
                      <h6 className="fw-bold text-dark mb-2">Organization Shift Attendance Compliance</h6>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fs-2 fw-bold text-success">{attendanceRate}%</span>
                        <span className="text-muted small">{stats.presentToday} of {stats.employees} present today</span>
                      </div>
                      <div className="progress mb-3" style={{ height: 10 }}>
                        <div className="progress-bar bg-success" style={{ width: `${attendanceRate}%` }} />
                      </div>
                    </div>

                    <div className="border-top pt-3">
                      <h6 className="fw-bold text-dark mb-2">Leadership Ratio</h6>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>Managers / Team Leads:</span>
                        <strong className="text-dark">{stats.managers}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted small mt-1">
                        <span>Individual Contributors:</span>
                        <strong className="text-dark">{Math.max(0, stats.employees - stats.managers)}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted small mt-1">
                        <span>Manager-to-Staff Ratio:</span>
                        <strong className="text-primary">
                          {stats.managers > 0 ? `1 : ${Math.round((stats.employees - stats.managers) / stats.managers)}` : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── Tab 5: Corporate Training Curriculum ──── */}
          {activeTab === 'curriculum' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Corporate Training Curriculum &amp; Compliance Tracks</h6>
                  <span className="text-muted small">Enterprise skill tracks assigned across departments</span>
                </div>
                <span className="badge bg-purple text-white px-3 py-1" style={{ backgroundColor: '#7c3aed' }}>
                  Enterprise Compliance Framework
                </span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="card border p-3 h-100 shadow-sm" style={{ borderRadius: 12 }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-danger-subtle text-danger">Mandatory Annual</span>
                      <span className="badge bg-success">Active Track</span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Corporate Data Security 2026</h6>
                    <p className="small text-muted mb-2">Mandatory IT &amp; Data Security training for all onboarded personnel.</p>
                    <div className="small text-muted mt-auto pt-2 border-top">
                      Target Audience: <strong>All Staff</strong> · Completion: <strong>75%</strong>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="card border p-3 h-100 shadow-sm" style={{ borderRadius: 12 }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-warning-subtle text-warning-emphasis">HR Governance</span>
                      <span className="badge bg-success">Active Track</span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Workplace Ethics &amp; Conduct</h6>
                    <p className="small text-muted mb-2">Professional standards, anti-harassment regulations, and DEI policies.</p>
                    <div className="small text-muted mt-auto pt-2 border-top">
                      Target Audience: <strong>All Staff</strong> · Completion: <strong>92%</strong>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="card border p-3 h-100 shadow-sm" style={{ borderRadius: 12 }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-info-subtle text-info">Leadership</span>
                      <span className="badge bg-primary">Elective Track</span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Manager Leadership Development</h6>
                    <p className="small text-muted mb-2">Performance review calibration, empathy coaching, and team sprint velocity.</p>
                    <div className="small text-muted mt-auto pt-2 border-top">
                      Target Audience: <strong>Managers Only</strong> · Completion: <strong>60%</strong>
                    </div>
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
                    <span className="text-success"><i className="bi bi-check-circle me-2" />HR Leave Approval</span>
                  ) : (
                    <span className="text-danger"><i className="bi bi-x-circle me-2" />HR Leave Rejection</span>
                  )}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLeave(null)} />
              </div>
              <form onSubmit={handleConfirmReview}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <div><strong>Employee:</strong> {selectedLeave.user?.name} ({selectedLeave.user?.email})</div>
                    <div><strong>Leave Type:</strong> <span className="text-capitalize">{selectedLeave.leaveType}</span></div>
                    <div><strong>Dates:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()} ({selectedLeave.totalDays} days)</div>
                    <div><strong>Employee Reason:</strong> <em>"{selectedLeave.reason}"</em></div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">
                      HR Decision Note / Remarks {reviewDecision === 'rejected' && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Add administrative notes for the record..."
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
    </div>
  );
}