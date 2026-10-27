import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../api/index.js';

export default function AddEmployee() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee',
    department: '', designation: '', phone: '', address: '',
    salary: '', reportingManager: '', dateOfJoining: '', skills: '', bio: '', status: 'active'
  });

  useEffect(() => {
    // Load managers for reporting manager dropdown
    employeeAPI.getAll({ role: 'manager', limit: 100 })
      .then(r => setManagers(r.data.employees || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        salary: form.salary ? Number(form.salary) : 0,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        reportingManager: form.reportingManager || undefined,
        password: form.password || undefined
      };
      await employeeAPI.create(payload);
      navigate('/hr/employees', { state: { message: `Employee ${form.name} created successfully!` } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-person-plus me-2 text-primary" />Add New Employee</h4>
        <p className="text-muted mb-0">Create a new employee account and profile</p>
      </div>

      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Account Details */}
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0"><i className="bi bi-person-lock me-2" />Account Details</h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={set('name')} required minLength={2} placeholder="Jane Doe" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Work Email *</label>
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} required placeholder="jane@company.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">
                      Password <span className="text-muted">(leave blank for default)</span>
                    </label>
                    <input type="password" className="form-control" value={form.password} onChange={set('password')} minLength={6} placeholder="Default: Welcome@StaffSync2026" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Role *</label>
                    <select className="form-select" value={form.role} onChange={set('role')}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Status *</label>
                    <select className="form-select" value={form.status} onChange={set('status')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0"><i className="bi bi-building me-2" />Work Details</h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Department</label>
                    <input className="form-control" value={form.department} onChange={set('department')} placeholder="Engineering" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Designation</label>
                    <input className="form-control" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Date of Joining</label>
                    <input type="date" className="form-control" value={form.dateOfJoining} onChange={set('dateOfJoining')} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Reporting Manager</label>
                    <select className="form-select" value={form.reportingManager} onChange={set('reportingManager')}>
                      <option value="">— None —</option>
                      {managers.map(m => (
                        <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Salary (₹)</label>
                    <input type="number" className="form-control" value={form.salary} onChange={set('salary')} min={0} placeholder="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Phone</label>
                    <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Address</label>
                    <input className="form-control" value={form.address} onChange={set('address')} placeholder="City, State" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Skills <span className="text-muted">(comma-separated)</span></label>
                    <input className="form-control" value={form.skills} onChange={set('skills')} placeholder="React, Node.js, MongoDB" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Bio</label>
                    <textarea className="form-control" rows={3} value={form.bio} onChange={set('bio')} maxLength={500} placeholder="Brief description..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/hr/employees')}>Cancel</button>
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-person-plus me-2" />Create Employee</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
