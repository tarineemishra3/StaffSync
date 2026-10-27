import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../api/index.js';

export default function AttendanceReport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRecords = (p = 1, d = dateFilter, s = statusFilter) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (d) params.date = d;
    if (s) params.status = s;
    attendanceAPI.getAll(params)
      .then(r => {
        setRecords(r.data.records || []);
        setTotalPages(r.data.totalPages || 1);
        setTotal(r.data.total || 0);
        setPage(p);
      })
      .catch(() => setError('Failed to load attendance records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(1); }, []);

  const STATUS_BADGE = { present: 'success', 'half-day': 'warning text-dark', absent: 'secondary' };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-clock-history me-2 text-primary" />Attendance Report</h4>
        <p className="text-muted mb-0">{total} records · Organization-wide attendance</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4 p-3" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Date</label>
            <input type="date" className="form-control" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="col-md-5 d-flex gap-2">
            <button className="btn btn-primary" onClick={() => fetchRecords(1, dateFilter, statusFilter)}>Filter</button>
            <button className="btn btn-outline-secondary" onClick={() => { setDateFilter(''); setStatusFilter(''); fetchRecords(1, '', ''); }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Employee</th><th>Date</th>
                  <th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border text-primary" /></td></tr>
                ) : records.length > 0 ? records.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="fw-semibold small">{r.user?.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.user?.email}</div>
                    </td>
                    <td className="small fw-semibold">{r.date}</td>
                    <td className="small">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}</td>
                    <td className="small">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : <span className="text-warning">Pending</span>}</td>
                    <td className="small">{r.totalHours ? `${r.totalHours} hrs` : '—'}</td>
                    <td><span className={`badge bg-${STATUS_BADGE[r.status] || 'secondary'} text-capitalize`}>{r.status}</span></td>
                    <td className="small text-muted">{r.remarks || '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => fetchRecords(page - 1)}>
            <i className="bi bi-chevron-left" /> Prev
          </button>
          <span className="align-self-center small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchRecords(page + 1)}>
            Next <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
