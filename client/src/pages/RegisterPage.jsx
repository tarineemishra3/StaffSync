import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email || !password) { setError('All fields are required.'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-4"
      style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2e4b 60%, #1e3a5f 100%)' }}
    >
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 56, height: 56, background: '#2563eb' }}
          >
            <i className="bi bi-person-plus-fill text-white fs-3" />
          </div>
          <h4 className="fw-bold text-white mb-1">Create Account</h4>
          <p className="text-secondary small mb-0">Register as an Employee (public)</p>
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
                <label className="form-label fw-semibold small">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person" /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

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
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock" /></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="alert alert-info py-2 small">
                <i className="bi bi-info-circle me-1" />
                Public registration assigns <strong>Employee</strong> role. Managers and HR are created by HR admin.
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold mt-2"
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm" /> : (
                  <><i className="bi bi-person-check me-2" />Create Account</>
                )}
              </button>
            </form>

            <div className="text-center mt-3 small">
              Already have an account?{' '}
              <Link to="/login" className="fw-semibold">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
