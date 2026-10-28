import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_CONFIG = {
  employee: {
    title: 'StaffSync',
    subtitle: 'Self-Service Portal',
    badge: 'Employee',
    badgeClass: 'bg-info text-dark',
    sidebarBg: 'linear-gradient(180deg, #0b1329 0%, #172554 100%)',
    accentColor: '#3b82f6',
    activeBg: 'rgba(59, 130, 246, 0.25)',
    borderAccent: '#3b82f6',
    brandIconBg: '#2563eb',
    topPill: { text: 'Employee Self-Service', bg: 'bg-primary-subtle text-primary border border-primary-subtle' },
    sections: [
      {
        header: 'MY WORKSPACE',
        links: [
          { to: '/dashboard', icon: 'bi-speedometer2', label: 'My Dashboard' },
          { to: '/attendance', icon: 'bi-clock-history', label: 'Attendance & Clock-In' },
          { to: '/leaves', icon: 'bi-calendar2-check', label: 'Leave Requests' }
        ]
      },
      {
        header: 'COMPANY & RECORD',
        links: [
          { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' },
          { to: '/announcements', icon: 'bi-megaphone', label: 'Announcements' }
        ]
      }
    ]
  },
  manager: {
    title: 'StaffSync',
    subtitle: 'Operations & Team Hub',
    badge: 'Team Lead',
    badgeClass: 'bg-emerald text-white',
    sidebarBg: 'linear-gradient(180deg, #042f2e 0%, #064e3b 100%)',
    accentColor: '#10b981',
    activeBg: 'rgba(16, 185, 129, 0.25)',
    borderAccent: '#10b981',
    brandIconBg: '#059669',
    topPill: { text: 'Manager Operations Hub', bg: 'bg-success-subtle text-success border border-success-subtle' },
    sections: [
      {
        header: 'TEAM MANAGEMENT',
        links: [
          { to: '/manager', icon: 'bi-speedometer2', label: 'Manager Dashboard' },
          { to: '/manager/team', icon: 'bi-people', label: 'Direct Reports' },
          { to: '/manager/attendance', icon: 'bi-clock-history', label: 'Team Attendance' },
          { to: '/manager/leaves', icon: 'bi-calendar2-check', label: 'Leave Approvals' }
        ]
      },
      {
        header: 'MY SELF-SERVICE',
        links: [
          { to: '/attendance', icon: 'bi-person-check', label: 'My Attendance' },
          { to: '/leaves', icon: 'bi-calendar-event', label: 'My Leaves' },
          { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' },
          { to: '/announcements', icon: 'bi-megaphone', label: 'Announcements' }
        ]
      }
    ]
  },
  hr: {
    title: 'StaffSync',
    subtitle: 'Enterprise HR Suite',
    badge: 'HR Administrator',
    badgeClass: 'bg-danger text-white',
    sidebarBg: 'linear-gradient(180deg, #240b36 0%, #1e1b4b 100%)',
    accentColor: '#a855f7',
    activeBg: 'rgba(168, 85, 247, 0.25)',
    borderAccent: '#a855f7',
    brandIconBg: '#7c3aed',
    topPill: { text: 'HR Enterprise Control', bg: 'bg-purple-subtle text-purple border border-purple-subtle' },
    sections: [
      {
        header: 'WORKFORCE & PEOPLE',
        links: [
          { to: '/hr', icon: 'bi-speedometer2', label: 'HR Executive Dashboard' },
          { to: '/hr/employees', icon: 'bi-people-fill', label: 'Employee Directory' },
          { to: '/hr/employees/add', icon: 'bi-person-plus', label: 'Add New Employee' }
        ]
      },
      {
        header: 'OPERATIONS & POLICY',
        links: [
          { to: '/hr/attendance', icon: 'bi-clock-history', label: 'Attendance Report' },
          { to: '/hr/leaves', icon: 'bi-calendar2-check', label: 'Leave Governance' },
          { to: '/hr/announcements', icon: 'bi-megaphone-fill', label: 'Internal Broadcasts' }
        ]
      },
      {
        header: 'PERSONAL ACCESS',
        links: [
          { to: '/attendance', icon: 'bi-person-check', label: 'My Attendance' },
          { to: '/leaves', icon: 'bi-calendar-event', label: 'My Leaves' },
          { to: '/profile', icon: 'bi-person-circle', label: 'My Profile' }
        ]
      }
    ]
  }
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'employee';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.employee;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f4f6f9' }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`d-flex flex-column flex-shrink-0 position-fixed top-0 start-0 h-100 ${sidebarOpen ? '' : 'd-none d-lg-flex'}`}
        style={{
          width: '250px',
          background: roleConfig.sidebarBg,
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
          zIndex: 1045,
          overflowY: 'auto'
        }}
      >
        {/* Brand */}
        <div className="p-3 border-bottom border-white border-opacity-10 d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 shadow-sm"
              style={{ width: 38, height: 38, background: roleConfig.brandIconBg }}
            >
              <i className="bi bi-people-fill text-white fs-5" />
            </div>
            <div>
              <span className="fw-bold text-white fs-6 d-block lh-1">{roleConfig.title}</span>
              <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{roleConfig.subtitle}</span>
            </div>
          </Link>
          <button
            className="btn btn-sm text-white-50 d-lg-none p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-3 py-3 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{ width: 42, height: 42, background: roleConfig.brandIconBg, fontSize: 16, flexShrink: 0 }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-white fw-semibold text-truncate small">{user?.name}</div>
              <span className={`badge ${roleConfig.badgeClass} text-uppercase px-2 py-1 mt-1`} style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                {roleConfig.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-grow-1 py-3 px-2">
          {roleConfig.sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-3">
              <div
                className="text-white-50 fw-bold px-3 mb-1"
                style={{ fontSize: '0.65rem', letterSpacing: '1px' }}
              >
                {section.header}
              </div>
              {section.links.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2 mb-1"
                    style={{
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      background: active ? roleConfig.activeBg : 'transparent',
                      borderLeft: active ? `3px solid ${roleConfig.borderAccent}` : '3px solid transparent',
                      fontSize: '0.88rem',
                      fontWeight: active ? '600' : '400',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i
                      className={`bi ${link.icon} fs-6`}
                      style={{ color: active ? roleConfig.accentColor : 'rgba(255,255,255,0.6)' }}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-top border-white border-opacity-10">
          <button
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-2"
            style={{ color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 0, minWidth: 0 }}>
        {/* Top Navbar */}
        <nav
          className="navbar px-3 px-md-4 py-2 d-flex align-items-center justify-content-between sticky-top shadow-sm"
          style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', zIndex: 1030 }}
        >
          <div className="d-flex align-items-center gap-2">
            {/* Hamburger (mobile) */}
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list fs-5" />
            </button>
            {/* Desktop spacer matching sidebar */}
            <div className="d-none d-lg-block" style={{ width: 250 }} />
            <div className="d-flex align-items-center gap-2">
              <span className={`badge px-2 py-1 rounded-pill ${roleConfig.topPill.bg} small fw-semibold d-none d-sm-inline`}>
                <span className="spinner-grow spinner-grow-sm me-1 align-middle" style={{ width: 8, height: 8 }} role="status" />
                {roleConfig.topPill.text}
              </span>
              <span className="text-muted small d-none d-md-inline ms-2">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {role === 'hr' && (
              <Link to="/hr/employees/add" className="btn btn-sm btn-outline-primary d-none d-sm-flex align-items-center gap-1">
                <i className="bi bi-person-plus-fill" /> Add Staff
              </Link>
            )}
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ width: 32, height: 32, background: roleConfig.brandIconBg, fontSize: 13 }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-dark small fw-semibold d-none d-sm-inline">{user?.name}</span>
            </div>
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout} title="Sign Out">
              <i className="bi bi-box-arrow-right" />
              <span className="d-none d-sm-inline ms-1">Logout</span>
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow-1 p-3 p-md-4" style={{ marginLeft: 0 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Push content right on desktop */}
      <style>{`
        @media (min-width: 992px) {
          main { margin-left: 250px !important; }
          nav.navbar { padding-left: 0 !important; }
        }
        .bg-emerald {
          background-color: #059669 !important;
        }
        .text-purple {
          color: #7c3aed !important;
        }
        .bg-purple-subtle {
          background-color: #f3e8ff !important;
        }
        .border-purple-subtle {
          border-color: #d8b4fe !important;
        }
      `}</style>
    </div>
  );
}
