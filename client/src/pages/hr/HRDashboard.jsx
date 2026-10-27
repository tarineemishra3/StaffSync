import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI, attendanceAPI, leaveAPI, announcementAPI } from '../../api/index.js';

export default function HRDashboard() {
  const [stats, setStats] = useState({ employees: 0, presentToday: 0, pendingLeaves: 0, announcements: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      employeeAPI.getAll({ limit: 5 }),
      attendanceAPI.getAll({ limit: 1 }),
      leaveAPI.getAll(),
      announcementAPI.getAll({ limit: 1 })
    ]).then(([empRes, attRes, leaveRes, annRes]) => {
      const newStats = { employees: 0, presentToday: 0, pendingLeaves: 0, announcements: 0 };
      if (empRes.status === 'fulfilled') {
        newStats.employees = empRes.value.data.total || 0;
        setRecentEmployees(empRes.value.data.employees || []);
      }
      if (attRes.status === 'fulfilled') newStats.presentToday = attRes.value.data.total || 0;
      if (leaveRes.status === 'fulfilled') {
        const all = leaveRes.value.data.leaves || [];
        const pending = all.filter(l => l.status === 'pending');
        newStats.pendingLeaves = pending.length;
        setPendingLeaves(pending.slice(0, 5));
      }
      if (annRes.status === 'fulfilled') newStats.announcements = annRes.value.data.total || 0;
      setStats(newStats);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: 'bi-people-fill', label: 'Total Employees', value: stats.employees, color: '#2563eb', bg: '#dbeafe', link: '/hr/employees' },
    { icon: 'bi-clock-fill', label: 'Attendance Records', value: stats.presentToday, color: '#16a34a', bg: '#dcfce7', link: '/hr/attendance' },
    { icon: 'bi-calendar2-x', label: 'Pending Leaves', value: stats.pendingLeaves, color: '#d97706', bg: '#fef3c7', link: '/hr/leaves' },
    { icon: 'bi-megaphone-fill', label: 'Announcements', value: stats.announcements, color: '#7c3aed', bg: '#ede9fe', link: '/hr/announcements' }
  ];

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">HR Dashboard</h4>
        <p className="text-muted mb-0">Organization overview and management hub</p>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <Link to={s.link} className="text-decoration-none">
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderRadius: 12, transition: 'transform 0.15s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = ''}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3"
                    style={{ width: 48, height: 48, background: s.bg }}>
                    <i className={`bi ${s.icon} fs-5`} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div className="fs-3 fw-bold" style={{ color: s.color }}>{loading ? '…' : s.value}</div>
                    <div className="small text-muted">{s.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Quick actions */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-lightning-charge me-2 text-warning" />Quick Actions</h6>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-2">
              <Link to="/hr/employees/add" className="btn btn-primary d-flex align-items-center gap-2">
                <i className="bi bi-person-plus" />Add New Employee
              </Link>
              <Link to="/hr/employees" className="btn btn-outline-primary d-flex align-items-center gap-2">
                <i className="bi bi-people" />Employee Directory
              </Link>
              <Link to="/hr/leaves" className="btn btn-outline-warning d-flex align-items-center gap-2">
                <i className="bi bi-calendar2-check" />Leave Management
                {stats.pendingLeaves > 0 && <span className="badge bg-danger ms-auto">{stats.pendingLeaves}</span>}
              </Link>
              <Link to="/hr/announcements" className="btn btn-outline-info d-flex align-items-center gap-2">
                <i className="bi bi-megaphone" />Manage Announcements
              </Link>
              <Link to="/hr/attendance" className="btn btn-outline-success d-flex align-items-center gap-2">
                <i className="bi bi-clock-history" />Attendance Report
              </Link>
            </div>
          </div>
        </div>

        {/* Recent employees */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="bi bi-people me-2 text-primary" />Recent Employees</h6>
              <Link to="/hr/employees" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr><th>Name</th><th>Role</th><th>Department</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentEmployees.length > 0 ? recentEmployees.map(emp => (
                      <tr key={emp._id}>
                        <td>
                          <div className="fw-semibold">{emp.user?.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{emp.user?.email}</div>
                        </td>
                        <td><span className="badge bg-light text-dark border text-capitalize">{emp.user?.role}</span></td>
                        <td>{emp.department}</td>
                        <td>
                          <span className={`badge bg-${emp.user?.status === 'active' ? 'success' : 'secondary'}`}>
                            {emp.user?.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center text-muted py-3">No employees found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
