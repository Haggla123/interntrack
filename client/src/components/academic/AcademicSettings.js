import React, { useRef, useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, RefreshCcw, Info, AlertCircle, CheckCircle2, Camera, Loader } from 'lucide-react';
import { usePasswordChange } from '../../hooks/usePasswordChange';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar, avatarUrl } from '../../api';

const AcademicSettings = ({ handleLogout }) => {
  const { user, updateUser } = useAuth();
  const { fields, set, showPass, setShowPass, saving, status, submit } = usePasswordChange();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState({ msg: '', type: '' });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarStatus({ msg: 'Image too large (max 2MB)', type: 'error' });
      return;
    }

    setUploading(true);
    setAvatarStatus({ msg: '', type: '' });

    try {
      const res = await uploadAvatar(file);
      updateUser({ profilePicture: res.profilePicture });
      setAvatarStatus({ msg: 'Profile picture updated!', type: 'success' });
    } catch (err) {
      setAvatarStatus({ msg: err.message || 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box academic-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="badge-pill">Faculty Security</div>
          <h2>Settings & Privacy</h2>
          <p>Manage your university credentials and active supervisor session.</p>
        </div>
        
        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              border: '3px solid rgba(255,255,255,0.3)', position: 'relative', 
              cursor: 'pointer', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' 
            }}
          >
            {user?.profilePicture ? (
              <img src={avatarUrl(user.profilePicture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 800 }}>
                {initials}
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => !uploading && (e.currentTarget.style.opacity = 1)}
              onMouseLeave={e => !uploading && (e.currentTarget.style.opacity = 0)}
            >
              {uploading ? <Loader size={20} className="spin" color="#fff" /> : <Camera size={20} color="#fff" />}
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          {avatarStatus.msg && (
            <span style={{ fontSize: '10px', color: avatarStatus.type === 'success' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
              {avatarStatus.msg}
            </span>
          )}
        </div>
      </div>

      <div className="settings-layout">
        {/* Password form */}
        <div className="bento-item security-card">
          <div className="card-header-flex">
            <h3><ShieldCheck size={20} color="#1e1b4b" /> Update Authentication</h3>
          </div>

          {status.msg && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border:`1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius:'8px', color: status.type === 'success' ? '#15803d' : '#dc2626', fontSize:'13px', marginBottom:'14px' }}>
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.msg}
            </div>
          )}

          <form onSubmit={submit} className="settings-form">
            <div className="form-group">
              <label>Current Faculty Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="bento-input"
                placeholder="Enter current password"
                value={fields.current}
                onChange={(e) => set('current', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="bento-input"
                  placeholder="At least 8 characters"
                  value={fields.next}
                  onChange={(e) => set('next', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="bento-input"
                  placeholder="Re-type new password"
                  value={fields.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="settings-actions-row">
              <div className="show-password-toggle" onClick={() => setShowPass(!showPass)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#64748b' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showPass ? 'Hide' : 'Show'} Passwords</span>
              </div>
            </div>

            <button type="submit" className="univ-btn save-btn" disabled={saving}>
              {saving ? <RefreshCcw size={18} className="spin" /> : <Lock size={18} />}
              {saving ? 'Updating…' : 'Update Faculty Credentials'}
            </button>
          </form>

          {/* Logout */}
          <div style={{ marginTop:'24px', paddingTop:'16px', borderTop:'1px solid #f1f5f9' }}>
            <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'6px', color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>
              Sign Out of Faculty Portal
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="bento-item info-card notice-card">
          <div className="card-header-flex">
            <h3><Info size={18} color="#1768ac" /> Faculty Guidelines</h3>
          </div>
          <p>Keeping your supervisor account secure protects student data integrity.</p>
          <ul className="guideline-list">
            <li>Passwords are encrypted via <strong>bcrypt</strong> before storage.</li>
            <li>Changing your password will invalidate all other active sessions.</li>
            <li>Use a mix of uppercase letters, numbers, and symbols.</li>
            <li>Minimum 8 characters required.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AcademicSettings;
