import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleHome = { employee: '/dashboard', manager: '/manager', hr: '/hr' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(email.trim(), password);
      const dest = from || roleHome[user.role] || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setError('');
    try {
      const { authAPI } = await import('../api/index.js');
      const res = await authAPI.demoLogin(role);
      const { token: t, user: u } = res.data;
      localStorage.setItem('staffsync_token', t);
      // Force a full page reload so AuthContext picks up the new token and user
      window.location.href = roleHome[u.role] || '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2e4b 60%, #1e3a5f 100%)' }}
    >
      <div className="container" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 56, height: 56, background: '#2563eb' }}
          >
            <i className="bi bi-people-fill text-white fs-3" />
          </div>
          <h4 className="fw-bold text-white mb-1">StaffSync HRMS</h4>
          <p className="text-secondary small mb-0">Sign in to your account</p>
        </div>

        <div className="card border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Work Email</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope" /></span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock" /></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm" /> : (
                  <><i className="bi bi-box-arrow-in-right me-2" />Sign In</>
                )}
              </button>
            </form>

            <div className="text-center mt-3 small">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="fw-semibold">Register here</Link>
            </div>

            <hr className="my-4" />

            <div className="text-center">
              <p className="small text-muted mb-2">Quick demo personas:</p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                {['employee', 'manager', 'hr'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-capitalize"
                    onClick={() => handleQuickLogin(role)}
                    disabled={loading}
                  >
                    <i className="bi bi-person me-1" />{role === 'hr' ? 'HR Admin' : role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-secondary small mt-3">
          &copy; 2026 StaffSync. Secure HR Management.
        </p>
      </div>
    </div>
  );
}
