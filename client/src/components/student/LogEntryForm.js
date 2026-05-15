// src/components/student/LogEntryForm.js
import React, { useState, useEffect } from 'react';
import {
  Send, Lock, CheckCircle2, AlertCircle, Loader,
  Calendar, Briefcase, MessageSquare, ChevronDown,
  Wrench, ClipboardList, GraduationCap, Handshake, HardHat, Pin, CircleSlash,
} from 'lucide-react';
import './LogEntryForm.css';
import { submitLog, getMyLogs, getSettings } from '../../api';


// Group icon + color map
const GROUP_META = {
  'Technical Tasks':         { Icon: Wrench, check: '#f59e0b', selBg: '#fffbeb', selBorder: '#fbbf24', headerBg: '#fef3c7' },
  'Office & Admin':          { Icon: ClipboardList, check: '#ec4899', selBg: '#fdf2f8', selBorder: '#f9a8d4', headerBg: '#fce7f3' },
  'Learning & Development':  { Icon: GraduationCap, check: '#10b981', selBg: '#ecfdf5', selBorder: '#6ee7b7', headerBg: '#d1fae5' },
  'Collaboration':           { Icon: Handshake, check: '#6366f1', selBg: '#eef2ff', selBorder: '#a5b4fc', headerBg: '#e0e7ff' },
  'Field Work':              { Icon: HardHat, check: '#f97316', selBg: '#fff7ed', selBorder: '#fdba74', headerBg: '#ffedd5' },
};
const DEFAULT_GROUP_META = { Icon: Pin, check: '#3b82f6', selBg: '#eff6ff', selBorder: '#93c5fd', headerBg: '#dbeafe' };

const LogEntryForm = ({ isLocationVerified, canSubmitLogs = true }) => {
  const [categories,       setCategories]       = useState([]);
  const [selected,         setSelected]         = useState(new Set());
  const [notes,            setNotes]            = useState('');
  const [status,           setStatus]           = useState('idle');
  const [errorMsg,         setErrorMsg]         = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingToday,    setCheckingToday]    = useState(true);
  const [loadingCats,      setLoadingCats]      = useState(true);
  const [toast,            setToast]            = useState('');

  // read from both storages — "Don't Remember Me" sessions use sessionStorage
  const placement = (() => {
    try {
      const raw = localStorage.getItem('studentPlacement') || sessionStorage.getItem('studentPlacement');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const now       = new Date();
  const dateStr   = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Load activity categories from settings
  useEffect(() => {
    getSettings()
      .then(res => {
        const data = res?.data || res || {};
        const cats = data.activityCategories || [];
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  // Check if already submitted today
  useEffect(() => {
    const check = async () => {
      try {
        const res  = await getMyLogs();
        const logs = res?.data || res || [];
        const today = new Date().toDateString();
        setAlreadySubmitted(logs.some(l => new Date(l.date).toDateString() === today));
      } catch { /* backend will guard */ }
      finally { setCheckingToday(false); }
    };
    check();
  }, [status]);

  const isLocked  = alreadySubmitted;
  const canSubmit = !isLocked && canSubmitLogs && isLocationVerified &&
                    selected.size > 0 &&
                    status !== 'submitting';

  const toggleActivity = (key) => {
    if (!canSubmitLogs) {
      setToast('You have not been assigned supervisors yet.');
      setTimeout(() => setToast(''), 4200);
      return;
    }
    if (isLocked || !isLocationVerified || status === 'submitting' || checkingToday) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      await submitLog({
        activities:  Array.from(selected),
        notes:       notes.trim(),
        companyName: placement?.companyName || '',
        companyId:   placement?.companyId   || null,
      });
      setStatus('success');
      setSelected(new Set());
      setNotes('');
      setAlreadySubmitted(true);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to submit. Please try again.');
    }
  };

  // Group categories
  const grouped = {};
  categories.forEach(cat => {
    if (!grouped[cat.group]) grouped[cat.group] = [];
    grouped[cat.group].push(cat);
  });

  // State-derived UI tokens
  const locLabel = isLocationVerified ? 'On-site' : 'Off-site';
  const locColor = isLocationVerified ? '#10b981' : '#f59e0b';
  const locBg    = isLocationVerified ? '#f0fdf4' : '#fffbeb';
  const locBorder= isLocationVerified ? '#86efac' : '#fde68a';

  const subLabel = alreadySubmitted ? 'Submitted today' : 'Open for today';
  const subColor = alreadySubmitted ? '#10b981' : '#3b82f6';

  return (
    <div className="dlf-root fade-in">
      {toast && (
        <div style={{
          position:'fixed', top:'18px', right:'18px', zIndex:3000,
          display:'flex', alignItems:'center', gap:'10px',
          maxWidth:'340px', padding:'12px 16px',
          background:'#fffbeb', border:'1px solid #fcd34d',
          borderRadius:'12px', boxShadow:'0 16px 36px rgba(15,23,42,0.18)',
          color:'#92400e', fontSize:'13px', fontWeight:700,
        }}>
          <AlertCircle size={16} />
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast('')}
            style={{ marginLeft:'auto', border:0, background:'transparent', color:'inherit', cursor:'pointer', fontSize:'16px', lineHeight:1 }}
          >
            x
          </button>
        </div>
      )}

      {/* ── Date / context header ── */}
      <div className="dlf-header">
        <div className="dlf-header-left">
          <div className="dlf-date-badge">
            <Calendar size={13} />
            <span>{dateStr}</span>
          </div>
          {placement?.companyName && (
            <div className="dlf-company-tag">
              <Briefcase size={12} />
              <span>{placement.companyName}</span>
            </div>
          )}
        </div>

        <div className="dlf-status-chips">
          {/* Location chip */}
          <div className="dlf-chip" style={{ background: locBg, borderColor: locBorder, color: locColor }}>
            <span className="dlf-chip-dot" style={{ background: locColor }} />
            {isLocationVerified ? <CheckCircle2 size={13} /> : <CircleSlash size={13} />} {locLabel}
          </div>
          {/* Submission chip */}
          <div className="dlf-chip" style={{
            background: alreadySubmitted ? '#f0fdf4' : '#eff6ff',
            borderColor: alreadySubmitted ? '#86efac' : '#bfdbfe',
            color: subColor,
          }}>
            <span className="dlf-chip-dot" style={{ background: subColor }} />
            {subLabel}
          </div>
        </div>
      </div>

      {alreadySubmitted && status !== 'success' && (
        <div className="dlf-banner dlf-banner-green">
          <CheckCircle2 size={16} />
          <div>
            <strong>Today's log submitted!</strong>
            <p>Your supervisor will review it shortly. See you tomorrow.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="dlf-banner dlf-banner-green">
          <CheckCircle2 size={16} />
          <div>
            <strong>Entry submitted successfully</strong>
            <p>Your logbook has been updated and sent for review.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="dlf-banner dlf-banner-red">
          <AlertCircle size={16} />
          <div>
            <strong>Submission failed</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── Main form card ── */}
      <div className="dlf-card">

        {/* Activity checklist section */}
        <div className="dlf-section">
          <div className="dlf-section-head">
            <div>
              <div className="dlf-section-label">What did you work on today?</div>
              <div className="dlf-section-sub">Select all activities that apply</div>
            </div>
            <div className="dlf-selected-count" data-active={selected.size > 0 ? 'true' : 'false'}>
              {selected.size} selected
            </div>
          </div>

          {loadingCats ? (
            <div className="dlf-loading-cats">
              <Loader size={18} className="dlf-spin" />
              <span>Loading activities…</span>
            </div>
          ) : (
            <div className="dlf-activity-groups">
              {Object.entries(grouped).map(([groupName, items]) => {
                const meta = GROUP_META[groupName] || DEFAULT_GROUP_META;
                return (
                  <ActivityGroup
                    key={groupName}
                    groupName={groupName}
                    colorMeta={meta}
                    items={items}
                    selected={selected}
                    onToggle={toggleActivity}
                    disabled={isLocked || !isLocationVerified || status === 'submitting' || checkingToday}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="dlf-divider" />

        {/* Notes section */}
        <div className="dlf-section">
          <div className="dlf-section-label" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <MessageSquare size={13} /> Additional Notes
            <span className="dlf-optional-tag">optional</span>
          </div>
          <input
            type="text"
            className="dlf-input"
            placeholder="e.g. Worked on the inventory API with Mr. Kofi, debugged payment timeout…"
            value={notes}
            maxLength={300}
            onChange={e => setNotes(e.target.value)}
            disabled={isLocked || !canSubmitLogs || !isLocationVerified || status === 'submitting' || checkingToday}
          />
          {notes.length > 0 && (
            <p className="dlf-notes-count">{notes.length}/300</p>
          )}
        </div>

        {/* Divider */}
        <div className="dlf-divider" />

        {/* Submit footer */}
        <div className="dlf-footer">
          <div className="dlf-footer-hint">
            {!isLocationVerified && !alreadySubmitted && (
              <span className="dlf-footer-warn">Verify your location above before submitting</span>
            )}
            {canSubmitLogs && isLocationVerified && !isLocked && selected.size === 0 && (
              <span className="dlf-footer-warn">Select at least one activity</span>
            )}
            {canSubmit && (
              <span className="dlf-footer-ready">
                <CheckCircle2 size={12} style={{ display:'inline', marginRight:'4px' }} />
                Ready to submit
              </span>
            )}
          </div>

          <button
            className={`dlf-submit-btn ${canSubmit ? 'dlf-submit-ready' : ''}`}
            disabled={!canSubmit || checkingToday}
            onClick={handleSubmit}
          >
            {checkingToday
              ? <><Loader size={16} className="dlf-spin" /> Checking…</>
              : status === 'submitting'
              ? <><Loader size={16} className="dlf-spin" /> Submitting…</>
              : isLocked
              ? <><Lock size={16} /> Locked</>
              : !canSubmitLogs
              ? <><Lock size={16} /> Awaiting Assignment</>
              : <><Send size={16} /> Submit Entry</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Activity Group sub-component ──────────────────────────────────
const ActivityGroup = ({ groupName, colorMeta, items, selected, onToggle, disabled }) => {
  const [collapsed, setCollapsed] = useState(false);
  const selectedInGroup = items.filter(i => selected.has(i.key)).length;
  const cm = colorMeta || DEFAULT_GROUP_META;
  const Icon = cm.Icon || Pin;

  return (
    <div className="dlf-act-group" style={{ borderColor: selectedInGroup > 0 ? cm.selBorder : undefined }}>
      <button
        className="dlf-act-group-header"
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        style={{ background: cm.headerBg }}
      >
        <div className="dlf-act-group-left">
          <span className="dlf-act-group-icon"><Icon size={14} /></span>
          <span className="dlf-act-group-name">{groupName}</span>
          {selectedInGroup > 0 && (
            <span className="dlf-act-group-count" style={{ background: cm.check }}>{selectedInGroup}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`dlf-act-chevron ${collapsed ? '' : 'dlf-act-chevron-open'}`}
        />
      </button>

      {!collapsed && (
        <div className="dlf-act-items">
          {items.map(item => {
            const isSelected = selected.has(item.key);
            return (
              <button
                key={item.key}
                type="button"
                className={`dlf-act-item ${isSelected ? 'dlf-act-item-selected' : ''}`}
                disabled={disabled}
                onClick={() => onToggle(item.key)}
                style={isSelected ? { borderColor: cm.selBorder, background: cm.selBg, boxShadow: `0 0 0 2px ${cm.selBorder}22` } : {}}
              >
                <span
                  className={`dlf-act-check ${isSelected ? 'dlf-act-check-on' : ''}`}
                  style={isSelected ? { borderColor: cm.check, background: cm.check } : {}}
                >
                  {isSelected && <CheckCircle2 size={14} />}
                </span>
                <span className="dlf-act-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogEntryForm;
