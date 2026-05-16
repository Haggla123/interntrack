// src/components/admin/AdminStudentDrawer.js
import React, { useState } from 'react';
import {
  X,
  User,
  ShieldAlert,
  Key,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader,
  BookOpen,
  Tag,
  Save,
  Mail,
  Hash,
  Building2,
} from 'lucide-react';
import { resetStudentPassword, revokePlacement, deleteStudent, getStudentLogs, updateStudent, avatarUrl } from '../../api';

const AdminStudentDrawer = ({ student, onClose, onStudentUpdated, onStudentDeleted }) => {
  const [tab, setTab] = useState('actions');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [acting, setActing] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editForm, setEditForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    indexNumber: student?.indexNumber || student?.index || '',
    department: student?.department || student?.dept || '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const studentId = student?._id || student?.id;
  const isPlaced = student?.placementStatus === 'Active' || student?.status === 'Placed';
  const statusLabel = student.placementStatus || student.status || 'Pending';
  const companyName = student.companyName || (typeof student.company === 'string' ? student.company : student.company?.name) || '-';

  const flash = (type, msg) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 5000);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getStudentLogs(studentId);
      setLogs(Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewLogs = () => {
    setTab('logs');
    if (!logs.length) fetchLogs();
  };

  const handleResetPassword = async () => {
    setActing('reset');
    try {
      const res = await resetStudentPassword(studentId);
      const tempPass = res?.tempPassword || res?.data?.tempPassword;
      flash('success', tempPass ? `Password reset. Temp: ${tempPass}` : 'Password reset. Credentials sent to student.');
      if (onStudentUpdated) onStudentUpdated(studentId, { needsPasswordChange: true });
    } catch (err) {
      flash('error', err.message || 'Failed to reset password.');
    } finally {
      setActing('');
    }
  };

  const handleRevoke = async () => {
    setActing('revoke');
    try {
      await revokePlacement(studentId);
      flash('success', `Placement revoked for ${student.name}.`);
      if (onStudentUpdated) onStudentUpdated(studentId, { placementStatus: 'Unplaced', companyName: '', companyId: null, placementStartDate: null });
    } catch (err) {
      flash('error', err.message || 'Failed to revoke placement.');
    } finally {
      setActing('');
    }
  };

  const handleDelete = async () => {
    setActing('delete');
    try {
      await deleteStudent(studentId);
      if (onStudentDeleted) onStudentDeleted(studentId);
      onClose();
    } catch (err) {
      flash('error', err.message || 'Failed to delete student record.');
      setActing('');
      setConfirmDelete(false);
    }
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const res = await updateStudent(studentId, editForm);
      const updated = res?.data || res;
      flash('success', 'Student details updated.');
      if (onStudentUpdated) onStudentUpdated(studentId, updated);
    } catch (err) {
      flash('error', err.message || 'Failed to update student.');
    } finally {
      setEditSaving(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'Approved') return { color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac' };
    if (status === 'Rejected') return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5' };
    return { color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d' };
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="info-drawer open admin-theme admin-student-drawer">
        <button className="close-btn admin-student-drawer-close" onClick={onClose} aria-label="Close student manager">
          <X size={20} />
        </button>

        <div className="drawer-header-admin">
          <div className="drawer-avatar-lg">
            {student.profilePicture ? (
              <img src={avatarUrl(student.profilePicture)} alt={student.name} />
            ) : (
              (student.name || 'S').charAt(0)
            )}
          </div>
          <div className="drawer-student-summary">
            <p className="drawer-eyebrow">Student Manager</p>
            <h3>{student.name}</h3>
            <p>{student.indexNumber || student.index || 'No index'} - {student.department || student.dept || 'No department'}</p>
          </div>
          <span className={`badge-pill-${isPlaced ? 'green' : 'amber'} drawer-status-badge`}>
            {statusLabel}
          </span>
          <div className="drawer-student-meta">
            <span><Mail size={13} /> {student.email || 'No email'}</span>
            <span><Building2 size={13} /> {companyName}</span>
          </div>
        </div>

        <div className="drawer-tabs">
          {[
            ['actions', 'Actions'],
            ['edit', 'Edit'],
            ['logs', 'Logbook'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => (key === 'logs' ? handleViewLogs() : setTab(key))}
              className={tab === key ? 'active' : ''}
            >
              {label}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="drawer-feedback success">
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="drawer-feedback error">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <div className="drawer-content">
          {tab === 'actions' && (
            <>
              <div className="admin-action-grid">
                <button className="action-tile" onClick={handleResetPassword} disabled={acting === 'reset'}>
                  {acting === 'reset' ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={20} />}
                  <span>Reset Password</span>
                  <small>Issue temporary credentials</small>
                </button>
                <button className="action-tile" onClick={handleViewLogs}>
                  <ExternalLink size={20} />
                  <span>View Logs</span>
                  <small>Review submitted logbook entries</small>
                </button>
              </div>

              <div className="content-group">
                <label><ShieldAlert size={14} /> Placement Control</label>
                <div className="admin-data-card">
                  <div className="drawer-data-row"><span>Status</span><strong>{statusLabel}</strong></div>
                  <div className="drawer-data-row"><span>Company</span><strong>{companyName}</strong></div>
                  {isPlaced && (
                    <button className="btn-text-red" onClick={handleRevoke} disabled={acting === 'revoke'}>
                      {acting === 'revoke' ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Revoking...</> : 'Revoke Placement'}
                    </button>
                  )}
                </div>
              </div>

              <div className="content-group">
                <label><User size={14} /> Student Info</label>
                <div className="admin-data-card">
                  <div className="drawer-data-row"><span>Email</span><strong>{student.email || '-'}</strong></div>
                  <div className="drawer-data-row"><span>Department</span><strong>{student.department || student.dept || '-'}</strong></div>
                  <div className="drawer-data-row"><span>Index</span><strong>{student.indexNumber || student.index || '-'}</strong></div>
                </div>
              </div>

              <div className="drawer-footer-danger">
                {!confirmDelete ? (
                  <button className="btn-danger-outline" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={16} /> Delete Student Record
                  </button>
                ) : (
                  <div className="drawer-delete-confirm">
                    <p>Are you sure? This cannot be undone.</p>
                    <div>
                      <button className="btn-danger-outline" onClick={handleDelete} disabled={acting === 'delete'}>
                        {acting === 'delete' ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...</> : 'Yes, Delete'}
                      </button>
                      <button className="cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'edit' && (
            <div className="drawer-edit-panel">
              <p>Edit student account details. Changes take effect immediately.</p>
              <div className="input-group">
                <label>Full Name</label>
                <input className="admin-input-select-sm" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="admin-input-select-sm" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Index Number</label>
                <div className="drawer-input-icon">
                  <Hash size={14} />
                  <input className="admin-input-select-sm" value={editForm.indexNumber} onChange={e => setEditForm(prev => ({ ...prev, indexNumber: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label>Department</label>
                <input className="admin-input-select-sm" value={editForm.department} onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))} />
              </div>
              <button className="btn-verify-confirm drawer-save-btn" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}

          {tab === 'logs' && (
            <div className="drawer-log-panel">
              {loadingLogs && (
                <div className="drawer-empty-state">
                  <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                  <p>Loading logs...</p>
                </div>
              )}
              {!loadingLogs && logs.length === 0 && (
                <div className="drawer-empty-state">
                  <BookOpen size={36} />
                  <p>No log entries submitted yet.</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log._id || log.id} className="drawer-log-card">
                  <div className="drawer-log-card-header">
                    <strong>
                      {new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </strong>
                    <span style={statusColor(log.status)}>{log.status}</span>
                  </div>
                  <p>{log.activity}</p>
                  {log.skills && (
                    <small><Tag size={11} /> {log.skills}</small>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
};

export default AdminStudentDrawer;
