import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TrainingPage() {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  // Common training catalog state
  const [trainings, setTrainings] = useState([
    {
      id: 'TRN-101',
      title: 'Corporate Data Security & Cyber Hygiene 2026',
      category: 'Information Security',
      totalModules: 4,
      completedModules: 3,
      duration: '3.5 Hours',
      status: 'in-progress',
      instructor: 'SecOps Team',
      description: 'Essential security guidelines covering credential safety, phishing detection, and remote work encryption.'
    },
    {
      id: 'TRN-102',
      title: 'Workplace Ethics & Diversity Standards',
      category: 'HR Compliance',
      totalModules: 3,
      completedModules: 3,
      duration: '2.0 Hours',
      status: 'completed',
      instructor: 'HR People & Culture',
      description: 'Comprehensive overview of professional conduct, diversity, anti-harassment policy, and workplace respect.'
    },
    {
      id: 'TRN-103',
      title: 'Agile & Modern Team Collaboration',
      category: 'Professional Skills',
      totalModules: 5,
      completedModules: 1,
      duration: '4.0 Hours',
      status: 'in-progress',
      instructor: 'Product Operations',
      description: 'Best practices for asynchronous standups, sprint retrospectives, and cross-functional team delivery.'
    },
    {
      id: 'TRN-104',
      title: 'Mental Wellness & Work-Life Balance',
      category: 'Wellness & Health',
      totalModules: 2,
      completedModules: 0,
      duration: '1.5 Hours',
      status: 'enrolled',
      instructor: 'Wellness Council',
      description: 'Strategies for preventing burnout, optimizing digital ergonomics, and maintaining healthy boundaries.'
    }
  ]);

  const [showCertModal, setShowCertModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleCompleteModule = (courseId) => {
    setTrainings(prev => prev.map(t => {
      if (t.id === courseId) {
        const nextCount = Math.min(t.totalModules, t.completedModules + 1);
        return {
          ...t,
          completedModules: nextCount,
          status: nextCount === t.totalModules ? 'completed' : 'in-progress'
        };
      }
      return t;
    }));
    setSuccessMsg('Training module marked as complete.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-mortarboard-fill me-2 text-primary" />
            {role === 'manager'
              ? 'Team Training & Skill Programs'
              : role === 'hr'
              ? 'Corporate Training & Curriculum'
              : 'Training & Development Programs'}
          </h4>
          <p className="text-muted mb-0">
            {role === 'manager'
              ? 'Oversee direct reports skill compliance and corporate courses'
              : role === 'hr'
              ? 'Manage organization-wide curriculum and compliance frameworks'
              : 'Self-paced learning, skill progression, and verified certificates'}
          </p>
        </div>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
          <i className="bi bi-patch-check me-1" /> Active Learning Portal
        </span>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2" />{successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* Courses Catalog Grid */}
      <div className="row g-4 mb-4">
        {trainings.map((trn) => {
          const pct = Math.round((trn.completedModules / trn.totalModules) * 100);
          return (
            <div key={trn.id} className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-secondary-subtle text-secondary small">{trn.category}</span>
                      <span className={`badge ${trn.status === 'completed' ? 'bg-success' : 'bg-primary'} text-capitalize`}>
                        {trn.status === 'completed' ? 'Completed' : `${pct}% Done`}
                      </span>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">{trn.title}</h5>
                    <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>{trn.description}</p>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Modules: <strong>{trn.completedModules} / {trn.totalModules}</strong></span>
                      <span>Estimated Duration: <strong>{trn.duration}</strong></span>
                    </div>
                    <div className="progress mb-3" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${trn.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="small text-muted">
                        <i className="bi bi-person-badge me-1" /> {trn.instructor}
                      </span>
                      {trn.status === 'completed' ? (
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                          onClick={() => setShowCertModal(trn)}
                        >
                          <i className="bi bi-award" /> View Certificate
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                          onClick={() => handleCompleteModule(trn.id)}
                        >
                          <i className="bi bi-play-circle" /> Complete Module
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program Info Card */}
      <div className="card border-0 shadow-sm p-4 bg-light" style={{ borderRadius: 14 }}>
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-white rounded-circle shadow-sm text-primary">
            <i className="bi bi-info-circle-fill fs-4" />
          </div>
          <div>
            <h6 className="fw-bold mb-1">Professional Credentialing System</h6>
            <p className="text-muted small mb-0">
              Completed modules automatically reflect in personal development records and employee performance appraisals.
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: 16 }}>
              <div className="mb-3">
                <i className="bi bi-patch-check-fill text-success display-3" />
              </div>
              <h4 className="fw-bold text-dark mb-1">Certificate of Completion</h4>
              <p className="text-muted small mb-3">StaffSync Learning &amp; Development Program</p>
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="text-muted small">This certifies that</div>
                <h5 className="fw-bold text-primary my-1">{user?.name}</h5>
                <div className="text-muted small">has successfully satisfied all course requirements for</div>
                <strong className="d-block mt-1 text-dark">{showCertModal.title}</strong>
                <span className="badge bg-success-subtle text-success mt-2">Verified Professional Credential</span>
              </div>
              <button className="btn btn-primary btn-sm mx-auto px-4" onClick={() => setShowCertModal(null)}>
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}