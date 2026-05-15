import React, { useState, useEffect, useCallback } from 'react';
import '../styles/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import { User, Calendar, CheckCircle2, Mail, Loader, Phone, ShieldCheck, MapPin, X, LayoutDashboard, Users, UserCheck, Building2, Settings, LogOut, Bell, Search, PlusCircle, Link2, FileDown, ClipboardCheck, Menu, AlertTriangle, FolderKanban, Wrench, ClipboardList, GraduationCap, Handshake, HardHat, Pin, Eye, EyeOff, Megaphone, RefreshCw } from 'lucide-react';
import VerificationModal from '../components/admin/VerificationModal'; 
import AddCompanyModal from '../components/admin/AddCompanyModal';
import AddLecturerModal from '../components/admin/AddLecturerModal';
import CompanyProfileModal from '../components/admin/CompanyProfileModal';
import AddStudentModal from '../components/admin/AddStudentModal';
import ExportRegistryModal from '../components/admin/ExportRegistryModal';
import BulkBroadcasterModal from '../components/admin/BulkBroadcasterModal'; 
import AdminStudentDrawer from '../components/admin/AdminStudentDrawer';
import AssignmentTab from '../components/admin/AssignmentTab';
import SupervisorsTab from '../components/admin/SupervisorsTab';
import AddAdminModal from '../components/admin/AddAdminModal';
import AdminDocumentsTab from '../components/admin/AdminDocumentsTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import TabLoadingState from '../components/common/TabLoadingState';
import { usePasswordChange } from '../hooks/usePasswordChange';
import * as api from '../api';

const TAB_META = {
  overview: {
    title: 'Admin Command Center',
    eyebrow: 'Operations Overview',
    description: 'Track placements, supervision coverage, partner capacity, and internship season health from one place.',
    icon: LayoutDashboard,
    accent: '#11c5df',
  },
  'pending-placements': {
    title: 'Self-Placement Verification Queue',
    eyebrow: 'Placement Requests',
    description: 'Review student-submitted companies, supervisor contacts, and GPS evidence before approval.',
    icon: ClipboardCheck,
    accent: '#f59e0b',
  },
  companies: {
    title: 'Partner Companies & Slot Allocation',
    eyebrow: 'Company Registry',
    description: 'Manage approved partners, capacity, locations, geofences, and industrial supervisor contacts.',
    icon: Building2,
    accent: '#10b981',
  },
  documents: {
    title: 'Official Attachment Letters',
    eyebrow: 'Document Distribution',
    description: 'Publish PDFs that students can download directly from their attachment letters tab.',
    icon: FileDown,
    accent: '#6366f1',
  },
  reports: {
    title: 'Final Report Submissions',
    eyebrow: 'Student Reports',
    description: 'Review and download student final reports submitted at the end of internship.',
    icon: FolderKanban,
    accent: '#ec4899',
  },
  assignments: {
    title: 'Academic Supervisor Assignments',
    eyebrow: 'Student Matching',
    description: 'Connect students to academic supervisors and balance staff load across departments.',
    icon: Link2,
    accent: '#0ea5e9',
  },
  supervisors: {
    title: 'Supervisor Directory',
    eyebrow: 'Faculty & Industry',
    description: 'Maintain academic and industrial supervisor profiles, contacts, departments, and student load.',
    icon: UserCheck,
    accent: '#14b8a6',
  },
  students: {
    title: 'Student Master List',
    eyebrow: 'Intern Records',
    description: 'Browse student placement status, supervisor filters, departments, and account management actions.',
    icon: Users,
    accent: '#3b82f6',
  },
  settings: {
    title: 'System Configuration',
    eyebrow: 'Portal Controls',
    description: 'Configure the internship season, grading weights, geofencing, departments, and activity categories.',
    icon: Settings,
    accent: '#8b5cf6',
  },
};

const GROUP_STYLES = {
  'Technical Tasks':         { bg: '#fef3c7', border: '#fbbf24', text: '#92400e', Icon: Wrench },
  'Office & Admin':          { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d', Icon: ClipboardList },
  'Learning & Development':  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', Icon: GraduationCap },
  'Collaboration':           { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3', Icon: Handshake },
  'Field Work':              { bg: '#ffedd5', border: '#fdba74', text: '#9a3412', Icon: HardHat },
};
const DEFAULT_GROUP_STYLE = { bg: '#f0f9ff', border: '#7dd3fc', text: '#0c4a6e', Icon: Pin };

const ADMIN_NOTIFICATION_CATEGORIES = {
  placement: { label: 'Placement', tab: 'pending-placements', tone: 'amber', Icon: ClipboardCheck },
  students: { label: 'Students', tab: 'students', tone: 'blue', Icon: Users },
  supervisors: { label: 'Supervisor', tab: 'supervisors', tone: 'teal', Icon: UserCheck },
  companies: { label: 'Company', tab: 'companies', tone: 'emerald', Icon: Building2 },
  documents: { label: 'Document', tab: 'documents', tone: 'indigo', Icon: FileDown },
  grading: { label: 'Grading', tab: 'assignments', tone: 'purple', Icon: GraduationCap },
  security: { label: 'Security', tab: 'settings', tone: 'red', Icon: ShieldCheck },
  broadcast: { label: 'Broadcast', tab: null, tone: 'slate', Icon: Megaphone },
  system: { label: 'System', tab: 'overview', tone: 'slate', Icon: Bell },
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('adminTab') || 'overview'
  );
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false); // New State
  const [isAddLecturerModalOpen, setIsAddLecturerModalOpen] = useState(false);
  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);


  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedStudentManage, setSelectedStudentManage] = useState(null);
  const [isStudentDrawerOpen, setIsStudentDrawerOpen] = useState(false);
  
  const { user, logout, updateUser } = useAuth();
  const adminPassword = usePasswordChange();
  const handleLogout = () => logout()
  const adminName = user?.name || 'Admin';
  const adminRoleLabel = (user?.role || 'admin').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  const adminLastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'Not recorded';
  const adminPasswordStatus = user?.needsPasswordChange
    ? { label: 'Temporary password', detail: 'Password change required', tone: 'warning' }
    : { label: 'Password updated', detail: 'Permanent password active', tone: 'success' };

  // ── Real data from API ──────────────────────────────────────────
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [placementRequests, setPlacementRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadError,   setLoadError]   = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [filterSupervisor, setFilterSupervisor] = useState('');   // supervisor ID filter for students
  const [editingSupervisor, setEditingSupervisor] = useState(null); // supervisor being inline-edited
  const [placementFilter, setPlacementFilter]   = useState('all'); // 'all' | 'placed' | 'unplaced' | 'graded' | 'logs'
  const [studentSortBy, setStudentSortBy]       = useState('name'); // 'name' | 'index' | 'dept'
  const [grades, setGrades]           = useState([]);
  const [settings, setSettings]       = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [overviewChartType, setOverviewChartType] = useState('bar');
  const [newDeptInput, setNewDeptInput] = useState(''); // for dept add field
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatGroup, setNewCatGroup] = useState('Technical Tasks');
  const [newGroupInput, setNewGroupInput] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' }); // type: 'success'|'error'
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.getMe()
      .then(res => updateUser(res?.user || res))
      .catch(() => {});
  }, [updateUser]);

  const flashMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 5000);
  };

  const refreshDashboardData = useCallback(async () => {
    setLoadingData(true);
    setLoadError('');
    try {
      const [companiesRes, studentsRes, placementsRes, supsRes, gradesRes, settingsRes, notificationsRes] = await Promise.all([
        api.getCompanies(),
        api.getStudents(),
        api.getPlacementRequests({ status: 'Pending' }),
        api.getSupervisors(),
        api.getGrades(),
        api.getSettings(),
        api.getNotifications(),
      ]);
      const toArray = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.companies)) return res.companies;
        if (res && Array.isArray(res.students)) return res.students;
        if (res && Array.isArray(res.placements)) return res.placements;
        return [];
      };
      const companiesArr = toArray(companiesRes);
      setCompanies(companiesArr);
      setStudents(toArray(studentsRes));
      setPlacementRequests(toArray(placementsRes));
      setSupervisors(toArray(supsRes));
      setGrades(toArray(gradesRes));
      const sData = settingsRes?.data || settingsRes || null;
      if (sData) setSettings(sData);
      setNotifications(toArray(notificationsRes));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoadError(err.message || 'Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoadingData(false);
      setHasLoadedData(true);
    }
  }, []);

  // Persist tab selection within the browser session so refresh returns to same tab
  const setTab = useCallback((tab) => {
    sessionStorage.setItem('adminTab', tab);
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (tab !== activeTab) refreshDashboardData();
  }, [activeTab, refreshDashboardData]);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  const handleReject = async (request) => {
    const studentName = request.student?.name || request.studentName || 'this student';
    if (window.confirm(`Decline placement request for ${studentName}?`)) {
      try {
        await api.declinePlacement((request._id || request.id).toString());
        // Re-fetch pending queue so list always reflects server state
        const fresh = await api.getPlacementRequests({ status: 'Pending' });
        const toArr = (r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        setPlacementRequests(toArr(fresh));
        flashMsg(`Placement request for ${studentName} declined.`);
      } catch (err) {
        console.error('Failed to decline placement:', err);
        flashMsg(`Failed to decline: ${err.message}`, 'error');
      }
    }
  };

  // handleApproveWithFeedback is passed to VerificationModal as onApprove
  const handleApproveWithFeedback = async (studentData, lecturerId) => {
    const placementId = (studentData._id || studentData.id || '').toString();
    const studentUserId = (studentData.student?._id || studentData.student?.id || studentData.studentId || '').toString();
    try {
      const approveRes = await api.approvePlacement(placementId);
      if (studentUserId && lecturerId) {
        await api.assignStudent(studentUserId, { academicSupervisorId: lecturerId.toString() });
      }
      // Show email feedback
      const note = approveRes?.emailNote || approveRes?.data?.emailNote || '';
      const sent = approveRes?.emailSent ?? approveRes?.data?.emailSent;
      if (note) {
        flashMsg(note, sent === false ? 'error' : 'success');
      }
    } catch (err) {
      flashMsg(`Approval failed: ${err.message}`, 'error');
    } finally {
      try {
        const fresh = await api.getPlacementRequests({ status: 'Pending' });
        const toArr = (r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        setPlacementRequests(toArr(fresh));
      } catch (_) {}
    }
  };

  const lecturers = supervisors
    .filter(s => s.role === 'academic')
    .map(s => ({
      _id:        s._id || s.id,
      id:         s._id || s.id,
      name:       s.name,
      department: s.department || s.dept || '',
      staffId:    s.staffId || '',
    }));

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotificationRead = async (id) => {
    if (!id) return;
    setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, unread: false } : n));
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      flashMsg(err.message || 'Failed to update notification.', 'error');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => n.unread).map(n => n._id || n.id).filter(Boolean);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    await Promise.allSettled(unreadIds.map(id => api.markNotificationRead(id)));
  };

  const getNotificationMeta = (notification = {}) => {
    const explicit = (notification.category || notification.type || '').toString().toLowerCase();
    const haystack = `${notification.subject || ''} ${notification.message || ''}`.toLowerCase();
    const key = explicit || (
      haystack.includes('placement') || haystack.includes('company request') ? 'placement'
      : haystack.includes('student') || haystack.includes('intern') ? 'students'
      : haystack.includes('supervisor') || haystack.includes('lecturer') ? 'supervisors'
      : haystack.includes('company') || haystack.includes('partner') ? 'companies'
      : haystack.includes('document') || haystack.includes('letter') || haystack.includes('pdf') ? 'documents'
      : haystack.includes('grade') || haystack.includes('logbook') || haystack.includes('evaluation') ? 'grading'
      : haystack.includes('password') || haystack.includes('security') || haystack.includes('login') ? 'security'
      : haystack.includes('broadcast') || haystack.includes('announcement') ? 'broadcast'
      : 'system'
    );
    return ADMIN_NOTIFICATION_CATEGORIES[key] || ADMIN_NOTIFICATION_CATEGORIES.system;
  };

  const handleNotificationRelatedPage = (notification) => {
    const nid = notification?._id || notification?.id;
    const relatedPage = notification?.relatedPage || notification?.tab || notification?.actionTab;
    const meta = getNotificationMeta(notification);
    const target = relatedPage || meta.tab;
    if (!target) return;
    handleNotificationRead(nid);
    setShowNotifications(false);
    setTab(target);
  };

  const hasAcademicSupervisor = (student = {}) => {
    if (!student.academicSupervisor) return false;
    if (typeof student.academicSupervisor === 'object') return Boolean(student.academicSupervisor._id || student.academicSupervisor.id || student.academicSupervisor.name);
    return Boolean(student.academicSupervisor);
  };

  const renderAssignmentStatsPanel = () => {
    const assignedCount = students.filter(hasAcademicSupervisor).length;
    const unassignedCount = students.length - assignedCount;
    const academicSupervisorCount = supervisors.filter(s => s.role === 'academic').length;
    const stats = [
      { label: 'Total Students', value: students.length, tone: 'blue' },
      { label: 'Unassigned', value: unassignedCount, tone: 'amber' },
      { label: 'Assigned', value: assignedCount, tone: 'green' },
      { label: 'Supervisors', value: academicSupervisorCount, tone: 'purple' },
    ];

    return (
      <div className="assignment-banner-card">
        <button
          type="button"
          className="assignment-banner-refresh"
          onClick={refreshDashboardData}
          disabled={loadingData}
          title="Refresh assignment stats"
          aria-label="Refresh assignment stats"
        >
          <RefreshCw size={14} className={loadingData ? 'spin-icon' : ''} />
        </button>
        <div className="assignment-banner-stat-grid">
          {stats.map(stat => (
            <div className={`assignment-banner-stat ${stat.tone}`} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTabBanner = (tabId = activeTab, stats = [], customStatsPanel = null) => {
    const meta = TAB_META[tabId] || TAB_META.overview;
    const BannerIcon = meta.icon;
    return (
      <div className="admin-tab-banner" style={{ '--tab-accent': meta.accent }}>
        <div className="admin-tab-banner-main">
          <div className="admin-tab-icon">
            <BannerIcon size={24} />
          </div>
          <div>
            <p className="admin-tab-eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </div>
        </div>
        {customStatsPanel || (stats.length > 0 && (
          <div className="admin-tab-banner-stats">
            {stats.map(stat => (
              <div className="admin-tab-mini-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const handleOpenVerify = (request) => {
    // Normalise so VerificationModal always gets flat string fields
    setSelectedRequest({
      ...request,
      studentName:  request.student?.name        || request.studentName  || '',
      indexNumber:  request.student?.indexNumber  || request.indexNumber  || '',
      studentId:    request.student?._id          || request.student?.id  || request.studentId || '',
    });
    setIsVerifyModalOpen(true);
  };

  const handleViewInterns = (company) => {
    setSelectedCompany({ ...company, interns: company.interns || [] });
    setIsProfileModalOpen(true);
  };

  // ── Company CRUD (API-backed) ─────────────────────────────────
  const [editingCompany, setEditingCompany] = useState(null);

  const handleAddCompany = async (newCompany) => {
    try {
      const res = await api.createCompany(newCompany);
      const created = (res && res.data && res.data._id) ? res.data
        : (res && res._id) ? res
        : { ...newCompany, _id: Date.now().toString() };
      setCompanies(prev => [...prev, { ...newCompany, ...created }]);

      if (newCompany.supervisorEmail) {
        if (res?.warning) {
          flashMsg(`Company registered. Note: ${res.warning}`, 'error');
        } else {
          flashMsg(`Company registered. Credentials sent to ${newCompany.supervisorEmail}.`);
        }
      } else {
        flashMsg('Company registered successfully.');
      }
    } catch (err) {
      flashMsg(`Failed to register company: ${err.message}`, 'error');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm('Remove this partner company?')) {
      try {
        await api.deleteCompany(id);
        setCompanies(prev => prev.filter(c => (c._id || c.id) !== id));
        flashMsg('Partner company removed.');
      } catch (err) {
        flashMsg(err.message || 'Failed to delete company.', 'error');
      }
    }
  };

  const handleDeleteSupervisor = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await api.deleteSupervisor(id);
      setSupervisors(prev => prev.filter(s => (s._id||s.id) !== id));
      flashMsg(`${name} removed.`);
    } catch (err) { flashMsg(err.message || 'Failed to remove supervisor.', 'error'); }
  };

  // FIX: accepts payload param from SupervisorsTab (which manages its own edit state)
  // falls back to editingSupervisor for any legacy callers
  const handleSaveSupervisor = async (id, payload) => {
    try {
      const data = payload || { ...editingSupervisor };
      await api.updateSupervisor(id, data);
      setSupervisors(prev => prev.map(s => (s._id||s.id) === id ? { ...s, ...data } : s));
      setEditingSupervisor(null);
    } catch (err) { console.error('Failed to update supervisor:', err); }
  };

  const handleEditCompany = (company) => setEditingCompany({ ...company });

  const handleSaveEdit = async (id) => {
    try {
      const payload = { ...editingCompany, slots: Number(editingCompany.slots) || 0 };
      // Update local state immediately with the payload so it never resets
      setCompanies(prev => prev.map(c => (c._id || c.id) === id ? { ...c, ...payload } : c));
      setEditingCompany(null);
      // Then persist to DB in background
      await api.updateCompany(id, payload);
    } catch (err) {
      console.error('Failed to update company:', err);
    }
  };

  const handleEditChange = (field, value) =>
    setEditingCompany(prev => ({ ...prev, [field]: value }));

  const jumpToStudents = (filter = 'all') => {
    setPlacementFilter(filter);
    setFilterSupervisor('');
    setTab('students');
  };

  // Filter Logic for Companies & Students
  const filteredCompanies = companies.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentIdsWithLogs = new Set(grades.map(g => (g.student?._id || g.student || '').toString()));
  const filteredStudents = students
    .filter(s => {
      const sid = (s._id || s.id || '').toString();
      const isPlaced = s.placementStatus === 'Active' || s.status === 'Placed';
      const isGraded = s.gradeStatus === 'Graded' || s.status === 'Graded';
      const matchSearch = (s.name||'').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.indexNumber||s.index||'').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlacement = placementFilter === 'all' ? true
        : placementFilter === 'placed'   ? isPlaced
        : placementFilter === 'unplaced' ? !isPlaced
        : placementFilter === 'graded'   ? isGraded
        : placementFilter === 'logs'     ? studentIdsWithLogs.has(sid)
        : true;
      const matchSup = !filterSupervisor ? true
        : (s.academicSupervisor === filterSupervisor || (s.academicSupervisor?._id || s.academicSupervisor) === filterSupervisor);
      return matchSearch && matchPlacement && matchSup;
    })
    .sort((a, b) => {
      if (studentSortBy === 'name')  return (a.name||'').localeCompare(b.name||'');
      if (studentSortBy === 'index') return (a.indexNumber||a.index||'').localeCompare(b.indexNumber||b.index||'');
      if (studentSortBy === 'dept')  return (a.department||a.dept||'').localeCompare(b.department||b.dept||'');
      return 0;
    });

  const renderContent = () => {
    switch (activeTab) {
      case 'pending-placements':
        return (
          <div className="admin-tab-shell fade-in">
            <style>{`
              .plq-header { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
              .plq-list-scroll { display:flex; flex-direction:column; gap:10px; }
              .plq-request-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
              .plq-card-grid { display:grid; grid-template-columns:auto 1fr 1fr 1fr auto; gap:20px; align-items:center; }
              .plq-actions { display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
              @media (max-width:768px) {
                .plq-card-grid { grid-template-columns:auto 1fr; gap:12px; }
                .plq-col-company, .plq-col-sup { grid-column:1/-1; padding-top:0; border-top:1px solid #f1f5f9; padding-top:10px; }
                .plq-actions { display:grid; grid-template-columns:1fr 1fr; grid-column:1/-1; border-top:1px solid #f1f5f9; padding-top:10px; }
                .plq-actions button { min-width:0; justify-content:center; padding-left:10px !important; padding-right:10px !important; }
                .plq-search { width:100% !important; }
              }
              @media (max-width:360px) {
                .plq-actions { grid-template-columns:1fr; }
              }
            `}</style>

            {/* Header banner */}
            <div style={{ background:'linear-gradient(135deg,#03256c,#1768ac)', borderRadius:'16px', padding:'20px 22px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div className="plq-header">
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', background:'rgba(255,255,255,0.15)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <ClipboardCheck size={21} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#fff' }}>Self-Placement Verification Queue</h2>
                    <p style={{ margin:'2px 0 0', fontSize:'11.5px', color:'rgba(255,255,255,0.6)' }}>Review and approve student-submitted placement requests</p>
                  </div>
                </div>
                {placementRequests.length > 0 && (
                  <div style={{ background:'rgba(251,191,36,0.2)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:'20px', padding:'4px 14px', fontSize:'12px', fontWeight:700, color:'#fbbf24', flexShrink:0 }}>
                    {placementRequests.length} pending
                  </div>
                )}
              </div>
              {/* Search always full-width on its own row */}
              <div style={{ position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.5)', pointerEvents:'none' }} />
                <input
                  type="text"
                  placeholder="Filter by student or company…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="plq-search"
                  style={{ padding:'9px 14px 9px 32px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontSize:'12.5px', color:'#fff', outline:'none', width:'260px', fontFamily:'inherit', boxSizing:'border-box' }}
                  onFocus={e => { e.target.style.background='rgba(255,255,255,0.2)'; e.target.style.borderColor='rgba(255,255,255,0.5)'; }}
                  onBlur={e =>  { e.target.style.background='rgba(255,255,255,0.12)'; e.target.style.borderColor='rgba(255,255,255,0.2)'; }}
                />
              </div>
            </div>

            {/* Empty state */}
            {placementRequests.filter(req => {
              const q = searchTerm.toLowerCase();
              return !q || (req.student?.name||req.studentName||'').toLowerCase().includes(q) || (req.companyName||'').toLowerCase().includes(q);
            }).length === 0 && (
              <div style={{ background:'#fff', border:'2px dashed #e2e8f0', borderRadius:'14px', padding:'48px 24px', textAlign:'center' }}>
                <div style={{ width:'56px', height:'56px', background:'#f0fdf4', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <CheckCircle2 size={26} color="#86efac" />
                </div>
                <p style={{ fontWeight:700, color:'#64748b', fontSize:'14px', margin:'0 0 4px' }}>
                  {searchTerm ? `No requests matching "${searchTerm}"` : 'All caught up!'}
                </p>
                <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>
                  {searchTerm ? 'Try a different search.' : 'No pending placement requests at the moment.'}
                </p>
              </div>
            )}

            {/* Request cards */}
            <div className="plq-list-scroll">
              {placementRequests
                .filter(req => {
                  const q = searchTerm.toLowerCase();
                  return !q || (req.student?.name||req.studentName||'').toLowerCase().includes(q) || (req.companyName||'').toLowerCase().includes(q);
                })
                .map(req => {
                  const studentName = req.student?.name || req.studentName || '—';
                  const indexNo     = req.student?.indexNumber || req.indexNumber || '—';
                  const initials    = studentName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
                  const hasGps      = req.lat && req.long;
                  return (
                    <div key={req._id || req.id} className="plq-request-card">
                      <div className="plq-card-grid">

                        {/* Avatar */}
                        <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'linear-gradient(135deg,#03256c,#1768ac)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:'#fff', flexShrink:0 }}>
                          {initials}
                        </div>

                        {/* Student */}
                        <div>
                          <p style={{ fontWeight:700, color:'#1e293b', fontSize:'14px', margin:'0 0 4px' }}>{studentName}</p>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:'20px', fontFamily:'monospace' }}>
                            {indexNo}
                          </span>
                        </div>

                        {/* Company */}
                        <div className="plq-col-company">
                          <p style={{ fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#94a3b8', margin:'0 0 4px' }}>Company</p>
                          <p style={{ fontWeight:700, color:'#1e293b', fontSize:'13px', margin:'0 0 2px' }}>{req.companyName || '—'}</p>
                          {req.industry && <p style={{ fontSize:'11.5px', color:'#64748b', margin:0 }}>{req.industry}</p>}
                        </div>

                        {/* Supervisor + GPS */}
                        <div className="plq-col-sup">
                          <p style={{ fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#94a3b8', margin:'0 0 6px' }}>Supervisor</p>
                          {req.supervisorEmail && (
                            <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 3px', display:'flex', alignItems:'center', gap:'5px' }}>
                              <Mail size={11} color="#94a3b8" />{req.supervisorEmail}
                            </p>
                          )}
                          {req.supervisorPhone && (
                            <p style={{ fontSize:'12px', color:'#475569', margin:'0 0 6px', display:'flex', alignItems:'center', gap:'5px' }}>
                              <Phone size={11} color="#94a3b8" />{req.supervisorPhone}
                            </p>
                          )}
                          {hasGps && (
                            <button
                              onClick={() => window.open(`https://www.google.com/maps?q=${req.lat},${req.long}`, '_blank')}
                              style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#d97706', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontWeight:600 }}
                            >
                              <MapPin size={10} />{parseFloat(req.lat).toFixed(4)}, {parseFloat(req.long).toFixed(4)} — Map
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="plq-actions">
                          <button
                            onClick={() => handleOpenVerify(req)}
                            style={{ padding:'9px 18px', background:'linear-gradient(135deg,#03256c,#1768ac)', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            style={{ padding:'9px 18px', background:'#fff', color:'#ef4444', border:'1.5px solid #fca5a5', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fff'; }}
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );

      case 'companies':
        return (
          <div className="admin-tab-shell fade-in">
          {renderTabBanner('companies', [
            { label: 'Partners', value: companies.length },
            { label: 'Total Slots', value: companies.reduce((sum, co) => sum + (Number(co.slots) || 0), 0) },
          ])}
          <div className="content-card fade-in">
            <div className="card-header-actions">
              <h3>Partner Companies & Slot Allocation</h3>
              <div className="search-wrapper-inline">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search partners..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="primary-btn" onClick={() => setIsAddCompanyModalOpen(true)}>
                <PlusCircle size={18}/> Add Partner
              </button>
            </div>
            <div className="table-responsive">
            <table className="data-table admin-companies-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th style={{textAlign: 'center'}}>Available Slots</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map(company => {
                    const companyId = company._id || company.id;
                    const isEditing = editingCompany && (editingCompany._id || editingCompany.id) === companyId;
                    return (
                      <React.Fragment key={companyId}>
                        <tr>
                          <td><strong>{company.name}</strong></td>
                          <td>{company.location}</td>
                          <td>{company.category}</td>
                          <td style={{textAlign: 'center'}}>
                            <span className="slot-badge">{company.slots ?? 0}</span>
                          </td>
                          <td>
                            <div className="action-group-sm">
                              <button className="text-link-btn" onClick={() => handleViewInterns(company)}>View Interns</button>
                              <button className="text-link-btn-secondary" onClick={() => handleEditCompany(company)}>Edit</button>
                              <button className="btn-reject-outline" style={{fontSize:'12px', padding:'4px 10px'}} onClick={() => handleDeleteCompany(companyId)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr>
                            <td colSpan="5" style={{padding: '0', background: '#f8fafc', borderBottom: '2px solid #3b82f6'}}>
                              <div style={{padding: '16px 20px'}}>
                                <p style={{fontSize: '12px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                  Editing: {company.name}
                                </p>
                                <div className="form-grid-2" style={{marginBottom: '10px'}}>
                                  <div className="input-group">
                                    <label>Company Name</label>
                                    <input className="admin-input-select-sm" value={editingCompany.name || ''} onChange={e => handleEditChange('name', e.target.value)} />
                                  </div>
                                  <div className="input-group">
                                    <label>Category</label>
                                    <select className="admin-input-select-sm" value={editingCompany.category || ''} onChange={e => handleEditChange('category', e.target.value)}>
                                      <option>Engineering</option>
                                      <option>Software/IT</option>
                                      <option>Business</option>
                                      <option>Electrical</option>
                                      <option>Network Eng.</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="form-grid-2" style={{marginBottom: '10px'}}>
                                  <div className="input-group">
                                    <label>City / Address</label>
                                    <input className="admin-input-select-sm" value={editingCompany.location || ''} onChange={e => handleEditChange('location', e.target.value)} />
                                  </div>
                                  <div className="input-group">
                                    <label>Internship Slots</label>
                                    <input type="number" min="0" className="admin-input-select-sm" value={editingCompany.slots ?? ''} onChange={e => handleEditChange('slots', e.target.value)} />
                                  </div>
                                </div>
                                <div style={{display:'flex', gap:'10px', alignItems:'flex-end', marginBottom:'12px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'8px', padding:'12px'}}>
                                  <MapPin size={14} style={{color:'#d97706', flexShrink:0, marginBottom:'4px'}} />
                                  <div style={{flex:1}}>
                                    <p style={{fontSize:'11px', fontWeight:'700', color:'#92400e', marginBottom:'8px'}}>GPS Geofence</p>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                                      <div className="input-group">
                                        <label>Latitude</label>
                                        <input type="number" step="any" className="admin-input-select-sm" placeholder="5.60" value={editingCompany.lat ?? ''} onChange={e => handleEditChange('lat', e.target.value)} />
                                      </div>
                                      <div className="input-group">
                                        <label>Longitude</label>
                                        <input type="number" step="any" className="admin-input-select-sm" placeholder="-0.18" value={editingCompany.long ?? ''} onChange={e => handleEditChange('long', e.target.value)} />
                                      </div>
                                      <div className="input-group">
                                        <label>Radius</label>
                                        <select className="admin-input-select-sm" value={editingCompany.radius || '150'} onChange={e => handleEditChange('radius', e.target.value)}>
                                          <option value="50">50m</option>
                                          <option value="150">150m</option>
                                          <option value="500">500m</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Industrial Supervisor */}
                                <div style={{marginBottom:'12px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'12px'}}>
                                  <p style={{fontSize:'11px', fontWeight:'700', color:'#0284c7', marginBottom:'8px', display:'flex', alignItems:'center', gap:'4px'}}>
                                    <User size={13} /> Industrial Supervisor
                                  </p>
                                  <div className="form-grid-2" style={{marginBottom:'8px'}}>
                                    <div className="input-group">
                                      <label>Supervisor Name</label>
                                      <input className="admin-input-select-sm" placeholder="Mr. Kofi Mensah" value={editingCompany.supervisorName || ''} onChange={e => handleEditChange('supervisorName', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                      <label>Phone</label>
                                      <input type="tel" className="admin-input-select-sm" placeholder="024XXXXXXX" value={editingCompany.supervisorPhone || ''} onChange={e => handleEditChange('supervisorPhone', e.target.value)} />
                                    </div>
                                  </div>
                                  <div className="input-group">
                                    <label>Email</label>
                                    <input type="email" className="admin-input-select-sm" placeholder="supervisor@company.com" value={editingCompany.supervisorEmail || ''} onChange={e => handleEditChange('supervisorEmail', e.target.value)} />
                                  </div>
                                </div>
                                <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                  <button className="cancel-btn" onClick={() => setEditingCompany(null)}>Cancel</button>
                                  <button className="btn-verify-confirm" onClick={() => handleSaveEdit(companyId)}>Save Changes</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">
                      <div className={`admin-state ${loadingData ? 'admin-state-loading' : ''}`}>
                        <div className="admin-state-icon">
                          {loadingData
                            ? <Loader size={22} style={{ animation:'spin 1s linear infinite' }} />
                            : <Building2 size={24} />}
                        </div>
                        <h4>{loadingData ? 'Loading companies' : `No companies found matching "${searchTerm}"`}</h4>
                        <p>{loadingData ? 'Fetching partner companies and placement capacity.' : 'Try a different search term or add a new partner company.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          </div>
        );

      case 'students':
  return (
    <div className="admin-tab-shell fade-in">
    {renderTabBanner('students', [
      { label: 'Students', value: students.length },
      { label: 'Placed', value: students.filter(s => s.placementStatus === 'Active' || s.status === 'Placed').length },
      { label: 'Visible', value: filteredStudents.length },
    ])}
    <div className="content-card fade-in">
      <div className="card-header-actions">
        <div>
          <h3>Student Master List</h3>
          <p className="sub-text-sm">
            Showing {filteredStudents.length} of {students.length} students
            {filterSupervisor ? ' · Filtered by supervisor' : ''}
          </p>
        </div>
        <div className="action-group-sm">
          {filterSupervisor && (
            <button className="btn-reject-outline" style={{fontSize:'12px'}} onClick={() => setFilterSupervisor('')}>
              Clear Filter <X size={13} />
            </button>
          )}
          <button className="btn-outline-blue" onClick={() => setIsBroadcasterOpen(true)}>
            <Bell size={18}/> Announce
          </button>
          <button className="primary-btn" onClick={() => setIsAddStudentModalOpen(true)}>
            <PlusCircle size={18}/> Add Student
          </button>
        </div>
      </div>
      {/* Filter + Sort bar */}
      <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'12px', alignItems:'center'}}>
        <select className="admin-input-select-sm" value={placementFilter} onChange={e => setPlacementFilter(e.target.value)} style={{width:'auto'}}>
          <option value="all">All Students</option>
          <option value="placed">Placed Only</option>
          <option value="unplaced">Unplaced Only</option>
          <option value="logs">With Logbooks</option>
          <option value="graded">Graded Only</option>
        </select>
        <select className="admin-input-select-sm" value={studentSortBy} onChange={e => setStudentSortBy(e.target.value)} style={{width:'auto'}}>
          <option value="name">Sort: Name</option>
          <option value="index">Sort: Index No.</option>
          <option value="dept">Sort: Department</option>
        </select>
      </div>

            <div className="table-responsive">
            <table className="data-table admin-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Index No.</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Current Company</th>
                 <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-results">
                      <div className={`admin-state ${loadingData ? 'admin-state-loading' : ''}`}>
                        <div className="admin-state-icon">
                          {loadingData
                            ? <Loader size={22} style={{ animation:'spin 1s linear infinite' }} />
                            : <Users size={24} />}
                        </div>
                        <h4>{loadingData ? 'Loading students' : 'No students match the current filter.'}</h4>
                        <p>{loadingData ? 'Fetching student records, placements, and supervisor links.' : 'Adjust the filters or clear the supervisor view to see more students.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.map(s => {
                  const sid = s._id || s.id;
                  // Resolve company name — try populated object first, then lookup, then stored strings
                  const companyName = (typeof s.companyId === 'object' && s.companyId?.name)
                    ? s.companyId.name
                    : s.companyName
                    || (() => {
                        const cid = (typeof s.companyId === 'object' ? s.companyId?._id : s.companyId);
                        const found = cid ? companies.find(co => (co._id||co.id)?.toString() === cid?.toString()) : null;
                        return found?.name;
                      })()
                    || (typeof s.company === 'string' ? s.company : s.company?.name)
                    || '—';
                  const isPlaced = s.placementStatus === 'Active' || s.status === 'Placed';
                  return (
                    <tr key={sid}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.indexNumber || s.index || '—'}</td>
                      <td>{s.department || s.dept || '—'}</td>
                      <td><span className={`badge-pill-${isPlaced ? 'green' : 'amber'}`}>{s.placementStatus || s.status || 'Unplaced'}</span></td>
                      <td>{companyName}</td>
                      <td style={{textAlign:'right'}}>
                        <div className="action-group-sm" style={{justifyContent:'flex-end'}}>
                          <button className="btn-manage-student" onClick={() => { setSelectedStudentManage(s); setIsStudentDrawerOpen(true); }}>
                            Manage <Settings size={14} />
                          </button>
                          {filterSupervisor && (s.academicSupervisor) && (
                            <button
                              className="btn-outline-amber"
                              style={{fontSize:'12px', padding:'4px 10px'}}
                              title="Remove supervisor assignment"
                              onClick={async () => {
                                if (!window.confirm(`Unassign supervisor from ${s.name}?`)) return;
                                try {
                                  await api.unassignStudent(sid);
                                  setStudents(prev => prev.map(st =>
                                    (st._id||st.id).toString() === sid.toString()
                                      ? { ...st, academicSupervisor: null }
                                      : st
                                  ));
                                  flashMsg(`Supervisor unassigned from ${s.name}.`);
                                } catch (err) { flashMsg(err.message || 'Unassign failed.', 'error'); }
                              }}
                            >
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {/* Management drawer */}
      {isStudentDrawerOpen && selectedStudentManage && (
        <AdminStudentDrawer
          student={selectedStudentManage}
          onClose={() => setIsStudentDrawerOpen(false)}
          onStudentUpdated={(id, patch) => {
            setStudents(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, ...patch } : s));
          }}
          onStudentDeleted={(id) => {
            setStudents(prev => prev.filter(s => (s._id||'').toString() !== id.toString() && (s.id||'').toString() !== id.toString()));
            setIsStudentDrawerOpen(false);
          }}
        />
      )}
          </div>
    </div>
        );

      case 'documents':
        return (
          <div className="admin-tab-shell fade-in">
            {renderTabBanner('documents', [
              { label: 'Format', value: 'PDF' },
              { label: 'Audience', value: 'All' },
            ])}
            <AdminDocumentsTab />
          </div>
        );

      case 'reports':
        return (
          <div className="admin-tab-shell fade-in">
            {renderTabBanner('reports', [
              { label: 'Type', value: 'Final Reports' },
              { label: 'Audience', value: 'Admin' },
            ])}
            <AdminReportsTab />
          </div>
        );

case 'supervisors':
  return (
    <div className="admin-tab-shell fade-in">
      {renderTabBanner('supervisors', [
        { label: 'Academic', value: supervisors.filter(s => s.role === 'academic').length },
        { label: 'Industrial', value: supervisors.filter(s => s.role === 'industrial').length },
      ])}
    <SupervisorsTab
      supervisors={supervisors}
      students={students}
      loadingData={loadingData}
      onAddLecturer={() => setIsAddLecturerModalOpen(true)}
      onSave={handleSaveSupervisor}
      onDelete={handleDeleteSupervisor}
      onViewStudents={(supId) => { setFilterSupervisor(supId); setTab('students'); }}
    />
    </div>
  );

     /* Inside AdminDashboard.js switch case 'assignments' */

case 'assignments':
  return (
    <div className="admin-tab-shell fade-in">
      {renderTabBanner('assignments', [], renderAssignmentStatsPanel())}
      <AssignmentTab />
    </div>
  );

      case 'overview':
default:
  return (
    <div className="overview-container fade-in">
      
      {(() => {
        const totalStudents   = students.length;
        const placedStudents  = students.filter(s => s.placementStatus === 'Active' || s.status === 'Placed').length;
        const gradedStudents  = students.filter(s => s.gradeStatus === 'Graded' || s.status === 'Graded').length;
        const totalSlots      = companies.reduce((sum, co) => sum + (Number(co.slots) || 0), 0);
        const assignedSups    = supervisors.filter(s => (s.studentCount || 0) > 0).length;
        const staffCovPct     = supervisors.length > 0 ? Math.round((assignedSups / supervisors.length) * 100) : 0;

        // Progress bar percentages
        const placedPct  = totalStudents > 0 ? Math.round((placedStudents  / totalStudents) * 100) : 0;
        const gradedPct  = totalStudents > 0 ? Math.round((gradedStudents  / totalStudents) * 100) : 0;

        // Students who have submitted at least one log
        const studentsWithLogs = new Set(grades.map(g => (g.student?._id || g.student || '').toString()));
        const logbookPct = totalStudents > 0 ? Math.round((studentsWithLogs.size / totalStudents) * 100) : 0;
        const progressItems = [
          { label: 'Placed', detail: 'Students placed', count: placedStudents, pct: placedPct, color: '#10b981', x: 150, filter: 'placed' },
          { label: 'Logbooks', detail: 'Students with logs', count: studentsWithLogs.size, pct: logbookPct, color: '#3b82f6', x: 320, filter: 'logs' },
          { label: 'Graded', detail: 'Grading completed', count: gradedStudents, pct: gradedPct, color: '#6366f1', x: 490, filter: 'graded' },
        ];
        const placedNotGraded = Math.max(placedStudents - gradedStudents, 0);
        const unplacedStudents = Math.max(totalStudents - placedStudents, 0);
        const distributionItems = [
          { label: 'Unplaced', detail: 'Awaiting placement', count: unplacedStudents, color: '#f59e0b', filter: 'unplaced' },
          { label: 'Placed', detail: 'Placed, not graded', count: placedNotGraded, color: '#10b981', filter: 'placed' },
          { label: 'Graded', detail: 'Completed grading', count: gradedStudents, color: '#6366f1', filter: 'graded' },
        ].filter(item => item.count > 0 || totalStudents === 0);
        const recentActivity = [
          placementRequests.length > 0 && {
            icon: ClipboardCheck,
            tone: 'amber',
            title: `${placementRequests.length} placement request${placementRequests.length === 1 ? '' : 's'} waiting`,
            meta: 'Review self-placement submissions',
            action: () => setTab('pending-placements'),
          },
          placedStudents > 0 && {
            icon: Building2,
            tone: 'emerald',
            title: `${placedStudents} student${placedStudents === 1 ? '' : 's'} currently placed`,
            meta: `${placedPct}% placement completion`,
            action: () => jumpToStudents('placed'),
          },
          supervisors.length > 0 && {
            icon: UserCheck,
            tone: 'indigo',
            title: `${assignedSups} supervisor${assignedSups === 1 ? '' : 's'} carrying load`,
            meta: `${staffCovPct}% staff coverage`,
            action: () => setTab('assignments'),
          },
          notifications.length > 0 && {
            icon: Bell,
            tone: 'blue',
            title: `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`,
            meta: 'Check broadcasts and system alerts',
            action: () => setShowNotifications(true),
          },
        ].filter(Boolean);
        const overviewStatCards = (
          <div className="overview-grid overview-banner-cards">
            <div className="stat-card">
              <div className="stat-header"><Users size={20} className="text-blue" /></div>
              <div className="stat-body">
                <p className="stat-label">Total Interns</p>
                <h3>{totalStudents}</h3>
              </div>
              <small>Registered Students</small>
            </div>

            <div className="stat-card">
              <div className="stat-header"><Building2 size={20} className="text-emerald" /></div>
              <div className="stat-body">
                <p className="stat-label">Partner Slots</p>
                <h3>{totalSlots}</h3>
              </div>
              <small>Across {companies.length} Firms</small>
            </div>

            <div className="stat-card alert-border">
              <div className="stat-header">
                <ClipboardCheck size={20} className="text-amber" />
                {placementRequests.length > 0 && <div className="pulse-dot"></div>}
              </div>
              <div className="stat-body">
                <p className="stat-label">Pending Requests</p>
                <h3 className="text-amber">{placementRequests.length}</h3>
              </div>
              <button className="text-link-btn-sm" onClick={() => setTab('pending-placements')}>Review Now →</button>
            </div>

            <div className="stat-card">
              <div className="stat-header"><UserCheck size={20} className="text-indigo" /></div>
              <div className="stat-body">
                <p className="stat-label">Staff Coverage</p>
                <h3>{staffCovPct}%</h3>
              </div>
              <small>{assignedSups} of {supervisors.length} Lecturers Assigned</small>
            </div>
          </div>
        );

        return (
          <>
            <div className="admin-tab-banner overview-command-banner" style={{ '--tab-accent': TAB_META.overview.accent }}>
              <div className="admin-tab-banner-main">
                <div className="admin-tab-icon">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <p className="admin-tab-eyebrow">{TAB_META.overview.eyebrow}</p>
                  <h1>{TAB_META.overview.title}</h1>
                  <p>{TAB_META.overview.description}</p>
                </div>
              </div>
              {overviewStatCards}
            </div>
            <div className="content-card placement-chart-card overview-chart-primary">
              <div className="placement-chart-header">
                <div>
                  <h4>Placement Progress</h4>
                  <p className="sub-text-sm">Current season completion by workflow stage.</p>
                </div>
                <div className="placement-chart-controls">
                  <span className="placement-chart-total">{totalStudents} students</span>
                  <div className="chart-toggle" aria-label="Chart type">
                    <button className={overviewChartType === 'bar' ? 'active' : ''} onClick={() => setOverviewChartType('bar')}>Bar</button>
                    <button className={overviewChartType === 'pie' ? 'active' : ''} onClick={() => setOverviewChartType('pie')}>Pie</button>
                  </div>
                </div>
              </div>

              <div className="placement-chart-wrap">
                {overviewChartType === 'bar' ? (
                  <svg className="placement-bar-chart" viewBox="0 0 640 280" role="img" aria-label="Placement progress bar chart">
                    {[0, 25, 50, 75, 100].map((tick) => {
                      const y = 230 - (tick / 100) * 190;
                      return (
                        <g key={tick}>
                          <line x1="70" x2="600" y1={y} y2={y} className="placement-chart-grid" />
                          <text x="48" y={y + 5} className="placement-chart-axis">{tick}%</text>
                        </g>
                      );
                    })}
                    <line x1="70" x2="600" y1="230" y2="230" className="placement-chart-baseline" />
                    {progressItems.map(({ label, pct, color, x, filter }) => {
                      const barHeight = Math.max((pct / 100) * 190, pct > 0 ? 8 : 0);
                      const y = 230 - barHeight;
                      return (
                        <g key={label} className="placement-chart-click" onClick={() => jumpToStudents(filter)}>
                          <rect x={x - 46} y="28" width="92" height="226" rx="14" className="placement-chart-hit" />
                          <rect x={x - 38} y={y} width="76" height={barHeight} rx="12" fill={color} />
                          {barHeight > 24 && <rect x={x - 27} y={y + 10} width="54" height="14" rx="7" className="placement-chart-shine" />}
                          <text x={x} y={Math.max(y - 12, 22)} textAnchor="middle" className="placement-chart-value">{pct}%</text>
                          <text x={x} y="258" textAnchor="middle" className="placement-chart-label">{label}</text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="placement-donut-chart" role="img" aria-label="Placement progress pie chart">
                    <svg viewBox="0 0 260 260">
                      <circle cx="130" cy="130" r="92" fill="none" stroke="#e8eef6" strokeWidth="32" />
                      {(() => {
                        const circumference = 2 * Math.PI * 92;
                        let offset = 0;
                        return distributionItems.map(item => {
                          const pct = totalStudents > 0 ? item.count / totalStudents : 0;
                          const length = pct * circumference;
                          const slice = (
                            <circle
                              key={item.label}
                              className="placement-chart-click"
                              onClick={() => jumpToStudents(item.filter)}
                              cx="130"
                              cy="130"
                              r="92"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="32"
                              strokeDasharray={`${length} ${circumference - length}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              transform="rotate(-90 130 130)"
                            />
                          );
                          offset += length;
                          return slice;
                        });
                      })()}
                      <circle cx="130" cy="130" r="58" fill="#fff" />
                      <text x="130" y="125" textAnchor="middle" className="placement-donut-value">{placedPct}%</text>
                      <text x="130" y="148" textAnchor="middle" className="placement-donut-label">placed</text>
                    </svg>
                  </div>
                )}

                <div className="placement-chart-legend">
                  {(overviewChartType === 'bar' ? progressItems : distributionItems.map(item => ({
                    ...item,
                    pct: totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0,
                  }))).map(item => (
                    <button className="placement-chart-legend-item" key={item.label} onClick={() => jumpToStudents(item.filter)}>
                      <span style={{ background: item.color }} />
                      <div>
                        <strong>{item.count}/{totalStudents || 0}</strong>
                        <small>{item.detail}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overview-grid">
              <div className="stat-card">
                <div className="stat-header"><Users size={20} className="text-blue" /></div>
                <div className="stat-body">
                  <p className="stat-label">Total Interns</p>
                  <h3>{totalStudents}</h3>
                </div>
                <small>Registered Students</small>
              </div>

              <div className="stat-card">
                <div className="stat-header"><Building2 size={20} className="text-emerald" /></div>
                <div className="stat-body">
                  <p className="stat-label">Partner Slots</p>
                  <h3>{totalSlots}</h3>
                </div>
                <small>Across {companies.length} Firms</small>
              </div>

              <div className="stat-card alert-border">
                <div className="stat-header">
                  <ClipboardCheck size={20} className="text-amber" />
                  {placementRequests.length > 0 && <div className="pulse-dot"></div>}
                </div>
                <div className="stat-body">
                  <p className="stat-label">Pending Requests</p>
                  <h3 className="text-amber">{placementRequests.length}</h3>
                </div>
                <button className="text-link-btn-sm" onClick={() => setTab('pending-placements')}>Review Now →</button>
              </div>

              <div className="stat-card">
                <div className="stat-header"><UserCheck size={20} className="text-indigo" /></div>
                <div className="stat-body">
                  <p className="stat-label">Staff Coverage</p>
                  <h3>{staffCovPct}%</h3>
                </div>
                <small>{assignedSups} of {supervisors.length} Lecturers Assigned</small>
              </div>
            </div>

            {/* Overview supporting panels */}
            <div className="overview-middle-row" style={{ marginTop: '25px' }}>
              <div className="content-card flex-2 recent-activity-card">
                <div className="card-header-actions compact">
                  <div>
                    <h4>Recent Activity</h4>
                    <p className="sub-text-sm">Shortcuts to the areas that need attention.</p>
                  </div>
                  <button className="text-link-btn-sm" onClick={() => setShowNotifications(true)}>Open alerts</button>
                </div>
                <div className="recent-activity-list">
                  {recentActivity.length === 0 ? (
                    <div className="recent-activity-empty">
                      <CheckCircle2 size={22} />
                      <span>No urgent admin activity right now.</span>
                    </div>
                  ) : recentActivity.map(({ icon: ActivityIcon, tone, title, meta, action }) => (
                    <button className="recent-activity-row" key={title} onClick={action}>
                      <span className={`recent-activity-icon ${tone}`}><ActivityIcon size={16} /></span>
                      <span>
                        <strong>{title}</strong>
                        <small>{meta}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="content-card flex-1">
                <h4>Season Info</h4>
                <div className="health-stats">
                  <div className="health-item">
                    <span className="dot online" /> <strong>Year:</strong> <span>{settings?.academicYear || '—'}</span>
                  </div>
                  <div className="health-item">
                    <span className="dot online" /> <strong>Semester:</strong> <span>{settings?.semester || '—'}</span>
                  </div>
                  <div className="health-item">
                    <span className="dot online" /> <strong>Duration:</strong> <span>{settings?.totalWeeks || '—'} weeks</span>
                  </div>
                  <div className="health-item">
                    <span className={`dot ${settings?.allowSelfPlacement ? 'online' : 'warning'}`} />
                    <strong>Self-Placement:</strong>
                    <span className={settings?.allowSelfPlacement ? 'text-emerald' : 'text-amber'}>
                      {settings?.allowSelfPlacement ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
      case 'settings': {
        const sForm = settings || {};

        const handleSettingsSave = async () => {
          setSettingsSaving(true);
          setSettingsMsg('');
          try {
            const res = await api.updateSettings({
              academicYear:             sForm.academicYear,
              semester:                 sForm.semester,
              portalOpenDate:           sForm.portalOpenDate || null,
              submissionDeadline:       sForm.submissionDeadline || null,
              totalWeeks:               Number(sForm.totalWeeks)       || 6,
              weightIndustrial:         Number(sForm.weightIndustrial) || 40,
              weightAcademic:           Number(sForm.weightAcademic)   || 30,
              weightLogbook:            Number(sForm.weightLogbook)    || 30,
              geofenceEnabled:          sForm.geofenceEnabled !== false,
              geofenceRadius:           Number(sForm.geofenceRadius)   || 150,
              attendanceMode:           sForm.attendanceMode,
              strictTimeWindow:         !!sForm.strictTimeWindow,
              allowSelfPlacement:       !!sForm.allowSelfPlacement,
              industrialPortalEnabled:  !!sForm.industrialPortalEnabled,
              activityCategories:       sForm.activityCategories || [],
            });
            setSettings(res?.data || res);
            setSettingsMsg('Settings saved successfully.');
          } catch (err) {
            setSettingsMsg(err.message || 'Failed to save.');
          } finally {
            setSettingsSaving(false);
          }
        };

        const handleAddDept = async (name) => {
          if (!name.trim()) return;
          try {
            const res = await api.addDepartment(name.trim());
            const newDepts = res?.data || res;
            setSettings(prev => ({ ...prev, departments: newDepts }));
          } catch (err) {
            setSettingsMsg(err.message || 'Failed to add department.');
          }
        };

        const handleRemoveDept = async (name) => {
          try {
            const res = await api.removeDepartment(name);
            const newDepts = res?.data || res;
            setSettings(prev => ({ ...prev, departments: newDepts }));
          } catch (err) {
            setSettingsMsg(err.message || 'Failed to remove department.');
          }
        };

        const setSField = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

        // Convert a date value (ISO string or Date object) to YYYY-MM-DD
        // using LOCAL timezone so date inputs never show the wrong day
        const toLocalDateStr = (val) => {
          if (!val) return '';
          const d = new Date(val);
          if (isNaN(d)) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const weightsTotal = (Number(sForm.weightIndustrial)||0) + (Number(sForm.weightAcademic)||0) + (Number(sForm.weightLogbook)||0);

        return (
          <div className="admin-tab-shell fade-in">
          {renderTabBanner('settings', [
            { label: 'Season', value: sForm.academicYear || 'Set up' },
            { label: 'Grade Weight', value: weightsTotal + '%' },
          ])}
          <div className="content-card fade-in">
            <div className="card-header-actions">
              <div>
                <h3>System Configuration</h3>
                <p className="sub-text-sm">Global control panel for the {sForm.academicYear || '—'} internship season.</p>
              </div>
              <button className="primary-btn" onClick={() => setIsAddAdminModalOpen(true)}>
                <PlusCircle size={16} /> Add Admin User
              </button>
            </div>

            {settingsMsg && (
              <div style={{padding:'10px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px',
                background: settingsMsg.startsWith('Settings saved') ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${settingsMsg.startsWith('Settings saved') ? '#86efac' : '#fca5a5'}`,
                color: settingsMsg.startsWith('Settings saved') ? '#15803d' : '#dc2626'}}>
                {settingsMsg}
              </div>
            )}

            {!settings ? (
              <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#94a3b8', padding:'20px 0'}}>
                <Loader size={18} style={{animation:'spin 1s linear infinite'}} /> Loading settings…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <div className="settings-container-scroll">
                <div className="settings-grid">

                  {/* ── SECTION 1: SEASON ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><Calendar size={18} /> Internship Season</h4>
                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Academic Year</label>
                        <input type="text" className="admin-input-select" value={sForm.academicYear || ''} onChange={e => setSField('academicYear', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Semester</label>
                        <select className="admin-input-select" value={sForm.semester || 'Semester 1'} onChange={e => setSField('semester', e.target.value)}>
                          <option>Semester 1</option>
                          <option>Semester 2</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-grid-2" style={{marginTop:'15px'}}>
                      <div className="input-group">
                        <label>Portal Opening Date</label>
                        <input type="date" className="admin-input-select"
                          value={sForm.portalOpenDate ? toLocalDateStr(sForm.portalOpenDate) : ''}
                          onChange={e => setSField('portalOpenDate', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Final Submission Deadline</label>
                        <input type="date" className="admin-input-select"
                          value={sForm.submissionDeadline ? toLocalDateStr(sForm.submissionDeadline) : ''}
                          onChange={e => setSField('submissionDeadline', e.target.value)} />
                      </div>
                    </div>
                    <div className="input-group" style={{marginTop:'15px'}}>
                      <label>Internship Duration (Weeks)</label>
                      <select className="admin-input-select" value={sForm.totalWeeks || 6} onChange={e => setSField('totalWeeks', Number(e.target.value))}>
                        {[4,6,8,10,12].map(w => <option key={w} value={w}>{w} Weeks</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ── SECTION 2: GRADING WEIGHTS ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><ShieldCheck size={18} /> Score Distribution</h4>
                    <p className="helper-text-sm">Configure how the final 100% grade is calculated.
                      <strong style={{marginLeft:'6px', color: weightsTotal !== 100 ? '#dc2626' : '#10b981'}}>
                        Total: {weightsTotal}%
                      </strong>
                    </p>
                    <div className="weight-stack">
                      {[
                        { label: 'Industrial Supervisor', key: 'weightIndustrial' },
                        { label: 'Academic Supervisor',   key: 'weightAcademic' },
                        { label: 'Logbook & Final Report',key: 'weightLogbook' },
                      ].map(({ label, key }) => (
                        <div className="weight-input-item" key={key}>
                          <span>{label}</span>
                          <div className="input-with-unit">
                            <input type="number" min="0" max="100" className="weight-field"
                              value={sForm[key] ?? ''}
                              onChange={e => setSField(key, Number(e.target.value))} />
                            <span className="unit">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 3: GEOFENCING ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><MapPin size={18} /> Geofencing Parameters</h4>
                    <div className="input-group">
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                        <label style={{margin:0}}>Verification Radius (meters)</label>
                        <div className="input-with-unit" style={{width:'100px'}}>
                          <input 
                            type="number" 
                            min="10" 
                            max="5000" 
                            className="weight-field"
                            value={sForm.geofenceRadius || 150}
                            onChange={e => setSField('geofenceRadius', Number(e.target.value))} 
                          />
                          <span className="unit">m</span>
                        </div>
                      </div>
                      <input type="range" min="50" max="1000" step="50" className="admin-slider"
                        value={sForm.geofenceRadius || 150}
                        onChange={e => setSField('geofenceRadius', Number(e.target.value))} />
                      <div className="slider-labels">
                        <span>50m (Strict)</span>
                        <span>1000m (Relaxed)</span>
                      </div>
                    </div>
                    <div className="input-group" style={{marginTop:'20px'}}>
                      <label>Attendance Mode</label>
                      <select className="admin-input-select" value={sForm.attendanceMode || 'gps+timestamp'} onChange={e => setSField('attendanceMode', e.target.value)}>
                        <option value="gps+timestamp">GPS + Timestamp (Recommended)</option>
                        <option value="gps+selfie">GPS + Selfie Upload</option>
                        <option value="manual">Manual (No GPS)</option>
                      </select>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'16px'}}>
                      <label className="ui-switch">
                        <input type="checkbox" checked={sForm.geofenceEnabled !== false} onChange={e => setSField('geofenceEnabled', e.target.checked)} />
                        <span className="slider-round" />
                      </label>
                      <div>
                        <strong style={{fontSize:'13px'}}>Enable GPS Geofencing</strong>
                        <p style={{fontSize:'12px', color:'#64748b', margin:0}}>Disable to allow log submission from any location (useful during testing).</p>
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'16px'}}>
                      <label className="ui-switch">
                        <input type="checkbox" checked={!!sForm.strictTimeWindow} onChange={e => setSField('strictTimeWindow', e.target.checked)} />
                        <span className="slider-round" />
                      </label>
                      <div>
                        <strong style={{fontSize:'13px'}}>Strict Time Window</strong>
                        <p style={{fontSize:'12px', color:'#64748b', margin:0}}>Only allow log submissions between 07:00 and 18:00 GMT.</p>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 4: DEPARTMENTS ── */}
                  <div className="settings-section">
                    <h4 className="settings-title"><Building2 size={18} /> Active Departments</h4>
                    <p className="helper-text-sm" style={{marginBottom:'12px'}}>These appear in student registration and assignment dropdowns.</p>
                    <div className="dept-tags-grid">
                      {(sForm.departments || []).map(dept => (
                        <div key={dept} className="dept-pill">
                          {dept}
                          <button style={{background:'none', border:'none', cursor:'pointer', padding:'0 2px', display:'flex', alignItems:'center'}}
                            title={`Remove ${dept}`}
                            onClick={() => handleRemoveDept(dept)}>
                            <X size={14} className="remove-pill" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <input
                        type="text"
                        className="admin-input-select"
                        placeholder="New department name…"
                        style={{flex:1, fontSize:'13px'}}
                        value={newDeptInput}
                        onChange={e => setNewDeptInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { handleAddDept(newDeptInput); setNewDeptInput(''); }}}
                      />
                      <button className="primary-btn" style={{whiteSpace:'nowrap'}}
                        onClick={() => { handleAddDept(newDeptInput); setNewDeptInput(''); }}>
                        <PlusCircle size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {/* ── SECTION 5: ACTIVITY CATEGORIES ── */}
                  <div className="settings-section full-width">
                    <h4 className="settings-title"><ClipboardCheck size={18} /> Daily Log Activity Categories</h4>
                    <p className="helper-text-sm" style={{marginBottom:'12px'}}>Students see these as checkboxes when logging daily activities. Grouped by type.</p>

                    {/* ── Activity Group Management ── */}
                    {(() => {
                      const cats = sForm.activityCategories || [];
                      const existingGroups = [...new Set(cats.map(c => c.group))];
                      return (
                        <div style={{marginBottom:'18px', padding:'16px', background:'linear-gradient(135deg, #f0f9ff, #eff6ff)', border:'1px solid #bae6fd', borderRadius:'12px'}}>
                          <p style={{fontSize:'12px', fontWeight:800, color:'#0369a1', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 10px', display:'flex', alignItems:'center', gap:'6px'}}>
                            <FolderKanban size={14} /> Activity Groups
                          </p>
                          <div className="dept-tags-grid">
                            {existingGroups.map(gName => {
                              const count = cats.filter(c => c.group === gName).length;
                              return (
                                <div key={gName} className="dept-pill" style={{background:'#fff', border:'1.5px solid #93c5fd'}}>
                                  <span style={{fontWeight:700}}>{gName}</span>
                                  <span style={{fontSize:'10px', background:'#dbeafe', color:'#1d4ed8', padding:'1px 6px', borderRadius:'20px', fontWeight:700, marginLeft:'4px'}}>{count}</span>
                                  <button style={{background:'none', border:'none', cursor:'pointer', padding:'0 2px', display:'flex', alignItems:'center'}}
                                    title={`Remove group "${gName}" and all its activities`}
                                    onClick={() => {
                                      if (!window.confirm(`Remove group "${gName}" and its ${count} activities?`)) return;
                                      const updated = cats.filter(c => c.group !== gName);
                                      setSField('activityCategories', updated);
                                      if (newCatGroup === gName) setNewCatGroup(existingGroups.find(g => g !== gName) || 'General');
                                    }}>
                                    <X size={14} className="remove-pill" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{display:'flex', gap:'8px', marginTop:'10px', alignItems:'center'}}>
                            <input
                              type="text"
                              className="admin-input-select"
                              placeholder="New group name… e.g. Research & Innovation"
                              style={{flex:1, fontSize:'13px'}}
                              value={newGroupInput}
                              onChange={e => setNewGroupInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && newGroupInput.trim()) {
                                  const trimmed = newGroupInput.trim();
                                  if (existingGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
                                    setSettingsMsg('This group already exists.');
                                  } else {
                                    // Add a placeholder activity so the group is created
                                    const placeholderKey = trimmed.toLowerCase().replace(/[\s/&]+/g, '_').replace(/[^a-z0-9_]/g, '') + '_general';
                                    setSField('activityCategories', [...cats, { key: placeholderKey, label: 'General ' + trimmed, group: trimmed }]);
                                    setNewCatGroup(trimmed);
                                    setSettingsMsg('Group "' + trimmed + '" created with a default activity. You can rename or remove it.');
                                  }
                                  setNewGroupInput('');
                                }
                              }}
                            />
                            <button className="primary-btn" style={{whiteSpace:'nowrap'}}
                              onClick={() => {
                                if (!newGroupInput.trim()) return;
                                const trimmed = newGroupInput.trim();
                                if (existingGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
                                  setSettingsMsg('This group already exists.');
                                } else {
                                  const placeholderKey = trimmed.toLowerCase().replace(/[\s/&]+/g, '_').replace(/[^a-z0-9_]/g, '') + '_general';
                                  setSField('activityCategories', [...cats, { key: placeholderKey, label: 'General ' + trimmed, group: trimmed }]);
                                  setNewCatGroup(trimmed);
                                  setSettingsMsg('Group "' + trimmed + '" created with a default activity. You can rename or remove it.');
                                }
                                setNewGroupInput('');
                              }}>
                              <PlusCircle size={14} /> Add Group
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Current categories grouped */}
                    {(() => {
                      const cats = sForm.activityCategories || [];
                      const groups = {};
                      cats.forEach((c, i) => { if (!groups[c.group]) groups[c.group] = []; groups[c.group].push({ ...c, _idx: i }); });
                      const GROUP_COLORS = GROUP_STYLES;
                      const DEFAULT_COLOR = DEFAULT_GROUP_STYLE;
                      return Object.entries(groups).map(([groupName, items]) => {
                        const gc = GROUP_COLORS[groupName] || DEFAULT_COLOR;
                        const GroupIcon = gc.Icon;
                        return (
                          <div key={groupName} style={{marginBottom:'14px', padding:'12px 14px', background: gc.bg, border:`1.5px solid ${gc.border}`, borderRadius:'10px'}}>
                            <p style={{fontSize:'11px', fontWeight:800, color: gc.text, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px'}}>
                              <GroupIcon size={13} /> {groupName}
                              <span style={{fontSize:'10px', background: gc.border, color:'#fff', padding:'1px 7px', borderRadius:'20px', fontWeight:700}}>{items.length}</span>
                            </p>
                            <div className="dept-tags-grid">
                              {items.map(item => (
                                <div key={item.key} className="dept-pill" style={{background:'#fff', borderColor: gc.border}}>
                                  {item.label}
                                  <button style={{background:'none', border:'none', cursor:'pointer', padding:'0 2px', display:'flex', alignItems:'center'}}
                                    title={`Remove ${item.label}`}
                                    onClick={() => {
                                      const updated = [...cats];
                                      updated.splice(item._idx, 1);
                                      setSField('activityCategories', updated);
                                    }}>
                                    <X size={14} className="remove-pill" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Add new category */}
                    <div style={{display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap', alignItems:'flex-end'}}>
                      <div className="input-group" style={{flex:'2', minWidth:'160px'}}>
                        <label>Activity Label</label>
                        <input
                          type="text"
                          className="admin-input-select"
                          placeholder="e.g. UI/UX Design"
                          style={{fontSize:'13px'}}
                          value={newCatLabel}
                          onChange={e => setNewCatLabel(e.target.value)}
                        />
                      </div>
                      <div className="input-group" style={{flex:'1', minWidth:'140px'}}>
                        <label>Assign to Group</label>
                        <select className="admin-input-select" style={{fontSize:'13px'}} value={newCatGroup} onChange={e => {
                          if (e.target.value === '__create_new__') {
                            setIsCreatingNewGroup(true);
                          } else {
                            setNewCatGroup(e.target.value);
                            setIsCreatingNewGroup(false);
                          }
                        }}>
                          {[...new Set((sForm.activityCategories || []).map(c => c.group))].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                          <option value="__create_new__">＋ Create New Group…</option>
                        </select>
                        {isCreatingNewGroup && (
                          <input
                            type="text"
                            className="admin-input-select"
                            placeholder="Type new group name…"
                            style={{fontSize:'13px', marginTop:'6px', borderColor:'#3b82f6'}}
                            autoFocus
                            onBlur={e => {
                              if (e.target.value.trim()) {
                                setNewCatGroup(e.target.value.trim());
                              }
                              setIsCreatingNewGroup(false);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                setNewCatGroup(e.target.value.trim());
                                setIsCreatingNewGroup(false);
                              }
                            }}
                          />
                        )}
                      </div>
                      <button className="primary-btn" style={{whiteSpace:'nowrap', height:'38px'}}
                        onClick={() => {
                          if (!newCatLabel.trim()) return;
                          const key = newCatLabel.trim().toLowerCase().replace(/[\s/]+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const current = sForm.activityCategories || [];
                          if (current.some(c => c.key === key)) { setSettingsMsg('This activity already exists.'); return; }
                          setSField('activityCategories', [...current, { key, label: newCatLabel.trim(), group: newCatGroup }]);
                          setNewCatLabel('');
                        }}>
                        <PlusCircle size={14} /> Add Activity
                      </button>
                    </div>
                    <p className="helper-text-sm" style={{marginTop:'10px', color:'#d97706', fontWeight:600, display:'flex', alignItems:'center', gap:'6px'}}><AlertTriangle size={14} /> Click "Save Global Configuration" below to persist changes.</p>
                  </div>

                  {/* ── SECTION 6: PORTAL ACCESS ── */}
                  <div className="settings-section full-width">
                    <h4 className="settings-title"><Settings size={18} /> Portal Access Control</h4>
                    <div className="portal-switches">
                      {[
                        { key:'allowSelfPlacement',      label:'Student Self-Placement Request', desc:'Allow students to submit companies not in the market.' },
                        { key:'industrialPortalEnabled',  label:'Industrial Supervisor Portal',   desc:'Enable/Disable external manager logbook grading.' },
                      ].map(({ key, label, desc }) => (
                        <div className="switch-row" key={key}>
                          <div className="switch-info">
                            <strong>{label}</strong>
                            <p>{desc}</p>
                          </div>
                          <label className="ui-switch">
                            <input type="checkbox" checked={!!sForm[key]} onChange={e => setSField(key, e.target.checked)} />
                            <span className="slider-round" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 7: ADMIN SECURITY ── */}
                  <div className="settings-section full-width admin-profile-card">
                    <div className="admin-profile-card-main">
                      <div className="admin-profile-avatar-lg">
                        {user?.profilePicture ? (
                          <img src={api.avatarUrl(user.profilePicture)} alt="Admin profile" />
                        ) : (
                          adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'
                        )}
                      </div>
                      <div className="admin-profile-summary">
                        <p className="admin-profile-eyebrow">Signed-in Administrator</p>
                        <h4>{adminName}</h4>
                        <span><Mail size={14} /> {user?.email || 'Email not available'}</span>
                      </div>
                    </div>
                    <div className="admin-profile-meta-grid">
                      <div className="admin-profile-meta-item">
                        <span>Role</span>
                        <strong>{adminRoleLabel}</strong>
                      </div>
                      <div className="admin-profile-meta-item">
                        <span>Last Login</span>
                        <strong>{adminLastLogin}</strong>
                      </div>
                      <div className="admin-profile-meta-item">
                        <span>Password Status</span>
                        <strong className={`admin-profile-status ${adminPasswordStatus.tone}`}>
                          {adminPasswordStatus.tone === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          {adminPasswordStatus.label}
                        </strong>
                        <small>{adminPasswordStatus.detail}</small>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section full-width admin-security-section">
                    <div className="admin-security-heading">
                      <div>
                        <h4 className="settings-title"><ShieldCheck size={18} /> Admin Password</h4>
                        <p className="helper-text-sm">Change the password for your signed-in administrator account.</p>
                      </div>
                      <span className="admin-security-badge">Account Security</span>
                    </div>

                    {adminPassword.status.msg && (
                      <div className={`admin-password-status ${adminPassword.status.type === 'success' ? 'success' : 'error'}`}>
                        {adminPassword.status.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                        {adminPassword.status.msg}
                      </div>
                    )}

                    <form className="admin-password-form" onSubmit={adminPassword.submit}>
                      <div className="form-grid-3">
                        <div className="input-group">
                          <label>Current Password</label>
                          <input
                            type={adminPassword.showPass ? 'text' : 'password'}
                            className="admin-input-select"
                            value={adminPassword.fields.current}
                            onChange={e => adminPassword.set('current', e.target.value)}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>New Password</label>
                          <input
                            type={adminPassword.showPass ? 'text' : 'password'}
                            className="admin-input-select"
                            value={adminPassword.fields.next}
                            onChange={e => adminPassword.set('next', e.target.value)}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Confirm New Password</label>
                          <input
                            type={adminPassword.showPass ? 'text' : 'password'}
                            className="admin-input-select"
                            value={adminPassword.fields.confirm}
                            onChange={e => adminPassword.set('confirm', e.target.value)}
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            required
                          />
                        </div>
                      </div>

                      <div className="admin-password-actions">
                        <button
                          type="button"
                          className="btn-outline-lite"
                          onClick={() => adminPassword.setShowPass(!adminPassword.showPass)}
                        >
                          {adminPassword.showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          {adminPassword.showPass ? 'Hide Passwords' : 'Show Passwords'}
                        </button>
                        <button type="submit" className="primary-btn" disabled={adminPassword.saving}>
                          {adminPassword.saving
                            ? <><Loader size={14} style={{animation:'spin 1s linear infinite'}} /> Updating…</>
                            : <><ShieldCheck size={15} /> Update Admin Password</>}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            )}

            <div className="settings-action-footer">
              <p className="sub-text-sm">
                {settings?.updatedAt ? `Last saved: ${new Date(settings.updatedAt).toLocaleString()}` : ''}
              </p>
              <button className="primary-btn" onClick={handleSettingsSave} disabled={settingsSaving || weightsTotal !== 100}>
                {settingsSaving ? <><Loader size={14} style={{animation:'spin 1s linear infinite'}} /> Saving…</> : 'Save Global Configuration'}
              </button>
            </div>
          </div>
          </div>
        );
      }
    }
  };

  // Full-screen loading state on first load
  if (loadingData && !hasLoadedData) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', background:'#f8fafc', fontFamily:'Inter, sans-serif' }}>
        <div className="admin-state admin-state-loading" style={{ minHeight:'240px', width:'min(90vw, 440px)' }}>
          <div className="admin-state-icon">
            <Loader size={22} style={{ animation:'spin 0.8s linear infinite' }} />
          </div>
          <h4>Loading InternTrack</h4>
          <p>Preparing dashboard data, placement activity, and supervisor coverage.</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', background:'#f8fafc', fontFamily:'Inter, sans-serif' }}>
        <div className="admin-state admin-state-error" style={{ minHeight:'260px', width:'min(90vw, 480px)' }}>
          <div className="admin-state-icon">
            <AlertTriangle size={24} />
          </div>
          <h4>Dashboard failed to load</h4>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()} className="admin-state-action">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`sidebar${isSidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>InternTrack Admin</span>
            <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-group">
              <label>MAIN MENU</label>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                <li className={activeTab === 'overview'           ? 'active' : ''} onClick={() => setTab('overview')}><LayoutDashboard size={20} /> Overview</li>
                <li className={activeTab === 'pending-placements' ? 'active' : ''} onClick={() => setTab('pending-placements')}><ClipboardCheck size={20} /> Placement Requests</li>
                <li className={activeTab === 'companies'          ? 'active' : ''} onClick={() => setTab('companies')}><Building2 size={20} /> Company Slots</li>
                <li className={activeTab === 'documents'          ? 'active' : ''} onClick={() => setTab('documents')}><FileDown size={20} /> Attachment Letters</li>
                <li className={activeTab === 'reports'            ? 'active' : ''} onClick={() => setTab('reports')}><FolderKanban size={20} /> Final Reports</li>
                <li className={activeTab === 'assignments'        ? 'active' : ''} onClick={() => setTab('assignments')}><Link2 size={20} /> Assignments</li>
                <li className={activeTab === 'supervisors'        ? 'active' : ''} onClick={() => setTab('supervisors')}><UserCheck size={20} /> Supervisors</li>
                <li className={activeTab === 'students'           ? 'active' : ''} onClick={() => setTab('students')}><Users size={20} /> Students</li>
                <li className={activeTab === 'settings'           ? 'active' : ''} onClick={() => setTab('settings')}><Settings size={20} /> Settings</li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><LogOut size={20} /> Logout</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <div className="breadcrumb">Admin / {activeTab.replace('-', ' ').toUpperCase()}</div>
          </div>
          <div className="top-nav-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search across portal..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="top-nav-right">
            <div className="notification-wrapper">
              <div className="bell-trigger" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              {showNotifications && (
                <div className="notification-dropdown fade-in">
                  <div className="notif-header">
                    <span>Notifications</span>
                    <div className="notif-header-actions">
                      {unreadCount > 0 && <button className="text-link-btn-sm" onClick={handleMarkAllNotificationsRead}>Mark read</button>}
                      <button className="text-link-btn-sm" onClick={() => setShowNotifications(false)}>Close</button>
                    </div>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-item">
                        <div className="notif-content">
                          <p>No notifications yet.</p>
                          <small>Broadcasts and system alerts will appear here.</small>
                        </div>
                      </div>
                    ) : notifications.map(n => {
                      const nid = n._id || n.id;
                      const meta = getNotificationMeta(n);
                      const NotifIcon = meta.Icon;
                      const relatedPage = n.relatedPage || n.tab || n.actionTab || meta.tab;
                      return (
                      <div key={nid} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                        <button className="notif-main-action" onClick={() => handleNotificationRead(nid)}>
                          <div className={`notif-icon-circle ${meta.tone}`}>
                            <NotifIcon size={14} />
                          </div>
                          <div className="notif-content">
                            <div className="notif-title-row">
                              <p><strong>{n.subject || 'Notification'}</strong></p>
                              <span className={`notif-category ${meta.tone}`}>{meta.label}</span>
                            </div>
                            <small>{n.message}</small>
                            <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                          </div>
                        </button>
                        {relatedPage && (
                          <button className="notif-related-action" onClick={() => handleNotificationRelatedPage(n)}>
                            View related page
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-avatar">
              {user?.profilePicture ? (
                <img src={api.avatarUrl(user.profilePicture)} alt="Profile" />
              ) : (
                adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'
              )}
            </div>
          </div>
        </header>

        {/* Global action toast — replaces alert() */}
        {actionMsg.text && (
          <div style={{
            position:'fixed', top:'18px', right:'18px', zIndex:3000, maxWidth:'380px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            gap:'10px', padding:'12px 16px', fontSize:'13px', fontWeight:700,
            background: actionMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${actionMsg.type === 'error' ? '#fca5a5' : '#86efac'}`,
            borderRadius:'12px', boxShadow:'0 16px 36px rgba(15,23,42,0.18)',
            color: actionMsg.type === 'error' ? '#dc2626' : '#15803d',
          }}>
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg({ text:'', type:'' })}
              style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'16px', lineHeight:1, padding:0 }}>×</button>
          </div>
        )}

        <section className="page-content">
          {loadingData ? <TabLoadingState label="Refreshing admin data" /> : renderContent()}
        </section>
      </main>

      {/* MODALS */}
      {isVerifyModalOpen && selectedRequest && <VerificationModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} studentData={selectedRequest} lecturers={lecturers} onApprove={handleApproveWithFeedback} />}
      <AddCompanyModal isOpen={isAddCompanyModalOpen} onClose={() => setIsAddCompanyModalOpen(false)} onAdd={handleAddCompany} />
      {isProfileModalOpen && selectedCompany && <CompanyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        company={selectedCompany}
        students={students}
        onViewStudent={(s) => { setSelectedStudentManage(s); setIsStudentDrawerOpen(true); setIsProfileModalOpen(false); }}
      />}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={(s) => { if (s) setStudents(prev => [s, ...prev]); }}
      />
      <AddLecturerModal
        isOpen={isAddLecturerModalOpen}
        onClose={() => setIsAddLecturerModalOpen(false)}
        onLecturerAdded={(s) => { if (s) setSupervisors(prev => [s, ...prev]); }}
        onSupervisorAdded={(sup) => setSupervisors(prev => [sup, ...prev])}
      />
      <BulkBroadcasterModal isOpen={isBroadcasterOpen}onClose={() => setIsBroadcasterOpen(false)}studentCount={students.length}academicCount={supervisors.filter(s => s.role === 'academic').length}industrialCount={supervisors.filter(s => s.role === 'industrial').length}/>
      <ExportRegistryModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} students={students} />
      <AddAdminModal isOpen={isAddAdminModalOpen} onClose={() => setIsAddAdminModalOpen(false)} onAdminAdded={() => {}} />
    </div>
  );
};

export default AdminDashboard;
