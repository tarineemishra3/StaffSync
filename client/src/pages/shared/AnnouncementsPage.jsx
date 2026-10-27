import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { announcementAPI } from '../../api/index.js';

const PRIORITY_BADGE = { urgent: 'danger', high: 'warning text-dark', normal: 'primary', low: 'secondary' };
const PRIORITY_ICON = { urgent: 'bi-alarm-fill', high: 'bi-exclamation-circle', normal: 'bi-megaphone', low: 'bi-info-circle' };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnnouncements = (p = 1) => {
    setLoading(true);
    announcementAPI.getAll({ page: p, limit: 10 })
      .then(r => {
        setAnnouncements(r.data.announcements || []);
        setTotalPages(r.data.totalPages || 1);
        setPage(p);
      })
      .catch(() => setError('Failed to load announcements.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(1); }, []);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-megaphone me-2 text-primary" />Announcements</h4>
        <p className="text-muted mb-0">Company-wide announcements and updates</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-megaphone display-4 d-block mb-3 opacity-25" />
          <p>No announcements have been posted yet.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {announcements.map(a => (
            <div key={a._id} className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: 44, height: 44, background: a.priority === 'urgent' ? '#fee2e2' : a.priority === 'high' ? '#fef3c7' : '#eff6ff' }}
                  >
                    <i className={`bi ${PRIORITY_ICON[a.priority] || 'bi-megaphone'} fs-5`}
                      style={{ color: a.priority === 'urgent' ? '#dc2626' : a.priority === 'high' ? '#d97706' : '#2563eb' }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge bg-${PRIORITY_BADGE[a.priority] || 'secondary'} text-capitalize`}>{a.priority}</span>
                      {a.targetDepartment !== 'All' && (
                        <span className="badge bg-light text-dark border">{a.targetDepartment}</span>
                      )}
                      <span className="small text-muted ms-auto">
                        {new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-2">{a.title}</h6>
                    <p className="text-muted mb-2" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.content}</p>
                    <div className="small text-muted">
                      <i className="bi bi-person-circle me-1" />Posted by <strong>{a.author?.name || 'HR'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => fetchAnnouncements(page - 1)}>
            <i className="bi bi-chevron-left" /> Prev
          </button>
          <span className="align-self-center small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchAnnouncements(page + 1)}>
            Next <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
