import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../api/index.js';

const STATUS_BADGE = { active: 'success', inactive: 'secondary' };
const ROLE_BADGE = { hr: 'danger', manager: 'warning', employee: 'info' };

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchEmployees = useCallback((p = 1, s = search, r = roleFilter, st = statusFilter) => {
    setLoading(true);
    const params = { page: p, limit: 10 };
    if (s) params.search = s;
    if (r) params.role = r;
    if (st) params.status = st;
    employeeAPI.getAll(params)
      .then(res => {
        setEmployees(res.data.employees || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
        setPage(p);
      })
      .catch(() => setError('Failed to load employees.'))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchEmployees(1); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees(1, search, roleFilter, statusFilter);
  };

  const handleStatusToggle = async (emp) => {
    const newStatus = emp.user?.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} account for ${emp.user?.name}?`)) return;
    try {
      await employeeAPI.updateStatus(emp.user._id, newStatus);
      setMessage(`Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
      fetchEmployees(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1"><i className="bi bi-people-fill me-2 text-primary" />Employee Directory</h4>
          <p className="text-muted mb-0">{total} employees registered</p>
        </div>
        <Link to="/hr/employees/add" className="btn btn-primary">
          <i className="bi bi-person-plus me-2" />Add Employee
        </Link>
      </div>

      {message && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle me-2" />{message}<button className="btn-close" onClick={() => setMessage('')} /></div>}
      {error && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      {/* Filters */}
      <form onSubmit={handleSearch} className="card border-0 shadow-sm mb-4 p-3" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold">Search</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input className="form-control" placeholder="Name, email, department, designation…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Role</label>
            <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-fill">Search</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => {
              setSearch(''); setRoleFilter(''); setStatusFilter('');
              fetchEmployees(1, '', '', '');
            }}>Clear</button>
          </div>
        </div>
      </form>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Employee</th><th>Role</th><th>Department</th>
                  <th>Designation</th><th>Joined</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border text-primary" /></td></tr>
                ) : employees.length > 0 ? employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                          style={{ width: 36, height: 36, background: '#2563eb', fontSize: 14 }}>
                          {emp.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="fw-semibold small">{emp.user?.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{emp.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge bg-${ROLE_BADGE[emp.user?.role] || 'secondary'} text-capitalize`}>{emp.user?.role}</span></td>
                    <td className="small">{emp.department}</td>
                    <td className="small">{emp.designation}</td>
                    <td className="small">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '—'}</td>
                    <td><span className={`badge bg-${STATUS_BADGE[emp.user?.status] || 'secondary'} text-capitalize`}>{emp.user?.status}</span></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" title="Edit" onClick={() => navigate(`/hr/employees/edit/${emp.user?._id}`)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className={`btn btn-outline-${emp.user?.status === 'active' ? 'danger' : 'success'}`}
                          title={emp.user?.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => handleStatusToggle(emp)}>
                          <i className={`bi bi-${emp.user?.status === 'active' ? 'person-dash' : 'person-check'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No employees found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => fetchEmployees(page - 1)}>
            <i className="bi bi-chevron-left" /> Prev
          </button>
          <span className="align-self-center small text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => fetchEmployees(page + 1)}>
            Next <i className="bi bi-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
