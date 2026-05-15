// src/pages/CompanyManagerDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu, Users, UserCheck,
  ChevronDown, Check, AlertCircle,
  Loader, RefreshCw, UserX, Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getManagerStats, getManagerInterns, getManagerSupervisors,
  createManagerSupervisor, updateManagerSupervisor, deleteManagerSupervisor,
  assignInternsToSupervisor, avatarUrl
} from '../api';
import '../styles/CompanyManagerDashboard.css';

import CompanyManagerSidebar from '../components/manager/CompanyManagerSidebar';
import StudentSettings from '../components/student/StudentSettings';
import PendingApprovals from '../components/industrial/PendingApprovals';
import MyInterns        from '../components/industrial/MyInterns';
import TabLoadingState  from '../components/common/TabLoadingState';

const CompanyManagerDashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab]     = useState('overview');
  const [isSidebarOpen, setSidebar]   = useState(false);
  const [tabLoading, setTabLoading]   = useState(false);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const managerName = user?.name || 'Manager';
  const companyName = user?.companyOrg || 'Your Company';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebar(false);
    if (tab === activeTab) return;
    setTabLoading(true);
    Promise.allSettled([
      refreshUser(),
      new Promise(resolve => setTimeout(resolve, 250)),
    ]).finally(() => setTabLoading(false));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'assignments': return <InternAssignments />;
      case 'supervisors': return <SupervisorsList />;
      case 'approvals':   return <PendingApprovals />;
      case 'my-interns':  return <MyInterns />;
      case 'settings':    return <StudentSettings />;
      case 'overview':
      default:            return <ManagerOverview onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}

      <CompanyManagerSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        handleLogout={logout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setSidebar}
        companyName={companyName}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setSidebar(true)}>
              <Menu size={24} />
            </button>
            <div className="breadcrumb">
              Company Manager / <span className="active-breadcrumb">{activeTab.replace('-', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className="top-nav-right">
            <div className="admin-profile-pill">
              <span>{managerName}</span>
              <div className="admin-avatar">
                {user?.profilePicture ? (
                  <img src={avatarUrl(user.profilePicture)} alt="Profile" />
                ) : (
                  managerName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>
        <section className="page-content">
          {tabLoading ? <TabLoadingState label="Refreshing company data" /> : renderContent()}
        </section>
      </main>
    </div>
  );
};

// ── Overview ──────────────────────────────────────────────────────
const ManagerOverview = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManagerStats()
      .then(res => setStats(res?.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#64748b' }}>
      <Loader size={24} style={{ animation:'spin 0.8s linear infinite' }} />
      <p style={{ marginTop:'12px' }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="bento-container fade-in">
      {/* Hero */}
      <div className="bento-row main-stats">
        <div className="bento-item welcome-box">
          <div className="badge-pill">Company Portal</div>
          <h1>{greeting}, {(user?.name || 'Manager').split(' ')[0]}</h1>
          <p>Manage your interns and assign them to their industrial supervisors at <strong>{stats?.companyName || user?.companyOrg || 'your company'}</strong>.</p>
          <div className="bento-actions">
            <button className="btn-primary-lite" onClick={() => onNavigate('assignments')}>
              Manage Assignments →
            </button>
          </div>
        </div>

        {/* Unassigned alert */}
        <div className={`bento-item status-box ${stats?.unassignedInterns > 0 ? 'warning-alert' : ''}`}>
          <div className="pulse-header">
            <label>{stats?.unassignedInterns > 0 ? 'Action Required' : 'All Assigned'}</label>
            {stats?.unassignedInterns > 0 && <div className="pulse-dot" />}
          </div>
          <div className="big-stat urgent-count">
            {String(stats?.unassignedInterns || 0).padStart(2, '0')}
          </div>
          <p>Interns without a supervisor</p>
          <button
            className="alert-action-btn"
            onClick={() => onNavigate('assignments')}
            disabled={!stats?.unassignedInterns}
          >
            {stats?.unassignedInterns > 0 ? 'Assign Now' : <><Check size={14} /> All assigned</>}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="bento-grid-3">
        <div className="bento-item info-card">
          <label>Total Interns</label>
          <h2 style={{ fontSize:'2rem', margin:'8px 0 4px', fontWeight:900, color:'#1e293b' }}>
            {stats?.totalInterns || 0}
          </h2>
          <p className="sub-text">Placed at your company</p>
        </div>

        <div className="bento-item info-card">
          <label>Supervisors</label>
          <h2 style={{ fontSize:'2rem', margin:'8px 0 4px', fontWeight:900, color:'#1e293b' }}>
            {stats?.supervisorCount || 0}
          </h2>
          <p className="sub-text">Industrial supervisors registered</p>
        </div>

        <div className="bento-item info-card">
          <label>Activity This Week</label>
          <h2 style={{ fontSize:'2rem', margin:'8px 0 4px', fontWeight:900, color:'#1e293b' }}>
            {stats?.logsThisWeek || 0}
          </h2>
          <p className="sub-text">Log entries submitted</p>
          {stats?.pendingLogs > 0 && (
            <span className="badge-pill" style={{ background:'#fef3c7', color:'#92400e', marginTop:'6px', display:'inline-block' }}>
              {stats.pendingLogs} pending review
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Intern Assignments ────────────────────────────────────────────
const InternAssignments = () => {
  const [interns, setInterns]         = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');

  // Track pending assignment changes (internId -> supervisorId)
  const [changes, setChanges] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [intRes, supRes] = await Promise.all([
        getManagerInterns(),
        getManagerSupervisors(),
      ]);
      setInterns((intRes?.data || intRes || []));
      setSupervisors((supRes?.data || supRes || []));
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (internId, supervisorId) => {
    setChanges(prev => ({ ...prev, [internId]: supervisorId }));
    setSuccessMsg('');
  };

  const getCurrentSupervisor = (intern) => {
    if (changes[intern._id] !== undefined) return changes[intern._id];
    return intern.industrialSupervisor?._id || '';
  };

  const hasChanges = Object.keys(changes).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const assignments = Object.entries(changes).map(([internId, supervisorId]) => ({
        internId,
        supervisorId: supervisorId || null,
      }));
      await assignInternsToSupervisor(assignments);
      setSuccessMsg(`${assignments.length} assignment${assignments.length > 1 ? 's' : ''} saved successfully!`);
      setChanges({});
      await loadData(); // Refresh
    } catch (err) {
      setError(err.message || 'Failed to save assignments.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#64748b' }}>
      <Loader size={24} style={{ animation:'spin 0.8s linear infinite' }} />
      <p style={{ marginTop:'12px' }}>Loading assignments…</p>
    </div>
  );

  return (
    <div className="bento-container fade-in">
      {/* Header */}
      <div className="bento-item welcome-box">
        <div className="badge-pill">Assignment Management</div>
        <h3 style={{ margin:'8px 0 4px' }}>Intern — Supervisor Assignments</h3>
        <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>
          Assign each intern to their departmental industrial supervisor.
          {supervisors.length === 0 && ' No supervisors are registered at your company yet.'}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="cm-alert cm-alert-error">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="cm-alert cm-alert-success">
          <Check size={15} /> {successMsg}
        </div>
      )}

      {/* Empty state */}
      {interns.length === 0 && (
        <div className="bento-item" style={{ textAlign:'center', padding:'48px 24px', color:'#94a3b8' }}>
          <Users size={40} style={{ marginBottom:'12px', opacity:0.4 }} />
          <p style={{ fontWeight:600, color:'#64748b' }}>No interns placed yet</p>
          <p style={{ fontSize:'13px' }}>Interns will appear here once they are placed at your company.</p>
        </div>
      )}

      {/* Assignment table */}
      {interns.length > 0 && (
        <div className="cm-table-card bento-item">
          <div className="cm-table-header">
            <div className="cm-table-info">
              <span>{interns.length} intern{interns.length !== 1 ? 's' : ''}</span>
              <span className="cm-table-sep">•</span>
              <span>{supervisors.length} supervisor{supervisors.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="cm-table-actions">
              <button className="cm-refresh-btn" onClick={loadData} title="Refresh">
                <RefreshCw size={14} />
              </button>
              <button
                className={`cm-save-btn ${hasChanges ? 'cm-save-active' : ''}`}
                disabled={!hasChanges || saving}
                onClick={handleSave}
              >
                {saving ? (
                  <><Loader size={14} style={{ animation:'spin 0.8s linear infinite' }} /> Saving…</>
                ) : (
                  <><Check size={14} /> Save Changes</>
                )}
              </button>
            </div>
          </div>

          <div className="cm-table-scroll">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Index Number</th>
                  <th>Department</th>
                  <th>Assigned Supervisor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {interns.map(intern => {
                  const currentSup = getCurrentSupervisor(intern);
                  const isChanged  = changes[intern._id] !== undefined;
                  const isUnassigned = !currentSup;

                  return (
                    <tr key={intern._id} className={isChanged ? 'cm-row-changed' : ''}>
                      <td>
                        <div className="cm-intern-cell">
                          <div className="cm-intern-avatar">
                            {intern.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="cm-intern-name">{intern.name}</span>
                            <span className="cm-intern-email">{intern.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cm-index-badge">{intern.indexNumber || '—'}</span>
                      </td>
                      <td>{intern.department || '—'}</td>
                      <td>
                        <div className="cm-select-wrapper">
                          <select
                            value={currentSup}
                            onChange={e => handleChange(intern._id, e.target.value)}
                            className={`cm-select ${isUnassigned ? 'cm-select-unassigned' : ''}`}
                          >
                            <option value="">— Unassigned —</option>
                            {supervisors.map(sup => (
                              <option key={sup._id} value={sup._id}>
                                {sup.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="cm-select-icon" />
                        </div>
                      </td>
                      <td>
                        {isUnassigned ? (
                          <span className="cm-status-badge cm-status-unassigned">
                            <UserX size={11} /> Unassigned
                          </span>
                        ) : (
                          <span className="cm-status-badge cm-status-assigned">
                            <UserCheck size={11} /> Assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasChanges && (
            <div className="cm-table-footer">
              <span>{Object.keys(changes).length} unsaved change{Object.keys(changes).length > 1 ? 's' : ''}</span>
              <div style={{ display:'flex', gap:'8px' }}>
                <button
                  className="cm-cancel-btn"
                  onClick={() => { setChanges({}); setSuccessMsg(''); }}
                >
                  Discard
                </button>
                <button className="cm-save-btn cm-save-active" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save All'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Supervisors List ──────────────────────────────────────────────
const SupervisorsList = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);

  const loadSupervisors = useCallback(() => {
    setLoading(true);
    getManagerSupervisors()
      .then(res => setSupervisors(res?.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSupervisors();
  }, [loadSupervisors]);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#64748b' }}>
      <Loader size={24} style={{ animation:'spin 0.8s linear infinite' }} />
      <p style={{ marginTop:'12px' }}>Loading supervisors…</p>
    </div>
  );

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="badge-pill">Industrial Team</div>
          <h3>Company Supervisors</h3>
          <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>
            Manage the industrial supervisors registered at your company.
          </p>
        </div>
        <button className="btn-primary-lite" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add Supervisor
        </button>
      </div>

      <div className="interns-grid-bento">
        {supervisors.map(sup => (
          <div key={sup._id} className="bento-item intern-card-bento">
            <div className="intern-card-header">
              <div className="intern-avatar-med">
                {sup.name.charAt(0).toUpperCase()}
              </div>
              <div className="intern-id-tags">
                <span className="status-dot-pill active">Verified</span>
              </div>
            </div>
            <div className="intern-card-body">
              <h4 style={{ margin:0, fontSize:'16px' }}>{sup.name}</h4>
              <p className="sub-text" style={{ margin:'4px 0 10px' }}>{sup.companyOrg}</p>
              
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#64748b' }}>
                  <AlertCircle size={14} /> {sup.email}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#64748b' }}>
                  <Users size={14} /> Supervisor Role
                </div>
              </div>
            </div>
            <div style={{ padding:'16px', borderTop:'1px solid var(--gray-100)' }}>
              <button 
                className="view-details-btn" 
                style={{ width:'100%' }}
                onClick={() => setEditingSupervisor(sup)}
              >
                Manage Supervisor
              </button>
            </div>
          </div>
        ))}

        {supervisors.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#94a3b8' }}>
            <Users size={40} style={{ opacity:0.3, marginBottom:'12px' }} />
            <p>No supervisors registered yet.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddSupervisorModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => { setIsAddModalOpen(false); loadSupervisors(); }} 
        />
      )}

      {editingSupervisor && (
        <EditSupervisorModal 
          supervisor={editingSupervisor}
          onClose={() => setEditingSupervisor(null)}
          onSuccess={() => { setEditingSupervisor(null); loadSupervisors(); }}
        />
      )}
    </div>
  );
};

// ── Add Supervisor Modal ──────────────────────────────────────────
const AddSupervisorModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createManagerSupervisor(form);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create supervisor');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth:'450px' }}>
        <div className="modal-header">
          <h3 style={{ margin:0 }}>Add Industrial Supervisor</h3>
          <button className="close-x" onClick={onClose}><Plus size={18} style={{ transform:'rotate(45deg)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'20px' }}>
          {error && <div className="cm-alert cm-alert-error" style={{ marginBottom:'16px' }}>{error}</div>}
          
          <div className="input-group" style={{ marginBottom:'16px' }}>
            <label>Full Name</label>
            <input 
              type="text" 
              className="admin-input-select" 
              placeholder="e.g. John Doe"
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="input-group" style={{ marginBottom:'16px' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              className="admin-input-select" 
              placeholder="supervisor@company.com"
              required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="input-group" style={{ marginBottom:'20px' }}>
            <label>Phone Number (Optional)</label>
            <input 
              type="tel" 
              className="admin-input-select" 
              placeholder="024XXXXXXX"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>

          <div className="modal-actions" style={{ borderTop:'1px solid #f1f5f9', paddingTop:'15px', marginTop:'0' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Creating…' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Edit Supervisor Modal ─────────────────────────────────────────
const EditSupervisorModal = ({ supervisor, onClose, onSuccess }) => {
  const [form, setForm] = useState({ 
    name: supervisor.name, 
    email: supervisor.email, 
    phone: supervisor.phone || '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateManagerSupervisor(supervisor._id, form);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${supervisor.name}? They will no longer be able to log in.`)) return;
    setLoading(true);
    try {
      await deleteManagerSupervisor(supervisor._id);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to delete');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in" style={{ maxWidth:'450px' }}>
        <div className="modal-header">
          <h3 style={{ margin:0 }}>Edit Supervisor</h3>
          <button className="close-x" onClick={onClose}><Plus size={18} style={{ transform:'rotate(45deg)' }} /></button>
        </div>
        <form onSubmit={handleUpdate} style={{ padding:'20px' }}>
          {error && <div className="cm-alert cm-alert-error" style={{ marginBottom:'16px' }}>{error}</div>}
          
          <div className="input-group" style={{ marginBottom:'16px' }}>
            <label>Full Name</label>
            <input 
              type="text" 
              className="admin-input-select" 
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="input-group" style={{ marginBottom:'16px' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              className="admin-input-select" 
              required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div className="input-group" style={{ marginBottom:'20px' }}>
            <label>Phone Number</label>
            <input 
              type="tel" 
              className="admin-input-select" 
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', borderTop:'1px solid #f1f5f9', paddingTop:'15px' }}>
            <button type="button" className="cancel-btn" onClick={handleDelete} style={{ background:'#fef2f2', color:'#ef4444' }}>
              Remove Staff
            </button>
            <div style={{ display:'flex', gap:'10px' }}>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyManagerDashboard;
