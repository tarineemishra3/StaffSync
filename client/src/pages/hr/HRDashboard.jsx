import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI, attendanceAPI, leaveAPI, announcementAPI } from '../../api/index.js';

export default function HRDashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    announcements: 0,
    managers: 0,
    active: 0,
    inactive: 0
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Quick announcement posting form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postPriority, setPostPriority] = useState('normal');
  const [postDept, setPostDept] = useState('All');
  const [postingLoading, setPostingLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertError, setAlertError] = useState(null);

  // Leave action state
  const [reviewingLeaveId, setReviewingLeaveId] = useState(null);

  const fetchHRData = () => {
    Promise.allSettled([
      employeeAPI.getAll({ limit: 50 }),
      attendanceAPI.getAll({ limit: 100 }),
      leaveAPI.getAll(),
      announcementAPI.getAll({ limit: 6 })
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
        newStats.employees = empRes.value.data.total || emps.length;
        setRecentEmployees(emps.slice(0, 6));

        // Compute counts
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
        const allLeaves = leaveRes.value.data.leaves || [];
        const pending = allLeaves.filter((l) => l.status === 'pending');
        newStats.pendingLeaves = pending.length;
        setPendingLeaves(pending.slice(0, 6));
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
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      setAlertMessage('Announcement removed.');
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const handleReviewLeave = async (leaveId, decision) => {
    const remarks = window.prompt(`Enter review remarks for ${decision.toUpperCase()}:`) || '';
    setReviewingLeaveId(leaveId);
    setAlertMessage(null);
    setAlertError(null);

    try {
      const res = await leaveAPI.review(leaveId, decision, remarks);
      setAlertMessage(res.data.message || `Leave request ${decision} successfully.`);
      fetchHRData();
    } catch (err) {
      setAlertError(err.response?.data?.message || `Failed to review leave`);
    } finally {
      setReviewingLeaveId(null);
    }
  };

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
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-shield-lock-fill text-danger me-2" />
            HR Administration Dashboard
          </h4>
          <p className="text-muted mb-0">
            Company-wide workforce oversight, permissions, attendance &amp; operations
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/hr/employees/add" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-person-plus" /> Add Employee
          </Link>
          <Link to="/hr/employees" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-people" /> Directory
          </Link>
          <Link to="/hr/leaves" className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-calendar2-check" /> Leaves ({stats.pendingLeaves})
          </Link>
        </div>
      </div>

      {alertMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{alertMessage}
          <button type="button" className="btn-close" onClick={() => setAlertMessage(null)} />
        </div>
      )}
      {alertError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{alertError}
          <button type="button" className="btn-close" onClick={() => setAlertError(null)} />
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <Link to="/hr/employees" className="text-decoration-none">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-people-fill fs-4" />
                </div>
                <div>
                  <div className="fs-3 fw-bold text-dark">{loading ? '…' : stats.employees}</div>
                  <div className="small text-muted">Total Headcount</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-6 col-lg-3">
          <Link to="/hr/attendance" className="text-decoration-none">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-success-subtle text-success" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-clock-history fs-4" />
                </div>
                <div>
                  <div className="fs-3 fw-bold text-dark">{loading ? '…' : stats.presentToday}</div>
                  <div className="small text-muted">Present Today</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-6 col-lg-3">
          <Link to="/hr/leaves" className="text-decoration-none">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-warning-subtle text-warning" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-calendar2-x fs-4" />
                </div>
                <div>
                  <div className="fs-3 fw-bold text-dark">{loading ? '…' : stats.pendingLeaves}</div>
                  <div className="small text-muted">Pending Leaves</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-6 col-lg-3">
          <Link to="/hr/announcements" className="text-decoration-none">
            <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3 bg-info-subtle text-info" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-megaphone-fill fs-4" />
                </div>
                <div>
                  <div className="fs-3 fw-bold text-dark">{loading ? '…' : stats.announcements}</div>
                  <div className="small text-muted">Announcements</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Row: Employee Management & Leave Review */}
      <div className="row g-4 mb-4">
        {/* 1. Employee & Manager Roster */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-person-lines-fill me-2 text-primary" />
                Workforce Management Overview
              </h6>
              <div className="d-flex gap-2">
                <Link to="/hr/employees/add" className="btn btn-sm btn-primary">
                  <i className="bi bi-plus-lg me-1" /> Add
                </Link>
                <Link to="/hr/employees" className="btn btn-sm btn-outline-secondary">
                  Directory
                </Link>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmployees.length > 0 ? (
                      recentEmployees.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <div className="fw-semibold">{emp.user?.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{emp.user?.email}</div>
                          </td>
                          <td>
                            <span className={`badge ${
                              emp.user?.role === 'hr'
                                ? 'bg-danger'
                                : emp.user?.role === 'manager'
                                ? 'bg-warning text-dark'
                                : 'bg-info text-dark'
                            } text-uppercase`}>
                              {emp.user?.role}
                            </span>
                          </td>
                          <td>{emp.department || 'General'}</td>
                          <td>
                            <span className={`badge bg-${emp.user?.status === 'active' ? 'success' : 'secondary'}`}>
                              {emp.user?.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/hr/employees/edit/${emp.user?._id || emp._id}`} className="btn btn-sm btn-outline-secondary py-0 px-2">
                              <i className="bi bi-pencil" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">No employees loaded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Organization-Wide Leave Approvals */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-calendar2-check me-2 text-warning" />
                Pending Leave Reviews
              </h6>
              <Link to="/hr/leaves" className="btn btn-sm btn-outline-warning">Manage All</Link>
            </div>
            <div className="card-body p-0">
              {pendingLeaves.length === 0 ? (
                <div className="text-center text-muted py-5 small">
                  <i className="bi bi-check2-all display-6 d-block mb-2 text-success opacity-50" />
                  No pending leaves awaiting HR approval.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Applicant</th>
                        <th>Type / Days</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((l) => (
                        <tr key={l._id}>
                          <td>
                            <div className="fw-semibold">{l.user?.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.reason}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize me-1">{l.leaveType}</span>
                            <span className="fw-bold">{l.totalDays}d</span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success py-0 px-2"
                                onClick={() => handleReviewLeave(l._id, 'approved')}
                                disabled={reviewingLeaveId === l._id}
                                title="Approve"
                              >
                                <i className="bi bi-check" />
                              </button>
                              <button
                                className="btn btn-danger py-0 px-2"
                                onClick={() => handleReviewLeave(l._id, 'rejected')}
                                disabled={reviewingLeaveId === l._id}
                                title="Reject"
                              >
                                <i className="bi bi-x" />
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
      </div>

      {/* Row: Post Announcement & Analytics Reports */}
      <div className="row g-4">
        {/* 3. Post Announcements Form & Active List */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-megaphone me-2 text-primary" />
                Post &amp; Broadcast Announcement
              </h6>
              <Link to="/hr/announcements" className="btn btn-sm btn-outline-primary">Manage</Link>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handlePostAnnouncement} className="mb-4">
                <div className="row g-2 mb-2">
                  <div className="col-12 col-md-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Announcement Title..."
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={postPriority}
                      onChange={(e) => setPostPriority(e.target.value)}
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Target Dept (All)"
                      value={postDept}
                      onChange={(e) => setPostDept(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="Announcement message or policy update..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary px-3 fw-semibold"
                  disabled={postingLoading}
                >
                  <i className="bi bi-broadcast me-1" />
                  {postingLoading ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>

              {/* Published Announcements Preview */}
              <div className="border-top pt-3">
                <h6 className="small fw-bold text-muted mb-3">Recently Broadcasted</h6>
                {announcements.length === 0 ? (
                  <div className="text-muted small">No announcements posted yet.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {announcements.slice(0, 3).map((a) => (
                      <div key={a._id} className="p-2 bg-light rounded d-flex justify-content-between align-items-center small">
                        <div>
                          <span className={`badge bg-${priorityBadge[a.priority] || 'secondary'} me-2 text-capitalize`}>
                            {a.priority}
                          </span>
                          <strong className="text-dark">{a.title}</strong>
                          <span className="text-muted ms-2">({a.targetDepartment || 'All'})</span>
                        </div>
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => handleDeleteAnnouncement(a._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Analytics & Workforce Reports */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-pie-chart-fill me-2 text-success" />
                Workforce Analytics &amp; Reports
              </h6>
              <Link to="/hr/attendance" className="btn btn-sm btn-outline-success">Export</Link>
            </div>
            <div className="card-body p-4">
              {/* Attendance Completion Rate */}
              <div className="mb-4">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Organization Attendance Rate</span>
                  <span className="fw-bold">{attendanceRate}%</span>
                </div>
                <div className="progress" style={{ height: 10 }}>
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

              {/* Department Distribution */}
              <div className="mb-3">
                <h6 className="small fw-bold text-muted mb-2">Department Headcount Distribution</h6>
                {Object.keys(departmentCounts).length === 0 ? (
                  <div className="text-muted small">No department breakdown available.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {Object.entries(departmentCounts).map(([dept, count]) => {
                      const pct = stats.employees > 0 ? Math.round((count / stats.employees) * 100) : 0;
                      return (
                        <div key={dept} className="small">
                          <div className="d-flex justify-content-between text-muted mb-1">
                            <span>{dept}</span>
                            <span className="fw-semibold">{count} ({pct}%)</span>
                          </div>
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${pct}%` }}
                              aria-valuenow={pct}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-3 bg-light rounded small mt-4">
                <div className="d-flex align-items-center gap-1 text-muted mb-1">
                  <i className="bi bi-file-earmark-bar-graph text-primary" />
                  <strong>Reporting &amp; Export Capability</strong>
                </div>
                <p className="text-muted mb-0 small" style={{ lineHeight: 1.4 }}>
                  Filtered attendance logs, employee roster summaries, and leave history can be audited in the Attendance Report and Directory views.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
