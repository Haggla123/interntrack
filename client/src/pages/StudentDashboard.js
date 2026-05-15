import React, { useState, useEffect, useCallback } from 'react';
import { Menu, MapPin, BookOpen, CheckCircle2, AlertCircle, Phone, Mail, Lock, Send } from 'lucide-react';
import { getMyLogs } from '../api';
import * as api from '../api';
import { avatarUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import StudentSidebar from '../components/student/StudentSidebar';
import LogEntryForm from '../components/student/LogEntryForm';
import LogbookHistory from '../components/student/LogbookHistory';
import LocationStatus from '../components/student/LocationStatus';
import StudentSettings from '../components/student/StudentSettings';
import StudentProfile from '../components/student/StudentProfile';
import AvailablePlacements from '../components/student/AvailablePlacements';
import AttachmentLetters from '../components/student/AttachmentLetters';
import FinalReport from '../components/student/FinalReport';
import TabLoadingState from '../components/common/TabLoadingState';
import '../styles/StudentDashboard.css';

const getPlacement = (userId) => {
  try {
    const raw = localStorage.getItem('studentPlacement') || sessionStorage.getItem('studentPlacement');
    const stored = raw ? JSON.parse(raw) : null;
    // Ignore stale placement from a different user session
    if (stored && userId && stored._userId && stored._userId !== userId) {
      localStorage.removeItem('studentPlacement');
      sessionStorage.removeItem('studentPlacement');
      return null;
    }
    return stored;
  } catch { return null; }
};

const getCompanyId = (companyId) => {
  if (!companyId) return null;
  if (typeof companyId === 'string') return companyId;
  return companyId._id || companyId.id || null;
};

const isStudentPlaced = (user, savedPlacement = null) => {
  if (!user && !savedPlacement) return false;
  if (savedPlacement) return true;

  const statusPlaced = user?.placementStatus === 'Active' || user?.status === 'Placed';
  return statusPlaced && Boolean(getCompanyId(user?.companyId) || user?.companyName);
};

const buildPlacementFromUser = (user) => {
  if (!isStudentPlaced(user)) return null;
  return {
    _userId: user._id,
    companyId: getCompanyId(user.companyId),
    companyName: user.companyName || user.companyId?.name || '',
    lat: user.companyId?.lat || null,
    long: user.companyId?.long || null,
    radius: user.companyId?.radius || 150,
    location: user.companyId?.location || '',
    category: user.companyId?.category || '',
    supervisorName: user.industrialSupervisor?.name || user.companyId?.supervisorName || user.companyId?.manager?.name || '',
    supervisorEmail: user.industrialSupervisor?.email || user.companyId?.supervisorEmail || user.companyId?.manager?.email || '',
    supervisorPhone: user.industrialSupervisor?.phone || user.companyId?.supervisorPhone || user.companyId?.manager?.phone || '',
    supervisorOrg: user.industrialSupervisor?.companyOrg || user.companyId?.manager?.companyOrg || user.companyName || user.companyId?.name || '',
  };
};

const StudentDashboard = () => {
  const { user, logout, refreshUser, updateUser } = useAuth(); 
  const [activeTab, setActiveTab] = useState('overview');
  const [isVerified, setIsVerified] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [placement, setPlacement] = useState(() => getPlacement(user?._id));
  const [logStats, setLogStats] = useState({ completedWeeks: 0, totalWeeks: 6, totalLogs: 0 });
  const [systemTotalWeeks, setSystemTotalWeeks] = useState(6);
  const [settings, setSettings] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const placementDetails = placement || buildPlacementFromUser(user);
  const isPlaced = isStudentPlaced(user, placementDetails);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => { refreshUser(); }, [refreshUser]);


  useEffect(() => {
    if (!user) return;

    const userIsPlaced = isStudentPlaced(user);

    if (!userIsPlaced) {
      // Clear stale placement data if the user is not actually placed
      if (placement) {
        localStorage.removeItem('studentPlacement');
        sessionStorage.removeItem('studentPlacement');
        setPlacement(null);
      }
      return;
    }

    const derived = buildPlacementFromUser(user);
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('studentPlacement', JSON.stringify(derived));
    setPlacement(prev => (
      JSON.stringify(prev) === JSON.stringify(derived) ? prev : derived
    ));
  }, [user, placement]);

  // Load system settings
  useEffect(() => {
    api.getSettings()
      .then(res => {
        const data = res?.data || res || {};
        setSystemTotalWeeks(data.totalWeeks || 6);
        if (data.geofenceEnabled === false) setGeofenceEnabled(false);
        setSettings(data);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (isPlaced && (activeTab === 'placements' || activeTab === 'documents')) {
      setActiveTab('daily-log');
    }
  }, [isPlaced, activeTab]);

  // Load log stats
  useEffect(() => {
    if (!isPlaced) return;
    getMyLogs()
      .then(res => {
        const logs = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const approved = logs.filter(l => l.status === 'Approved');
        if (!approved.length) return;
        const completedWeeks = Math.floor(approved.length / 5);
        setLogStats({
          completedWeeks: Math.min(completedWeeks, systemTotalWeeks),
          totalWeeks: systemTotalWeeks,
          totalLogs: logs.length,
        });
      })
      .catch(() => { });
  }, [isPlaced, systemTotalWeeks]);

  const refreshStudentTabData = useCallback(async () => {
    await Promise.allSettled([
      refreshUser(),
      api.getSettings().then(res => {
        const data = res?.data || res || {};
        setSystemTotalWeeks(data.totalWeeks || 6);
        setGeofenceEnabled(data.geofenceEnabled !== false);
        setSettings(data);
      }),
      isPlaced ? getMyLogs().then(res => {
        const logs = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
        const approved = logs.filter(l => l.status === 'Approved');
        const completedWeeks = Math.floor(approved.length / 5);
        setLogStats({
          completedWeeks: Math.min(completedWeeks, systemTotalWeeks),
          totalWeeks: systemTotalWeeks,
          totalLogs: logs.length,
        });
      }) : Promise.resolve(),
      new Promise(resolve => setTimeout(resolve, 250)),
    ]);
  }, [isPlaced, refreshUser, systemTotalWeeks]);

  const studentInfo = {
    name: user?.name || 'Student',
    indexNumber: user?.indexNumber || '',
    completedWeeks: logStats.completedWeeks,
    totalWeeks: logStats.totalWeeks,
    totalLogs: logStats.totalLogs,
  };

  // Use AuthContext logout — clears token, user, studentPlacement, redirects
  const handleLogout = () => logout();

  const handlePlacementAccepted = (newPlacement) => {
    const taggedPlacement = newPlacement ? { ...newPlacement, _userId: user?._id } : newPlacement;
    if (taggedPlacement) {
      updateUser({
        placementStatus: 'Active',
        status: 'Placed',
        companyId: taggedPlacement.companyId,
        companyName: taggedPlacement.companyName,
      });
    }
    setPlacement(taggedPlacement);
    setActiveTab('daily-log');
    refreshUser();
  };

  const handleTabChange = (tab) => {
    let nextTab = tab;
    if (isPlaced && (tab === 'placements' || tab === 'documents')) {
      nextTab = 'daily-log';
    }
    if ((tab === 'daily-log' || tab === 'history') && !isPlaced) {
      nextTab = 'placements';
    }
    setActiveTab(nextTab);
    setIsSidebarOpen(false);
    if (nextTab === activeTab) return;
    setTabLoading(true);
    refreshStudentTabData().finally(() => setTabLoading(false));
  };

  const companyLocation = placementDetails
    ? { lat: parseFloat(placementDetails.lat) || 0, lon: parseFloat(placementDetails.long) || 0, radius: Number(placementDetails.radius) || 150 }
    : { lat: 0, lon: 0, radius: 150 };

  const hasAcademicSupervisor = Boolean(user?.academicSupervisor);
  const hasIndustrialContact = Boolean(
    user?.industrialSupervisor ||
    placementDetails?.supervisorName ||
    placementDetails?.supervisorEmail ||
    user?.companyId?.manager
  );
  const canSubmitLogs = hasAcademicSupervisor && hasIndustrialContact;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <StudentProfile />;

      case 'placements':
        if (isPlaced) return <PostPlacementLocked tabLabel="Available Placements" onGoToLog={() => handleTabChange('daily-log')} />;
        return <AvailablePlacements onPlacementAccepted={handlePlacementAccepted} />;

      case 'documents':
        if (isPlaced) return <PostPlacementLocked tabLabel="Attachment Letters" onGoToLog={() => handleTabChange('daily-log')} />;
        return <AttachmentLetters />;

      case 'final-report':
        // Pass systemTotalWeeks so eligibility threshold matches admin config
        return (
          <FinalReport
            completedWeeks={studentInfo.completedWeeks}
            totalWeeks={systemTotalWeeks}
          />
        );

      case 'daily-log':
        if (!isPlaced) return <PlacementRequired onGoToMarket={() => handleTabChange('placements')} />;
        return (
          <>
            {geofenceEnabled && companyLocation.lat !== 0 && companyLocation.lon !== 0 && (
              <LocationStatus
                targetLat={companyLocation.lat}
                targetLon={companyLocation.lon}
                radius={companyLocation.radius}
                onVerificationChange={setIsVerified}
              />
            )}
            <LogEntryForm
              isLocationVerified={!geofenceEnabled || companyLocation.lat === 0 || isVerified}
              canSubmitLogs={canSubmitLogs}
            />
          </>
        );

      case 'history':
        if (!isPlaced) return <PlacementRequired onGoToMarket={() => handleTabChange('placements')} />;
        return <LogbookHistory />;

      case 'settings':
        return <StudentSettings />;

      case 'overview':
      default:
        return (
          <div className="bento-container fade-in">
            <div className="bento-row main-stats">
              <div className="bento-item welcome-box">
                <div className="badge-pill">Academic Year {settings?.academicYear || '2025/2026'}</div>
                <h1>{greeting}, {studentInfo.name.split(' ')[0]}</h1>
                {isPlaced
                  ? <p>You are placed at <strong>{placementDetails.companyName}</strong>. Keep logging your work!</p>
                  : <p>You don't have a placement yet. Browse the market to get placed instantly.</p>}
                <div className="bento-actions">
                  {isPlaced
                    ? <button className="btn-primary-lite" onClick={() => handleTabChange('daily-log')}>Log Today's Work</button>
                    : <>
                      <button className="btn-primary-lite" onClick={() => handleTabChange('placements')}>Find a Placement →</button>
                      <button className="btn-outline-lite" style={{ marginLeft: '10px' }} onClick={() => handleTabChange('documents')}>Download Letter →</button>
                    </>}
                </div>
              </div>

              <div className="bento-item progress-box">
                <div className="box-header">
                  <label>Program Completion</label>
                  <span> </span>
                  <span className="percentage-text">
                    {isPlaced ? Math.round((studentInfo.completedWeeks / studentInfo.totalWeeks) * 100) : 0}%
                  </span>
                </div>
                <div className="linear-progress-track">
                  <div
                    className="linear-progress-bar"
                    style={{ width: isPlaced ? `${(studentInfo.completedWeeks / studentInfo.totalWeeks) * 100}%` : '0%' }}
                  />
                </div>
                <div className="progress-footer">
                  <span>{isPlaced ? `Week ${studentInfo.completedWeeks}` : 'Not started'}</span>
                  <span> / </span>
                  <span>{studentInfo.totalWeeks} Weeks Total</span>
                </div>
              </div>
            </div>

            <div className="bento-grid-3">
              {/* Host Organization */}
              <div className="bento-item info-card">
                <label>Host Organization</label>
                {isPlaced ? (
                  <>
                    <h4>{placementDetails.companyName}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {placementDetails.location} • {placementDetails.category}
                    </p>
                    <span className="badge-pill-green" style={{ marginTop: '8px', display: 'inline-block' }}>Active</span>
                  </>
                ) : (
                  <div className="status-warning-mini">
                    <h4 style={{ color: '#d97706' }}>No Placement Yet</h4>
                    <p style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px', marginTop: '4px' }} onClick={() => handleTabChange('placements')}>
                      Browse available slots →
                    </p>
                  </div>
                )}
              </div>

              {/* Industrial Supervisor — show always if placed OR if supervisor assigned */}
              {(isPlaced || user?.industrialSupervisor) && (() => {
                
                const indSup = user?.industrialSupervisor;
                const name = indSup?.name || placementDetails?.supervisorName || '';
                const email = indSup?.email || placementDetails?.supervisorEmail || '';
                const phone = indSup?.phone || placementDetails?.supervisorPhone || '';
                const org = indSup?.companyOrg || placementDetails?.supervisorOrg || placementDetails?.companyName || '';
                return (
                  <div className="bento-item info-card">
                    <label>Industrial Supervisor</label>
                    {name ? (
                      <>
                        <h4 style={{ marginTop: '6px' }}>{name}</h4>
                        {org && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>{org}</p>}
                        {phone && (
                          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                            <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{phone}
                          </p>
                        )}
                        {email && (
                          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                            <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{email}
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>No supervisor assigned yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Academic Supervisor */}
              {(() => {
                const acSup = user?.academicSupervisor;
                return (
                  <div className="bento-item info-card">
                    <label>Academic Supervisor</label>
                    {acSup ? (
                      <>
                        <h4 style={{ marginTop: '6px' }}>{acSup.name}</h4>
                        {acSup.department && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>{acSup.department}</p>}
                        {acSup.phone && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{acSup.phone}</p>}
                        {acSup.email && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{acSup.email}</p>}
                      </>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>No academic supervisor assigned yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Quick Links */}
              <div className="bento-item info-card">
                <label>Quick Access</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <button
                    className={!isPlaced ? 'text-link-btn' : 'btn-disabled-market'}
                    style={{ textAlign: 'left', fontSize: '13px', padding: '6px 0' }}
                    disabled={isPlaced}
                    onClick={() => !isPlaced && handleTabChange('documents')}
                  >
                    <Send size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Report Placement {isPlaced && '(already placed)'}
                  </button>
                  <button
                    className={isPlaced ? 'text-link-btn' : 'btn-disabled-market'}
                    style={{ textAlign: 'left', fontSize: '13px', padding: '6px 0' }}
                    disabled={!isPlaced}
                    onClick={() => isPlaced && handleTabChange('daily-log')}
                  >
                    <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Daily Log {!isPlaced && '(place first)'}
                  </button>
                  <button
                    className={isPlaced ? 'text-link-btn' : 'btn-disabled-market'}
                    style={{ textAlign: 'left', fontSize: '13px', padding: '6px 0' }}
                    disabled={!isPlaced}
                    onClick={() => isPlaced && handleTabChange('history')}
                  >
                    <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Logbook History {!isPlaced && '(place first)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        handleLogout={handleLogout}
        studentName={studentInfo.name}
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        isPlaced={isPlaced}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="breadcrumb">Student / {activeTab.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div className="top-nav-right">
            <div
              className="admin-profile-pill"
              onClick={() => handleTabChange('profile')}
              style={{ cursor: 'pointer' }}
              title="My Profile"
            >
              <span>{studentInfo.name}</span>
              <div className="admin-avatar">
                {user?.profilePicture ? (
                  <img src={avatarUrl(user.profilePicture)} alt="Profile" />
                ) : (
                  studentInfo.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>
        <section className="page-content">
          {tabLoading ? <TabLoadingState label="Refreshing student data" /> : renderContent()}
        </section>
      </main>
    </div>
  );
};

const PlacementRequired = ({ onGoToMarket }) => (
  <div className="bento-container fade-in">
    <div className="bento-item welcome-box" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
      <div className="badge-pill" style={{ background: '#fef3c7', color: '#92400e' }}>Placement Required</div>
      <h3 style={{ marginTop: '12px' }}>You need a placement first</h3>
      <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
        Browse the available company slots and apply to get instantly placed.<br />
        Once placed, your logbook and history will be unlocked.
      </p>
      <button className="btn-approve-full" style={{ marginTop: '24px', padding: '12px 32px', fontSize: '15px' }} onClick={onGoToMarket}>
        Browse Placements →
      </button>
    </div>
  </div>
);

const PostPlacementLocked = ({ tabLabel, onGoToLog }) => (
  <div className="bento-container fade-in">
    <div className="bento-item welcome-box" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Lock size={46} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
      <div className="badge-pill" style={{ background: '#e0f2fe', color: '#075985' }}>Locked After Placement</div>
      <h3 style={{ marginTop: '12px' }}>{tabLabel} is now locked</h3>
      <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
        Your placement has been confirmed, so this section is closed for your account.
        Continue with your daily logbook activities.
      </p>
      <button className="btn-approve-full" style={{ marginTop: '24px', padding: '12px 32px', fontSize: '15px' }} onClick={onGoToLog}>
        Go to Daily Log
      </button>
    </div>
  </div>
);

export default StudentDashboard;
