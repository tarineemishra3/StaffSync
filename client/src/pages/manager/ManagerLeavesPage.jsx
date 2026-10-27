import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../api/index.js';

const STATUS_BADGE = {
  pending: 'warning text-dark',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'secondary'
};

export default function ManagerLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [filter, setFilter] = useState('pending');

  const fetchLeaves = () => {
    setLoading(true);
    leaveAPI.getTeam()
      .then(r => setLeaves(r.data.leaves || []))
      .catch(() => setError('Failed to load team leave requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleReview = async (id, status) => {
    try {
      await leaveAPI.review(id, status, reviewRemarks);
      setMessage(`Leave request ${status} successfully.`);
      setReviewingId(null);
      setReviewRemarks('');
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed.');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-calendar2-check me-2 text-warning" />Leave Approvals</h4>
        <p className="text-muted mb-0">Review and manage your team's leave requests</p>
      </div>

      {message && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle me-2" />{message}<button className="btn-close" onClick={() => setMessage('')} /></div>}
      {error && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      {/* Filter tabs */}
      <div className="btn-group mb-4" role="group">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} type="button"
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'} text-capitalize`}
            onClick={() => setFilter(f)}>
            {f} {f === 'pending' && leaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="badge bg-danger ms-1">{leaves.filter(l => l.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th><th>Type</th><th>Duration</th><th>Days</th>
                    <th>Reason</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(l => (
                    <React.Fragment key={l._id}>
                      <tr>
                        <td>
                          <div className="fw-semibold">{l.user?.name}</div>
                          <div className="small text-muted">{l.user?.email}</div>
                        </td>
                        <td><span className="badge bg-light text-dark border text-capitalize">{l.leaveType}</span></td>
                        <td className="small">
                          {new Date(l.startDate).toLocaleDateString()} –<br/>
                          {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td>{l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</td>
                        <td className="small" style={{ maxWidth: 180 }}>
                          <div className="text-truncate" title={l.reason}>{l.reason}</div>
                        </td>
                        <td><span className={`badge bg-${STATUS_BADGE[l.status]}`}>{l.status}</span></td>
                        <td>
                          {l.status === 'pending' ? (
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-success" onClick={() => { setReviewingId(l._id); setReviewRemarks(''); }}>
                                <i className="bi bi-check2" />
                              </button>
                              <button className="btn btn-danger" onClick={() => { setReviewingId(l._id + '_reject'); setReviewRemarks(''); }}>
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          ) : (
                            <span className="small text-muted">{l.reviewedBy?.name || '—'}</span>
                          )}
                        </td>
                      </tr>
                      {/* Inline review panel */}
                      {(reviewingId === l._id || reviewingId === l._id + '_reject') && (
                        <tr>
                          <td colSpan="7" className="bg-light">
                            <div className="p-3">
                              <div className="small fw-semibold mb-2">
                                {reviewingId === l._id ? '✅ Approve' : '❌ Reject'} leave for {l.user?.name}
                              </div>
                              <div className="input-group input-group-sm" style={{ maxWidth: 480 }}>
                                <input
                                  className="form-control"
                                  placeholder="Review remarks (optional)"
                                  value={reviewRemarks}
                                  onChange={e => setReviewRemarks(e.target.value)}
                                />
                                <button
                                  className={`btn ${reviewingId === l._id ? 'btn-success' : 'btn-danger'}`}
                                  onClick={() => handleReview(l._id, reviewingId === l._id ? 'approved' : 'rejected')}
                                >
                                  Confirm
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => setReviewingId(null)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No {filter !== 'all' ? filter : ''} leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
