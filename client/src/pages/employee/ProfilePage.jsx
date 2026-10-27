import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    name: '', phone: '', address: '', bio: '', skills: '',
    ecName: '', ecRelationship: '', ecPhone: ''
  });

  useEffect(() => {
    profileAPI.getMyProfile()
      .then(r => {
        const p = r.data.profile;
        setProfile(p);
        setForm({
          name: p.user?.name || '',
          phone: p.phone || '',
          address: p.address || '',
          bio: p.bio || '',
          skills: (p.skills || []).join(', '),
          ecName: p.emergencyContact?.name || '',
          ecRelationship: p.emergencyContact?.relationship || '',
          ecPhone: p.emergencyContact?.phone || ''
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        emergencyContact: {
          name: form.ecName,
          relationship: form.ecRelationship,
          phone: form.ecPhone
        }
      };
      const r = await profileAPI.updateMyProfile(payload);
      setProfile(r.data.profile);
      setMessage('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" />
      <div className="mt-2 text-muted">Loading profile…</div>
    </div>
  );

  const roleBadge = { hr: 'danger', manager: 'warning', employee: 'info' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">My Profile</h4>
          <p className="text-muted mb-0">View and update your personal information</p>
        </div>
        {!editMode && (
          <button className="btn btn-primary" onClick={() => { setEditMode(true); setMessage(''); setError(''); }}>
            <i className="bi bi-pencil me-2" />Edit Profile
          </button>
        )}
      </div>

      {message && <div className="alert alert-success"><i className="bi bi-check-circle me-2" />{message}</div>}
      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>}

      <div className="row g-4">
        {/* Left: Avatar & work info (read-only) */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center p-4" style={{ borderRadius: 12 }}>
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: 80, height: 80, background: '#2563eb', fontSize: 32, color: '#fff', fontWeight: 700 }}
            >
              {profile?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h5 className="fw-bold mb-1">{profile?.user?.name}</h5>
            <div className="small text-muted mb-2">{profile?.user?.email}</div>
            <span className={`badge bg-${roleBadge[profile?.user?.role] || 'secondary'} text-uppercase mb-3`}>
              {profile?.user?.role}
            </span>

            <div className="list-group list-group-flush text-start mt-2">
              <div className="list-group-item px-0 border-0">
                <div className="small text-muted">Department</div>
                <div className="fw-semibold">{profile?.department || '—'}</div>
              </div>
              <div className="list-group-item px-0 border-0">
                <div className="small text-muted">Designation</div>
                <div className="fw-semibold">{profile?.designation || '—'}</div>
              </div>
              <div className="list-group-item px-0 border-0">
                <div className="small text-muted">Date of Joining</div>
                <div className="fw-semibold">
                  {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '—'}
                </div>
              </div>
              {profile?.reportingManager && (
                <div className="list-group-item px-0 border-0">
                  <div className="small text-muted">Reporting Manager</div>
                  <div className="fw-semibold">{profile.reportingManager.name}</div>
                </div>
              )}
              {profile?.user?.role === 'hr' && profile?.salary > 0 && (
                <div className="list-group-item px-0 border-0">
                  <div className="small text-muted">Salary</div>
                  <div className="fw-semibold">₹{profile.salary.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: editable fields */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-person-lines-fill me-2" />
                {editMode ? 'Edit Personal Details' : 'Personal Details'}
              </h6>
            </div>
            <div className="card-body p-4">
              {editMode ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Full Name</label>
                      <input className="form-control" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} minLength={2} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Phone Number</label>
                      <input className="form-control" value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Address</label>
                      <input className="form-control" value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Bio <span className="text-muted">(max 500 chars)</span></label>
                      <textarea className="form-control" rows={3} maxLength={500} value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Skills <span className="text-muted">(comma-separated)</span></label>
                      <input className="form-control" value={form.skills}
                        onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Node.js, MongoDB" />
                    </div>

                    <div className="col-12 mt-2">
                      <div className="fw-semibold small text-muted mb-2">Emergency Contact</div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Name</label>
                      <input className="form-control form-control-sm" value={form.ecName}
                        onChange={e => setForm(f => ({ ...f, ecName: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Relationship</label>
                      <input className="form-control form-control-sm" value={form.ecRelationship}
                        onChange={e => setForm(f => ({ ...f, ecRelationship: e.target.value }))} placeholder="Spouse, Parent…" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Phone</label>
                      <input className="form-control form-control-sm" value={form.ecPhone}
                        onChange={e => setForm(f => ({ ...f, ecPhone: e.target.value }))} />
                    </div>

                    <div className="col-12 d-flex gap-2 mt-3">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check2 me-1" />Save Changes</>}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="row g-3">
                  <InfoRow label="Phone" value={profile?.phone} />
                  <InfoRow label="Address" value={profile?.address} />
                  <InfoRow label="Bio" value={profile?.bio} wide />
                  <InfoRow label="Skills" value={profile?.skills?.join(', ') || '—'} wide />
                  {profile?.emergencyContact?.name && (
                    <>
                      <div className="col-12"><hr className="my-1" /><div className="fw-semibold small text-muted">Emergency Contact</div></div>
                      <InfoRow label="Name" value={profile.emergencyContact.name} />
                      <InfoRow label="Relationship" value={profile.emergencyContact.relationship} />
                      <InfoRow label="Phone" value={profile.emergencyContact.phone} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, wide }) {
  return (
    <div className={wide ? 'col-12' : 'col-md-6'}>
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || <span className="text-muted fst-italic">Not provided</span>}</div>
    </div>
  );
}
