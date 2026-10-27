import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = {
  employee: [
    { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { to: '/attendance', icon: 'bi-clock-history', label: 'Attendance' },
    { to: '/leaves', icon: 'bi-calendar2-check', label: 'Leave Requests' },
    { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' },
    { to: '/announcements', icon: 'bi-megaphone', label: 'Announcements' }
  ],
  manager: [
    { to: '/manager', icon: 'bi-speedometer2', label: 'Dashboard' },
    { to: '/manager/team', icon: 'bi-people', label: 'My Team' },
    { to: '/manager/attendance', icon: 'bi-clock-history', label: 'Team Attendance' },
    { to: '/manager/leaves', icon: 'bi-calendar2-check', label: 'Leave Approvals' },
    { to: '/attendance', icon: 'bi-person-check', label: 'My Attendance' },
    { to: '/leaves', icon: 'bi-calendar-event', label: 'My Leaves' },
    { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' },
    { to: '/announcements', icon: 'bi-megaphone', label: 'Announcements' }
  ],
  hr: [
    { to: '/hr', icon: 'bi-speedometer2', label: 'HR Dashboard' },
    { to: '/hr/employees', icon: 'bi-people-fill', label: 'Employee Directory' },
    { to: '/hr/employees/add', icon: 'bi-person-plus', label: 'Add Employee' },
    { to: '/hr/attendance', icon: 'bi-clock-history', label: 'Attendance Report' },
    { to: '/hr/leaves', icon: 'bi-calendar2-check', label: 'Leave Management' },
    { to: '/hr/announcements', icon: 'bi-megaphone-fill', label: 'Announcements' },
    { to: '/attendance', icon: 'bi-person-check', label: 'My Attendance' },
    { to: '/leaves', icon: 'bi-calendar-event', label: 'My Leaves' },
    { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' }
  ]
};

const ROLE_BADGE = {
  employee: 'bg-info',
  manager: 'bg-warning text-dark',
  hr: 'bg-danger'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = NAV_LINKS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ background: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`d-flex flex-column flex-shrink-0 position-fixed top-0 start-0 h-100 ${sidebarOpen ? '' : 'd-none d-lg-flex'}`}
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b2e4b 100%)',
          zIndex: 1045,
          overflowY: 'auto'
        }}
      >
        {/* Brand */}
        <div className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded"
              style={{ width: 36, height: 36, background: '#2563eb' }}
            >
              <i className="bi bi-people-fill text-white" />
            </div>
            <span className="fw-bold text-white fs-6">StaffSync</span>
          </Link>
          <button
            className="btn btn-sm btn-outline-secondary d-lg-none text-white border-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* User card */}
        <div className="px-3 py-3 border-bottom border-secondary">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: 40, height: 40, background: '#2563eb', fontSize: 16, flexShrink: 0 }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-white fw-semibold text-truncate small">{user?.name}</div>
              <span className={`badge ${ROLE_BADGE[user?.role]} text-uppercase`} style={{ fontSize: '0.65rem' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none sidebar-link ${
                isActive(link.to) ? 'active' : ''
              }`}
              style={{
                color: isActive(link.to) ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive(link.to) ? 'rgba(37,99,235,0.4)' : 'transparent',
                borderLeft: isActive(link.to) ? '3px solid #2563eb' : '3px solid transparent',
                fontSize: '0.9rem'
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${link.icon}`} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-top border-secondary">
          <button
            className="btn btn-sm w-100 d-flex align-items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.65)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 0, minWidth: 0 }}>
        {/* Top Navbar */}
        <nav
          className="navbar px-3 py-2 d-flex align-items-center justify-content-between sticky-top shadow-sm"
          style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 1030 }}
        >
          <div className="d-flex align-items-center gap-2">
            {/* Hamburger (mobile) */}
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list fs-5" />
            </button>
            {/* On desktop, show spacer for sidebar */}
            <div className="d-none d-lg-block" style={{ width: 240 }} />
            <span className="text-muted small d-none d-md-inline">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-dark small fw-semibold d-none d-sm-inline">{user?.name}</span>
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-grow-1 p-3 p-md-4" style={{ marginLeft: 0 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Push content right on desktop */}
      <style>{`
        @media (min-width: 992px) {
          main { margin-left: 240px !important; }
          nav.navbar { padding-left: 0 !important; }
        }
        .sidebar-link:hover {
          background: rgba(37,99,235,0.2) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
