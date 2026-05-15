// src/components/ChangePasswordModal.js
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { changePassword } from '../api';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = ({ isOpen, onDone }) => {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const rules = [
    { label: 'At least 8 characters', pass: form.next.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(form.next) },
    { label: 'Passwords match', pass: form.next.length > 0 && form.next === form.confirm },
  ];
  const allPass = rules.every(rule => rule.pass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allPass) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      updateUser({ needsPasswordChange: false });
      setSuccess(true);
      setTimeout(() => onDone(), 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal-card scale-in">
        <div className="password-modal-glow" />

        <div className="password-modal-header">
          <div className="password-modal-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="password-modal-kicker">Account security</span>
            <h3>Set Your Password</h3>
            <p>You're using a temporary password. Create a permanent one to continue safely.</p>
          </div>
        </div>

        {success ? (
          <div className="password-success-state">
            <div className="password-success-icon">
              <CheckCircle2 size={44} />
            </div>
            <Sparkles size={18} className="password-success-sparkle" />
            <h4>Password updated</h4>
            <p>Redirecting you to your portal...</p>
          </div>
        ) : (
          <form className="password-modal-form" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="password-modal-alert">
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            {[
              { name: 'current', label: 'Temporary Password' },
              { name: 'next', label: 'New Password' },
              { name: 'confirm', label: 'Confirm New Password' },
            ].map(({ name, label }) => (
              <div key={name} className="password-field">
                <label>{label}</label>
                <div className="password-input-wrap">
                  <Lock size={15} />
                  <input
                    type={show[name] ? 'text' : 'password'}
                    name={name}
                    value={form[name]}
                    onChange={handle}
                    required
                  />
                  <button type="button" onClick={() => toggleShow(name)} aria-label={`Toggle ${label}`}>
                    {show[name] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {form.next && (
              <div className="password-rule-card">
                {rules.map((rule) => (
                  <div key={rule.label} className={rule.pass ? 'pass' : ''}>
                    <CheckCircle2 size={14} />
                    {rule.label}
                  </div>
                ))}
              </div>
            )}

            <button className="password-submit-btn" type="submit" disabled={!allPass || loading}>
              {loading ? 'Saving...' : 'Set New Password & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
