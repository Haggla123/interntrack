import React, { useState, useEffect } from 'react';
import { Building2, MapPin, CheckCircle2, AlertCircle, User, Phone, Mail } from 'lucide-react';
import { getCompanies, applyForSlot } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AvailablePlacements = ({ onPlacementAccepted }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [applying,  setApplying]  = useState(null);
  const [accepted,  setAccepted]  = useState(null);
  const [acceptedPlacement, setAcceptedPlacement] = useState(null);
  const [toast,     setToast]     = useState({ text: '', type: '' });

  const flash = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 4500);
  };

  const existingPlacement = (() => {
    try {
      const raw = localStorage.getItem('studentPlacement') || sessionStorage.getItem('studentPlacement');
      const stored = raw ? JSON.parse(raw) : null;
      if (stored && user?._id && stored._userId && stored._userId !== user._id) return null;
      return stored;
    } catch { return null; }
  })();

  useEffect(() => {
    getCompanies()
      .then(res => {
        const arr = Array.isArray(res) ? res
          : Array.isArray(res.data) ? res.data
          : Array.isArray(res.companies) ? res.companies
          : [];
        setCompanies(arr);
      })
      .catch(() => setError('Could not load placements. Please make sure you are logged in.'))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (company) => {
    const companyId = company._id || company.id;
    setApplying(companyId);
    setError('');

    try {
      const res     = await applyForSlot(companyId);
      const updated = res.data || res;

      // Update the slot count from the real server response
      setCompanies(prev =>
        prev.map(c => (c._id || c.id) === companyId ? { ...c, slots: updated.slots } : c)
      );

      // Build the placement object from the company data
      const placement = {
        _userId:          user?._id,
        companyId,
        companyName:     company.name,
        location:        company.location,
        category:        company.category,
        lat:             company.lat    || null,
        long:            company.long   || null,
        radius:          company.radius || 150,
        supervisorName:  company.supervisorName  || '',
        supervisorEmail: company.supervisorEmail || '',
        supervisorPhone: company.supervisorPhone || '',
        acceptedAt:      new Date().toISOString(),
      };

      // write studentPlacement to whichever storage holds the active session.
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('studentPlacement', JSON.stringify(placement));
      setAccepted(company);
      setAcceptedPlacement(placement);
      flash(`${company.name} placement confirmed. Slot count updated.`);
      if (onPlacementAccepted) onPlacementAccepted(placement);

    } catch (err) {
      // Show the error — do NOT confirm the placement
      const message = err.message || 'Could not apply. Please try again.';
      setError(message);
      flash(message, 'error');
    } finally {
      setApplying(null);
    }
  };

  // ── Already placed ──────────────────────────────────────────────
  if (existingPlacement && !accepted) {
    return (
      <div className="bento-container fade-in">
        <div className="bento-item welcome-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
          <div className="badge-pill" style={{ background: '#d1fae5', color: '#065f46' }}>Placement Confirmed</div>
          <h3 style={{ marginTop: '12px' }}>{existingPlacement.companyName}</h3>
          <p style={{ color: '#ffffff', marginTop: '4px' }}>
            <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {existingPlacement.location} • {existingPlacement.category}
          </p>
          {existingPlacement.supervisorName && (
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#ffffff' }}>
              <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Supervisor: <strong>{existingPlacement.supervisorName}</strong>
            </p>
          )}
          <button
            className="btn-approve-full"
            style={{ marginTop: '20px', padding: '10px 28px' }}
            onClick={() => onPlacementAccepted && onPlacementAccepted(existingPlacement)}
          >
            Go to Daily Log →
          </button>
        </div>
      </div>
    );
  }

  // ── Just accepted ───────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="bento-container fade-in">
        <div className="bento-item welcome-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CheckCircle2 size={52} style={{ color: '#10b981', marginBottom: '16px' }} />
          <div className="badge-pill" style={{ background: '#d1fae5', color: '#065f46' }}>You're In!</div>
          <h3 style={{ marginTop: '12px' }}>Placement Confirmed</h3>
          <h4 style={{ color: '#3b82f6', marginTop: '6px' }}>{accepted.name}</h4>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {accepted.location} • {accepted.category}
          </p>
          {accepted.supervisorName && (
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>
              <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Your Supervisor: <strong>{accepted.supervisorName}</strong>
            </p>
          )}
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
            Your logbook is now unlocked. Start logging your daily work.
          </p>
          <button
            className="btn-approve-full"
            style={{ marginTop: '20px', padding: '12px 32px', fontSize: '15px' }}
            onClick={() => onPlacementAccepted && onPlacementAccepted(acceptedPlacement)}
          >
            Go to Daily Log →
          </button>
        </div>
      </div>
    );
  }

  // ── Market listing ──────────────────────────────────────────────
  return (
    <div className="bento-container fade-in">
      {toast.text && (
        <div style={{
          position:'fixed', top:'18px', right:'18px', zIndex:3000,
          display:'flex', alignItems:'center', gap:'10px',
          maxWidth:'360px', padding:'12px 16px',
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border:`1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
          borderRadius:'12px', boxShadow:'0 16px 36px rgba(15,23,42,0.18)',
          color: toast.type === 'error' ? '#dc2626' : '#15803d',
          fontSize:'13px', fontWeight:700,
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast({ text:'', type:'' })}
            style={{ marginLeft:'auto', border:0, background:'transparent', color:'inherit', cursor:'pointer', fontSize:'16px', lineHeight:1 }}
          >
            x
          </button>
        </div>
      )}
      <div className="bento-item welcome-box">
        <div className="badge-pill">University Market</div>
        <h3>Available Internship Slots</h3>
        <p>Select a company — your placement is confirmed instantly upon applying.</p>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'14px 16px', color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', margin:'10px 0', fontSize:'14px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'40px', color:'#64748b' }}>
          <p>Loading available placements…</p>
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>
          <Building2 size={40} style={{ marginBottom:'10px', opacity:0.4 }} />
          <p>No partner companies listed yet. Check back soon.</p>
        </div>
      )}

      <div className="interns-grid-bento">
        {companies.map(company => {
          const id        = company._id || company.id;
          const slots     = Number(company.slots) ?? 0;
          const isApplying = applying === id;

          return (
            <div key={id} className="bento-item intern-card-bento">
              <div className="intern-card-header">
                <div className="intern-avatar-med"><Building2 size={24} /></div>
                <div className="intern-id-tags">
                  <span className={`status-dot-pill ${slots > 0 ? 'active' : 'status-filled'}`}>
                    {slots > 0 ? `${slots} Slots Left` : 'All Slots Filled'}
                  </span>
                </div>
              </div>

              <div className="intern-card-body">
                <h4>{company.name}</h4>
                <p className="sub-text">
                  <MapPin size={12} /> {company.location} • {company.category}
                </p>

                {company.supervisorName && (
                  <div style={{ marginTop:'8px', padding:'8px', background:'#f8fafc', borderRadius:'6px', fontSize:'12px' }}>
                    <p style={{ margin:'2px 0', color:'#475569' }}>
                      <User size={11} style={{ display:'inline', marginRight:'3px' }} />
                      {company.supervisorName}
                    </p>
                    {company.supervisorPhone && (
                      <p style={{ margin:'2px 0', color:'#64748b' }}>
                        <Phone size={11} style={{ display:'inline', marginRight:'3px' }} />
                        {company.supervisorPhone}
                      </p>
                    )}
                    {company.supervisorEmail && (
                      <p style={{ margin:'2px 0', color:'#64748b' }}>
                        <Mail size={11} style={{ display:'inline', marginRight:'3px' }} />
                        {company.supervisorEmail}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                className={slots > 0 ? 'btn-approve-full' : 'btn-disabled-market'}
                disabled={slots === 0 || isApplying}
                style={{ width:'100%', marginTop:'12px' }}
                onClick={() => slots > 0 && !isApplying && handleApply(company)}
              >
                {isApplying ? 'Confirming…' : slots > 0 ? 'Apply & Get Placed' : 'Locked / Filled'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailablePlacements;
