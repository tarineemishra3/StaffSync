import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/index.js';

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    employeeAPI.getTeam()
      .then(r => setTeam(r.data.team || []))
      .catch(() => setError('Failed to load team members.'))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => s === 'active' ? 'success' : 'secondary';

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-people me-2 text-primary" />My Team</h4>
        <p className="text-muted mb-0">Employees reporting to you</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : team.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-people display-4 d-block mb-3 opacity-25" />
          <p>No team members assigned to you yet.</p>
          <p className="small">HR will assign employees to your team.</p>
        </div>
      ) : (
        <div className="row g-3">
          {team.map(emp => (
            <div key={emp._id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                      style={{ width: 44, height: 44, background: '#2563eb', fontSize: 18 }}
                    >
                      {emp.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="fw-bold text-truncate">{emp.user?.name}</div>
                      <div className="small text-muted text-truncate">{emp.user?.email}</div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-light text-dark border">{emp.designation}</span>
                    <span className="badge bg-light text-dark border">{emp.department}</span>
                    <span className={`badge bg-${statusBadge(emp.user?.status)} text-capitalize`}>{emp.user?.status}</span>
                  </div>

                  {emp.phone && (
                    <div className="small text-muted"><i className="bi bi-telephone me-1" />{emp.phone}</div>
                  )}
                  {emp.dateOfJoining && (
                    <div className="small text-muted mt-1">
                      <i className="bi bi-calendar me-1" />Joined {new Date(emp.dateOfJoining).toLocaleDateString()}
                    </div>
                  )}
                  {emp.skills?.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {emp.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="badge" style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.7rem' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
