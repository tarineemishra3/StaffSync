import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';

const PRIORITY_BADGE = {
  urgent: 'danger', high: 'warning text-dark', normal: 'primary', low: 'secondary'
};

export default function AnnouncementsManage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', targetDepartment: 'All' });

  const fetchAnnouncements = () => {
    setLoading(true);
    announcementAPI.getAll({ limit: 50 })
      .then(r => setAnnouncements(r.data.announcements || []))
      .catch(() => setError('Failed to load announcements.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', content: '', priority: 'normal', targetDepartment: 'All' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({ title: a.title, content: a.content, priority: a.priority, targetDepartment: a.targetDepartment });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await announcementAPI.update(editingId, form);
        setMessage('Announcement updated successfully.');
      } else {
        await announcementAPI.create(form);
        setMessage('Announcement published successfully.');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete announcement "${title}"? This cannot be undone.`)) return;
    try {
      await announcementAPI.delete(id);
      setMessage('Announcement deleted.');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1"><i className="bi bi-megaphone-fill me-2 text-primary" />Announcements</h4>
          <p className="text-muted mb-0">Create and manage company announcements</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2" />New Announcement
        </button>
      </div>

      {message && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle me-2" />{message}<button className="btn-close" onClick={() => setMessage('')} /></div>}
      {error && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? 'Edit Announcement' : 'New Announcement'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title *</label>
                    <input className="form-control" value={form.title} required minLength={3} maxLength={120}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement headline…" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Content *</label>
                    <textarea className="form-control" rows={5} value={form.content} required minLength={10}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full announcement details…" />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Priority</label>
                      <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Target Department</label>
                      <input className="form-control" value={form.targetDepartment}
                        onChange={e => setForm(f => ({ ...f, targetDepartment: e.target.value }))}
                        placeholder="All (or specific dept name)" />
                      <div className="form-text">Use "All" to broadcast to everyone.</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" /> : <>{editingId ? 'Save Changes' : 'Publish'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-megaphone display-4 d-block mb-3 opacity-25" />
          <p>No announcements yet. Create your first announcement!</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {announcements.map(a => (
            <div key={a._id} className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge bg-${PRIORITY_BADGE[a.priority] || 'secondary'} text-capitalize`}>{a.priority}</span>
                      {a.targetDepartment !== 'All' && (
                        <span className="badge bg-light text-dark border">{a.targetDepartment}</span>
                      )}
                      <span className="small text-muted ms-auto">
                        {new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-2">{a.title}</h6>
                    <p className="text-muted small mb-2" style={{ lineHeight: 1.6 }}>
                      {a.content.length > 200 ? a.content.slice(0, 200) + '…' : a.content}
                    </p>
                    <div className="small text-muted">
                      <i className="bi bi-person-circle me-1" />by {a.author?.name || 'HR'}
                    </div>
                  </div>
                  <div className="btn-group btn-group-sm flex-shrink-0">
                    <button className="btn btn-outline-secondary" title="Edit" onClick={() => openEdit(a)}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-outline-danger" title="Delete" onClick={() => handleDelete(a._id, a.title)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
