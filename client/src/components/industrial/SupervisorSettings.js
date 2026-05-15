import React, { useRef, useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader, Camera } from 'lucide-react';
import { usePasswordChange } from '../../hooks/usePasswordChange';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar, avatarUrl } from '../../api';

const SupervisorSettings = () => {
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

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S';

  return (
    <div className="bento-container fade-in">
      <div className="bento-item welcome-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="badge-pill">Security & Privacy</div>
          <h3>Account Settings</h3>
          <p>Manage your access credentials for the {new Date().getFullYear()} internship cycle.</p>
        </div>

        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{ 
              width: '70px', height: '70px', borderRadius: '50%', 
              border: '3px solid rgba(255,255,255,0.2)', position: 'relative', 
              cursor: 'pointer', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' 
            }}
          >
            {user?.profilePicture ? (
              <img src={avatarUrl(user.profilePicture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 800 }}>
                {initials}
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 1 : 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => !uploading && (e.currentTarget.style.opacity = 1)}
              onMouseLeave={e => !uploading && (e.currentTarget.style.opacity = 0)}
            >
              {uploading ? <Loader size={18} className="spin" color="#fff" /> : <Camera size={18} color="#fff" />}
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

      <div className="bento-item settings-form-box" style={{ maxWidth:'500px' }}>

        {status.msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border:`1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius:'8px', color: status.type === 'success' ? '#15803d' : '#dc2626', fontSize:'13px', marginBottom:'16px' }}>
            {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {status.msg}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-section">
            <label className="input-label-sm">Current Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.current}
              onChange={(e) => set('current', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-section" style={{ marginTop:'20px' }}>
            <label className="input-label-sm">New Corporate Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.next}
              onChange={(e) => set('next', e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="form-section" style={{ marginTop:'20px' }}>
            <label className="input-label-sm">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="corporate-input-sm"
              value={fields.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div
            onClick={() => setShowPass(!showPass)}
            style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b', marginTop:'10px' }}
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPass ? 'Hide' : 'Show'} passwords
          </div>

          <button
            type="submit"
            className="btn-primary-lite"
            style={{ marginTop:'25px', width:'100%' }}
            disabled={saving}
          >
            {saving
              ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }} /> Updating…</>
              : <><Lock size={16} /> Update Supervisor Credentials</>}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupervisorSettings;
