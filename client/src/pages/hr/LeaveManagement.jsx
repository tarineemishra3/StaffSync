import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../api/index.js';

const STATUS_BADGE = {
  pending: 'warning text-dark',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'secondary'
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const fetchLeaves = () => {
    setLoading(true);
    leaveAPI.getAll()
      .then(r => setLeaves(r.data.leaves || []))
      .catch(() => setError('Failed to load leave requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const openReview = (id, action) => { setReviewingId(id); setReviewAction(action); setReviewRemarks(''); };

  const handleReview = async () => {
    try {
      await leaveAPI.review(reviewingId, reviewAction, reviewRemarks);
      setMessage(`Leave ${reviewAction} successfully.`);
      setReviewingId(null);
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed.');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-calendar2-check me-2 text-warning" />Leave Management</h4>
        <p className="text-muted mb-0">Review and manage all employee leave requests</p>
      </div>

      {message && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle me-2" />{message}<button className="btn-close" onClick={() => setMessage('')} /></div>}
      {error && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      {/* Review modal */}
      {reviewingId && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">
                  {reviewAction === 'approved' ? '✅ Approve' : '❌ Reject'} Leave Request
                </h5>
                <button className="btn-close" onClick={() => setReviewingId(null)} />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Review Remarks <span className="text-muted">(optional)</span></label>
                <textarea className="form-control" rows={3} value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Add a note to the employee…" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setReviewingId(null)}>Cancel</button>
                <button
                  className={`btn ${reviewAction === 'approved' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleReview}
                >
                  Confirm {reviewAction === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="btn-group mb-4" role="group">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} type="button"
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'} text-capitalize`}
            onClick={() => setFilter(f)}>
            {f}
            {f === 'pending' && (
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
                    <th>Employee</th><th>Type</th><th>Duration</th>
                    <th>Days</th><th>Reason</th><th>Status</th><th>Reviewed By</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(l => (
                    <tr key={l._id}>
                      <td>
                        <div className="fw-semibold small">{l.user?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.user?.email}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border text-capitalize">{l.leaveType}</span></td>
                      <td className="small">
                        {new Date(l.startDate).toLocaleDateString()} –<br/>
                        {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="small">{l.totalDays}</td>
                      <td className="small" style={{ maxWidth: 160 }}>
                        <div className="text-truncate" title={l.reason}>{l.reason}</div>
                        {l.reviewRemarks && <div className="text-muted fst-italic">{l.reviewRemarks}</div>}
                      </td>
                      <td><span className={`badge bg-${STATUS_BADGE[l.status]}`}>{l.status}</span></td>
                      <td className="small text-muted">{l.reviewedBy?.name || '—'}</td>
                      <td>
                        {l.status === 'pending' && (
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-success" onClick={() => openReview(l._id, 'approved')}>
                              <i className="bi bi-check2" />
                            </button>
                            <button className="btn btn-danger" onClick={() => openReview(l._id, 'rejected')}>
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="text-center text-muted py-4">No {filter !== 'all' ? filter : ''} leave requests found.</td></tr>
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
