import React, { useState, useEffect } from 'react';

function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealthData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiBaseUrl]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white py-3">
              <h4 className="mb-0 fw-semibold">
                <i className="bi bi-people-fill me-2"></i>
                StaffSync HRMS
              </h4>
              <small className="text-light opacity-75">Milestone 1 — Setup & Connectivity Verification</small>
            </div>
            <div className="card-body p-4">
              <h5 className="card-title text-secondary mb-3">Backend API Connectivity</h5>
              
              {loading && (
                <div className="d-flex align-items-center text-primary">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span>Checking backend health at <code>{apiBaseUrl}/health</code>...</span>
                </div>
              )}

              {error && (
                <div className="alert alert-warning mb-0" role="alert">
                  <h6 className="alert-heading fw-bold mb-1">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Backend Not Yet Reachable
                  </h6>
                  <p className="mb-1 small">
                    Ensure the Express backend is running on port 5000:
                  </p>
                  <code className="d-block bg-white p-2 rounded small text-dark mb-2">
                    cd server && npm run dev
                  </code>
                  <div className="small text-muted">Error detail: {error}</div>
                </div>
              )}

              {healthData && (
                <div className="alert alert-success mb-0" role="alert">
                  <h6 className="alert-heading fw-bold mb-2">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Connected Successfully!
                  </h6>
                  <ul className="list-unstyled mb-0 small">
                    <li><strong>Status:</strong> <span className="badge bg-success">{healthData.status}</span></li>
                    <li><strong>Message:</strong> {healthData.message}</li>
                    <li><strong>Uptime:</strong> {healthData.uptime}</li>
                    <li><strong>Environment:</strong> {healthData.environment}</li>
                    <li><strong>Timestamp:</strong> {healthData.timestamp}</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="card-footer bg-light text-muted small py-2 d-flex justify-content-between">
              <span>Stack: React + Vite + Bootstrap</span>
              <span>Port: 5173</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
