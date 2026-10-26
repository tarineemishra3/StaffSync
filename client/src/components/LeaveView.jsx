import React, { useState, useEffect } from 'react';

function LeaveView({ token, userRole, apiBaseUrl }) {
  const [leaves, setLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState('my-leaves');

  // Form state
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isManagerOrHR = userRole === 'manager' || userRole === 'hr';

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/leaves/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Error fetching my leaves:', err);
    }
  };

  const fetchTeamLeaves = async () => {
    if (!isManagerOrHR) return;
    try {
      const res = await fetch(`${apiBaseUrl}/leaves/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTeamLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Error fetching team leaves:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyLeaves();
      if (isManagerOrHR) {
        fetchTeamLeaves();
      }
    }
  }, [token, userRole]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Leave application failed');

      setMessage('Leave application submitted successfully!');
      setReason('');
      setStartDate('');
      setEndDate('');
      await fetchMyLeaves();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/leaves/${leaveId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancellation failed');
      setMessage(data.message);
      await fetchMyLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewLeave = async (leaveId, decision) => {
    const reviewRemarks = window.prompt(`Enter review remarks for ${decision}:`) || '';
    try {
      const res = await fetch(`${apiBaseUrl}/leaves/${leaveId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: decision, reviewRemarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review failed');
      setMessage(data.message);
      await fetchTeamLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'cancelled':
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  return (
    <div className="leave-container">
      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'my-leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-leaves')}
          >
            <i className="bi bi-calendar-event me-2"></i>
            My Leave Requests
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'apply' ? 'active' : ''}`}
            onClick={() => setActiveTab('apply')}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Apply for Leave
          </button>
        </li>
        {isManagerOrHR && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'team-leaves' ? 'active' : ''}`}
              onClick={() => setActiveTab('team-leaves')}
            >
              <i className="bi bi-check2-circle me-2"></i>
              Team Approvals
              {teamLeaves.filter((l) => l.status === 'pending').length > 0 && (
                <span className="badge bg-danger ms-2">
                  {teamLeaves.filter((l) => l.status === 'pending').length}
                </span>
              )}
            </button>
          </li>
        )}
      </ul>

      {/* Tab 1: Apply for Leave */}
      {activeTab === 'apply' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-bottom py-3">
            <h5 className="mb-0 fw-bold text-primary">
              <i className="bi bi-envelope-paper me-2"></i>
              Submit Leave Application
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmitLeave}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Leave Type</label>
                  <select
                    className="form-select"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    required
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Reason for Leave</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide a reason for your leave application (minimum 5 characters)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  ></textarea>
                  <div className="form-text">Must be at least 5 characters.</div>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-1"></i> Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: My Leaves */}
      {activeTab === 'my-leaves' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">My Leave History</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchMyLeaves}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reviewed By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length > 0 ? (
                    leaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td>{leave.totalDays} days</td>
                        <td className="small" style={{ maxWidth: '200px' }}>
                          {leave.reason}
                          {leave.reviewRemarks && (
                            <div className="text-muted fst-italic mt-1">
                              Note: {leave.reviewRemarks}
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(leave.status)}</td>
                        <td className="small text-muted">{leave.reviewedBy?.name || '—'}</td>
                        <td>
                          {leave.status === 'pending' && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancelLeave(leave._id)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        No leave applications found. Use the "Apply for Leave" tab to submit a request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team Approvals (Manager/HR only) */}
      {isManagerOrHR && activeTab === 'team-leaves' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-success">
              <i className="bi bi-shield-check me-2"></i>
              Team Leave Approvals
            </h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchTeamLeaves}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Applicant</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLeaves.length > 0 ? (
                    teamLeaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>
                          <div className="fw-semibold">{leave.user?.name}</div>
                          <div className="small text-muted">{leave.user?.email}</div>
                        </td>
                        <td className="text-capitalize">{leave.leaveType}</td>
                        <td>
                          {new Date(leave.startDate).toLocaleDateString()} –{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td>{leave.totalDays} days</td>
                        <td className="small" style={{ maxWidth: '220px' }}>
                          {leave.reason}
                        </td>
                        <td>{getStatusBadge(leave.status)}</td>
                        <td>
                          {leave.status === 'pending' ? (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success"
                                onClick={() => handleReviewLeave(leave._id, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleReviewLeave(leave._id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="small text-muted">
                              Reviewed by {leave.reviewedBy?.name || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No team leave applications awaiting review.
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

export default LeaveView;
