import React, { useState, useEffect } from 'react';

function AttendanceView({ token, apiBaseUrl }) {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchToday = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTodayStatus(data);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/attendance/me?limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.records || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchToday();
      fetchHistory();
    }
  }, [token]);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-in failed');
      setMessage(data.message);
      setRemarks('');
      await fetchToday();
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl}/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-out failed');
      setMessage(data.message);
      setRemarks('');
      await fetchToday();
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      <div className="row g-4 mb-4">
        {/* Today's Punch Card */}
        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold text-primary">
                <i className="bi bi-clock-history me-2"></i>
                Today's Work Shift
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Business Date:</span>
                <span className="fw-semibold">{todayStatus?.date || 'Loading...'}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Current Shift Status:</span>
                {todayStatus?.hasCheckedOut ? (
                  <span className="badge bg-success">Shift Completed</span>
                ) : todayStatus?.hasCheckedIn ? (
                  <span className="badge bg-warning text-dark">Shift In Progress</span>
                ) : (
                  <span className="badge bg-secondary">Not Checked In</span>
                )}
              </div>
              {todayStatus?.attendance && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2 small">
                    <span className="text-muted">Check-in:</span>
                    <span>{new Date(todayStatus.attendance.checkInTime).toLocaleTimeString()}</span>
                  </div>
                  {todayStatus.attendance.checkOutTime && (
                    <div className="d-flex justify-content-between align-items-center mb-2 small">
                      <span className="text-muted">Check-out:</span>
                      <span>{new Date(todayStatus.attendance.checkOutTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {todayStatus.attendance.totalHours > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-2 small">
                      <span className="text-muted">Total Hours Logged:</span>
                      <span className="fw-bold text-success">{todayStatus.attendance.totalHours} hrs</span>
                    </div>
                  )}
                </>
              )}

              <div className="mt-3">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Optional shift remarks (e.g. Remote work, field visit)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={loading || todayStatus?.hasCheckedOut}
                />
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-fill"
                    onClick={handleCheckIn}
                    disabled={loading || todayStatus?.hasCheckedIn}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    {todayStatus?.hasCheckedIn ? 'Checked In' : 'Check In'}
                  </button>
                  <button
                    className="btn btn-outline-danger flex-fill"
                    onClick={handleCheckOut}
                    disabled={loading || !todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    {todayStatus?.hasCheckedOut ? 'Checked Out' : 'Check Out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="col-12 col-md-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold text-secondary">
                <i className="bi bi-pie-chart-fill me-2"></i>
                Monthly Summary
              </h5>
            </div>
            <div className="card-body">
              {summary ? (
                <div className="row text-center g-3">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fs-3 fw-bold text-primary">{summary.totalDays}</div>
                      <div className="small text-muted">Total Days Recorded</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fs-3 fw-bold text-success">{summary.totalPresent}</div>
                      <div className="small text-muted">Full Days Present</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fs-3 fw-bold text-warning">{summary.totalHalfDay}</div>
                      <div className="small text-muted">Half Days</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fs-3 fw-bold text-info">{summary.totalWorkingHours}h</div>
                      <div className="small text-muted">Total Hours Logged</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted text-center py-4">No summary data available yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Recent Attendance Records</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchHistory}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((rec) => (
                    <tr key={rec._id}>
                      <td className="fw-semibold">{rec.date}</td>
                      <td>{new Date(rec.checkInTime).toLocaleTimeString()}</td>
                      <td>
                        {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : '—'}
                      </td>
                      <td>{rec.totalHours ? `${rec.totalHours} hrs` : 'In progress'}</td>
                      <td>
                        <span
                          className={`badge ${
                            rec.status === 'present'
                              ? 'bg-success'
                              : rec.status === 'half-day'
                              ? 'bg-warning text-dark'
                              : 'bg-secondary'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="small text-muted">{rec.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No attendance records found. Check in above to create your first record!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceView;
