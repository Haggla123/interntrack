import React from 'react';
import { BarChart3, UserCheck, Users, Settings, LogOut, X, Building2 } from 'lucide-react';

const CompanyManagerSidebar = ({ activeTab, setActiveTab, handleLogout, isSidebarOpen, setIsSidebarOpen, companyName }) => {
  const oversightItems = [
    { id: 'overview',    label: 'Overview',      icon: <BarChart3 size={20} /> },
    { id: 'assignments', label: 'Assignments',   icon: <UserCheck size={20} /> },
    { id: 'supervisors', label: 'Supervisors',   icon: <Users size={20} /> },
  ];

  const supervisionItems = [
    { id: 'approvals',   label: 'Logbook Queue', icon: <UserCheck size={20} /> },
    { id: 'my-interns',  label: 'My Interns',    icon: <Users size={20} /> },
  ];

  const bottomItems = [
    { id: 'settings',    label: 'Settings',      icon: <Settings size={20} /> },
  ];

  const getNavStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px',
    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
  });

  return (
    <aside className={`sidebar cm-sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#06bee1" />
            <div className="brand-text">
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>InternTrack</span>
              <small style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {companyName || 'Company Manager'}
              </small>
            </div>
          </div>
          
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', padding: '0 12px', marginBottom: '10px' }}>
              Corporate Oversight
            </label>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {oversightItems.map((item) => (
                <li 
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''} 
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  style={getNavStyle(activeTab === item.id)}
                >
                  {item.icon} 
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-group" style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', padding: '0 12px', marginBottom: '10px' }}>
              Direct Supervision
            </label>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {supervisionItems.map((item) => (
                <li 
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''} 
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  style={getNavStyle(activeTab === item.id)}
                >
                  {item.icon} 
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-group" style={{ marginTop: '24px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {bottomItems.map((item) => (
                <li 
                  key={item.id}
                  className={activeTab === item.id ? 'active' : ''} 
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  style={getNavStyle(activeTab === item.id)}
                >
                  {item.icon} 
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          className="logout-action-btn" 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <LogOut size={18} /> 
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default CompanyManagerSidebar;
