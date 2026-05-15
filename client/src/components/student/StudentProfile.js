// src/components/student/StudentProfile.js
import React, { useState, useRef } from 'react';
import {
  User, Mail, Hash, BookOpen, Building2, Camera,
  CheckCircle2, AlertCircle, Loader, Edit3, Save, X,
  ShieldCheck, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, uploadAvatar, avatarUrl } from '../../api';

// ── Small reusable field row ──────────────────────────────────────
const FieldRow = ({ icon, label, value, editable, inputEl }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '14px 0',
    borderBottom: '1px solid var(--gray-100)',
  }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: 'var(--gray-100)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: 'var(--brand-navy)',
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: '4px' }}>
        {label}
      </div>
      {editable && inputEl ? inputEl : (
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-800)', wordBreak: 'break-word' }}>
          {value || <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>Not set</span>}
        </div>
      )}
    </div>
  </div>
);

// ── Status alert ─────────────────────────────────────────────────
const Alert = ({ status }) => {
  if (!status?.msg) return null;
  const ok = status.type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
      fontWeight: 600, marginBottom: '16px',
      background: ok ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`,
      color: ok ? '#15803d' : '#dc2626',
    }}>
      {ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {status.msg}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const StudentProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  // ── Edit-info state ───────────────────────────────────────────
  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', phone: '', department: '' });
  const [saveStatus, setSaveStatus] = useState({ msg: '', type: '' });
  const [saving, setSaving]         = useState(false);

  // ── Avatar state ──────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [avatarStatus, setAvatarStatus]   = useState({ msg: '', type: '' });

  // ── Password change state ─────────────────────────────────────
  const [showPwSection, setShowPwSection] = useState(false);
  const [pw, setPw]               = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]       = useState(false);
  const [pwStatus, setPwStatus]   = useState({ msg: '', type: '' });
  const [pwSaving, setPwSaving]   = useState(false);

  const currentAvatar = avatarPreview || avatarUrl(user?.profilePicture);

  // ── Start editing ─────────────────────────────────────────────
  const startEdit = () => {
    setForm({
      name:       user?.name       || '',
      email:      user?.email      || '',
      phone:      user?.phone      || '',
      department: user?.department || '',
    });
    setSaveStatus({ msg: '', type: '' });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveStatus({ msg: '', type: '' });
  };

  // ── Save profile info ─────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveStatus({ msg: 'Name is required.', type: 'error' });
      return;
    }
    setSaving(true);
    setSaveStatus({ msg: '', type: '' });
    try {
      const res = await updateProfile(form);
      updateUser(res.user || res);
      setSaveStatus({ msg: 'Profile updated successfully!', type: 'success' });
      setEditing(false);
      await refreshUser();
    } catch (err) {
      setSaveStatus({ msg: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate local preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setAvatarStatus({ msg: '', type: '' });
    try {
      const res = await uploadAvatar(file);
      updateUser({ profilePicture: res.profilePicture });
      setAvatarStatus({ msg: 'Profile picture updated!', type: 'success' });
      // Replace preview with the real stored URL so it survives page refreshes
      setAvatarPreview(avatarUrl(res.profilePicture));
    } catch (err) {
      setAvatarStatus({ msg: err.message || 'Upload failed.', type: 'error' });
      setAvatarPreview(null); // revert preview on failure
    } finally {
      setUploading(false);
    }
  };

  // ── Change password ───────────────────────────────────────────
  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setPwStatus({ msg: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (pw.next.length < 8) {
      setPwStatus({ msg: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    setPwSaving(true);
    setPwStatus({ msg: '', type: '' });
    try {
      const { changePassword } = await import('../../api');
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPwStatus({ msg: 'Password changed successfully!', type: 'success' });
      setPw({ current: '', next: '', confirm: '' });
      setShowPwSection(false);
    } catch (err) {
      setPwStatus({ msg: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Derived display values ────────────────────────────────────
  const acSup    = user?.academicSupervisor;
  const indSup   = user?.industrialSupervisor;
  const company  = user?.companyId;
  const initials = (user?.name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 4px' }}>

      {/* ── Avatar card ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a5f 100%)',
        borderRadius: '18px', padding: '32px 28px',
        display: 'flex', alignItems: 'center', gap: '24px',
        marginBottom: '20px', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative blob */}
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            title="Click to change profile picture"
            style={{
              width: '90px', height: '90px', borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
              background: 'var(--brand-navy)',
            }}
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = ''; // Clear broken src
                  setAvatarPreview(null); // Fallback to initials
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, color: '#fff',
              }}>
                {initials}
              </div>
            )}

            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploading ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.opacity = 1)}
            onMouseLeave={e => !uploading && (e.currentTarget.style.opacity = 0)}
            >
              {uploading
                ? <Loader size={22} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                : <Camera size={22} color="#fff" />
              }
            </div>
          </div>

          {/* Upload badge */}
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            title="Change photo"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#3b82f6', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Camera size={11} color="#fff" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
            {user?.name || 'Student'}
          </div>
          <div style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.65)',
            fontFamily: 'var(--font-mono)', marginBottom: '8px',
          }}>
            {user?.indexNumber && <span>{user.indexNumber}</span>}
            {user?.indexNumber && user?.department && <span style={{ opacity: 0.5, margin: '0 8px' }}>·</span>}
            {user?.department && <span>{user.department}</span>}
          </div>
          {user?.placementStatus === 'Active' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 700, background: 'rgba(52,211,153,0.18)',
              color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              Active Placement
            </span>
          )}
        </div>
      </div>

      {/* Avatar status */}
      {avatarStatus.msg && (
        <div style={{ marginBottom: '12px' }}>
          <Alert status={avatarStatus} />
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* ── Profile info card ────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '16px', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={15} /> Personal Information
          </div>
          {!editing ? (
            <button
              onClick={startEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 13px', borderRadius: '8px', fontSize: '12px',
                fontWeight: 700, background: 'var(--gray-100)', color: 'var(--gray-700)',
                border: '1px solid var(--gray-200)', cursor: 'pointer',
              }}
            >
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={cancelEdit}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 700, background: '#fff', color: 'var(--gray-500)',
                  border: '1px solid var(--gray-200)', cursor: 'pointer',
                }}
              >
                <X size={12} /> Cancel
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} style={{ padding: '4px 20px 16px' }}>
          <Alert status={saveStatus} />

          <FieldRow
            icon={<User size={16} />}
            label="Full Name"
            value={user?.name}
            editable={editing}
            inputEl={
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--gray-200)', fontSize: '14px',
                  fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="Your full name"
                required
              />
            }
          />

          <FieldRow
            icon={<Mail size={16} />}
            label="Email Address"
            value={user?.email}
            editable={editing}
            inputEl={
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--gray-200)', fontSize: '14px',
                  fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="your@email.com"
              />
            }
          />

          <FieldRow
            icon={<Hash size={16} />}
            label="Index Number"
            value={user?.indexNumber}
            editable={false}  // immutable — always read-only
          />

          <FieldRow
            icon={<BookOpen size={16} />}
            label="Department"
            value={user?.department}
            editable={editing}
            inputEl={
              <input
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--gray-200)', fontSize: '14px',
                  fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="e.g. Computer Science"
              />
            }
          />

          <FieldRow
            icon={<Hash size={16} />}
            label="Phone Number"
            value={user?.phone}
            editable={editing}
            inputEl={
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--gray-200)', fontSize: '14px',
                  fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                }}
                placeholder="e.g. 0244123456"
              />
            }
          />

          {editing && (
            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 22px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 700, background: 'var(--brand-navy)', color: '#fff',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                : <><Save size={14} /> Save Changes</>
              }
            </button>
          )}
        </form>
      </div>

      {/* ── Placement / supervisors card ──────────────────────── */}
      {(user?.companyId || user?.academicSupervisor || user?.industrialSupervisor) && (
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid var(--gray-200)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
            fontWeight: 700, fontSize: '14px', color: 'var(--gray-800)',
          }}>
            <Building2 size={15} /> Placement Details
          </div>
          <div style={{ padding: '4px 20px 16px' }}>
            {company && (
              <FieldRow icon={<Building2 size={16} />} label="Host Company" value={company?.name || user?.companyName} />
            )}
            {acSup && (
              <FieldRow
                icon={<User size={16} />}
                label="Academic Supervisor"
                value={`${acSup.name}${acSup.department ? ` · ${acSup.department}` : ''}`}
              />
            )}
            {indSup && (
              <FieldRow
                icon={<User size={16} />}
                label="Industrial Supervisor"
                value={`${indSup.name}${indSup.companyOrg ? ` · ${indSup.companyOrg}` : ''}`}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Password section ──────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '20px',
      }}>
        <div
          onClick={() => { setShowPwSection(s => !s); setPwStatus({ msg: '', type: '' }); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: showPwSection ? '1px solid var(--gray-100)' : 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} /> Security &amp; Password
          </div>
          <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>
            {showPwSection ? 'Collapse ▲' : 'Change Password ▼'}
          </span>
        </div>

        {showPwSection && (
          <form onSubmit={handlePwChange} style={{ padding: '16px 20px' }}>
            <Alert status={pwStatus} />

            {[
              { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'next',    label: 'New Password',     placeholder: 'At least 8 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '5px' }}>
                  {f.label}
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw[f.key]}
                  onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1.5px solid var(--gray-200)', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <div
              onClick={() => setShowPw(s => !s)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '14px' }}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPw ? 'Hide' : 'Show'} passwords
            </div>

            <button
              type="submit"
              disabled={pwSaving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 22px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 700, background: '#0f172a', color: '#fff',
                border: 'none', cursor: pwSaving ? 'not-allowed' : 'pointer',
                opacity: pwSaving ? 0.7 : 1,
              }}
            >
              {pwSaving
                ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…</>
                : <><ShieldCheck size={14} /> Update Password</>
              }
            </button>
          </form>
        )}
      </div>

      {/* ── Account info (read-only meta) ─────────────────────── */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'var(--gray-50, #f8fafc)',
        border: '1px solid var(--gray-100)',
        fontSize: '12px', color: 'var(--gray-400)',
        display: 'flex', gap: '20px', flexWrap: 'wrap',
      }}>
        <span>Role: <strong style={{ color: 'var(--gray-600)' }}>Student</strong></span>
        {user?.createdAt && (
          <span>
            Member since:{' '}
            <strong style={{ color: 'var(--gray-600)' }}>
              {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </strong>
          </span>
        )}
        <span>Status: <strong style={{ color: user?.placementStatus === 'Active' ? '#15803d' : 'var(--gray-600)' }}>{user?.placementStatus || 'Unplaced'}</strong></span>
      </div>
    </div>
  );
};

export default StudentProfile;
