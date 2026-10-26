import React, { useState, useEffect } from 'react';
import AttendanceView from './components/AttendanceView';
import LeaveView from './components/LeaveView';

function App() {
  const [token, setToken] = useState(localStorage.getItem('staffsync_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('attendance'); // 'attendance' | 'leaves' | 'health'

  // Auth form states
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Health check state
  const [healthData, setHealthData] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Check health on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then((res) => res.json())
      .then((data) => setHealthData(data))
      .catch((err) => console.warn('Health check fetch failed:', err.message));
  }, [apiBaseUrl]);

  // Fetch logged in user when token changes
  useEffect(() => {
    if (token) {
      fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {
          handleLogout();
        });
    } else {
      setCurrentUser(null);
    }
  }, [token, apiBaseUrl]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('staffsync_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('staffsync_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffsync_token');
    setToken('');
    setCurrentUser(null);
  };

  // Quick Demo Login helper for testing different roles
  const handleQuickDemoLogin = async (role) => {
    const demoEmail = `${role}.demo@staffsync.test`;
    const demoPassword = 'Password123!';
    setAuthLoading(true);
    setAuthError(null);

    try {
      // Attempt login first
      let res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });
      let data = await res.json();

      // If user doesn't exist, create it via registration
      if (!res.ok && res.status === 401) {
        const regRes = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} Demo User`,
            email: demoEmail,
            password: demoPassword
          })
        });
        data = await regRes.json();
        if (!regRes.ok) throw new Error(data.message || 'Quick demo user creation failed');
      }

      if (data.token) {
        localStorage.setItem('staffsync_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm py-2">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center">
            <i className="bi bi-people-fill me-2 fs-4"></i>
            StaffSync HRMS
          </span>

          <div className="d-flex align-items-center gap-3">
            {currentUser ? (
              <div className="d-flex align-items-center gap-3">
                <span className="text-white small">
                  <i className="bi bi-person-circle me-1"></i>
                  <strong>{currentUser.name}</strong>{' '}
                  <span className="badge bg-light text-primary text-uppercase ms-1">
                    {currentUser.role}
                  </span>
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            ) : (
              <span className="badge bg-warning text-dark">Not Authenticated</span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="container py-4">
        {!currentUser ? (
          /* Authentication Screen */
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white text-center py-3 border-bottom">
                  <h5 className="mb-1 fw-bold text-primary">
                    {authMode === 'login' ? 'Sign In to StaffSync' : 'Create an Employee Account'}
                  </h5>
                  <small className="text-muted">
                    {authMode === 'login'
                      ? 'Access your attendance and leave portal'
                      : 'Public registration (assigned as Employee)'}
                  </small>
                </div>
                <div className="card-body p-4">
                  {authError && <div className="alert alert-danger py-2 small">{authError}</div>}

                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                    {authMode === 'register' && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Jane Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Work Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-semibold"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : authMode === 'login' ? (
                        'Sign In'
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>

                  <div className="text-center mt-3 small">
                    {authMode === 'login' ? (
                      <span>
                        Need an account?{' '}
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => {
                            setAuthMode('register');
                            setAuthError(null);
                          }}
                        >
                          Register
                        </button>
                      </span>
                    ) : (
                      <span>
                        Already registered?{' '}
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError(null);
                          }}
                        >
                          Sign In
                        </button>
                      </span>
                    )}
                  </div>

                  <hr className="my-4" />

                  {/* One-click quick demo accounts for evaluation */}
                  <div className="text-center">
                    <span className="small text-muted d-block mb-2">
                      Quick Demo Personas for Evaluation:
                    </span>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleQuickDemoLogin('employee')}
                        disabled={authLoading}
                      >
                        Employee
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleQuickDemoLogin('manager')}
                        disabled={authLoading}
                      >
                        Manager
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleQuickDemoLogin('hr')}
                        disabled={authLoading}
                      >
                        HR Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Tabs */
          <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
              <div>
                <h4 className="fw-bold mb-0 text-dark">StaffSync Workspace</h4>
                <small className="text-muted">Phase 4 Workflows: Attendance & Leave Management</small>
              </div>

              {/* Submodule Navigation */}
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${
                    activeView === 'attendance' ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setActiveView('attendance')}
                >
                  <i className="bi bi-clock-history me-1"></i> Attendance
                </button>
                <button
                  type="button"
                  className={`btn ${activeView === 'leaves' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('leaves')}
                >
                  <i className="bi bi-calendar2-check me-1"></i> Leaves
                </button>
                <button
                  type="button"
                  className={`btn ${activeView === 'health' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('health')}
                >
                  <i className="bi bi-activity me-1"></i> API Health
                </button>
              </div>
            </div>

            {/* View Switching */}
            {activeView === 'attendance' && (
              <AttendanceView token={token} apiBaseUrl={apiBaseUrl} />
            )}

            {activeView === 'leaves' && (
              <LeaveView token={token} userRole={currentUser.role} apiBaseUrl={apiBaseUrl} />
            )}

            {activeView === 'health' && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="mb-0 fw-bold text-success">
                    <i className="bi bi-heart-pulse-fill me-2"></i>
                    Backend System Health
                  </h5>
                </div>
                <div className="card-body">
                  {healthData ? (
                    <div className="alert alert-success mb-0">
                      <h6 className="fw-bold">API Status: {healthData.status}</h6>
                      <ul className="mb-0 small list-unstyled">
                        <li>
                          <strong>Message:</strong> {healthData.message}
                        </li>
                        <li>
                          <strong>Environment:</strong> {healthData.environment}
                        </li>
                        <li>
                          <strong>Uptime:</strong> {healthData.uptime}
                        </li>
                        <li>
                          <strong>Timestamp:</strong> {healthData.timestamp}
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="spinner-border text-primary" role="status"></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
