import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../api/index.js';

export default function TeamAttendancePage() {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAttendance = (d) => {
    setLoading(true);
    attendanceAPI.getTeam(d)
      .then(r => setRecords(r.data.attendance || []))
      .catch(() => setError('Failed to load team attendance.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAttendance(date); }, []);

  const handleDateChange = (e) => {
    setDate(e.target.value);
    fetchAttendance(e.target.value);
  };

  const statusBadge = { present: 'success', 'half-day': 'warning text-dark', absent: 'secondary' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1"><i className="bi bi-clock-history me-2 text-primary" />Team Attendance</h4>
          <p className="text-muted mb-0">View your team's attendance for a specific date</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small fw-semibold">Date:</label>
          <input type="date" className="form-control form-control-sm" value={date} onChange={handleDateChange} />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0">Attendance for {date}</h6>
            <span className="badge bg-primary">{records.length} checked in</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length > 0 ? records.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="fw-semibold">{r.user?.name}</div>
                        <div className="small text-muted">{r.user?.email}</div>
                      </td>
                      <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}</td>
                      <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : <span className="text-warning small">Not out</span>}</td>
                      <td>{r.totalHours ? `${r.totalHours} hrs` : '—'}</td>
                      <td>
                        <span className={`badge bg-${statusBadge[r.status] || 'secondary'} text-capitalize`}>{r.status}</span>
                      </td>
                      <td className="small text-muted">{r.remarks || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        <i className="bi bi-calendar-x d-block mb-2 fs-4 opacity-25" />
                        No attendance records for this date
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
