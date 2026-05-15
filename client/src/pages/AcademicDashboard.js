import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import AcademicSidebar   from '../components/academic/AcademicSidebar';
import AcademicOverview  from '../components/academic/AcademicOverview';
import AssignedStudents  from '../components/academic/AssignedStudents';
import GradingSection    from '../components/academic/GradingSection';
import AcademicSettings  from '../components/academic/AcademicSettings';
import VisitScheduler    from '../components/academic/VisitScheduler';
import LogbookViewer     from '../components/academic/LogbookViewer';
import ReportReviewer    from '../components/academic/ReportReviewer';
import TabLoadingState   from '../components/common/TabLoadingState';
import { useAuth }       from '../context/AuthContext';
import { getStudents, getStudentStats, getVisits, getSettings, avatarUrl } from '../api';
import '../styles/AcademicDashboard.css';

// Normalise API student shape → shape child components expect
const norm = (s, stats) => {
  const sid = (s._id || s.id || '').toString();
  const st  = stats[sid] || {};
  return {
    id:         s._id || s.id,
    _id:        s._id || s.id,
    name:       s.name        || 'Unknown',
    index:      s.indexNumber || s.index || '',
    department: s.department  || '',
    email:      s.email       || '',
    phone:      s.phone       || '',
    company:         s.companyName || s.companyId?.name || (typeof s.company === 'string' ? s.company : '') || 'Not placed',
    location:        s.companyId?.location || s.location || '',
    category:        s.companyId?.category || s.category || '',
    supervisor:      s.companyId?.supervisorName || s.supervisorName || s.supervisor || '',
    supervisorEmail: s.companyId?.supervisorEmail || s.supervisorEmail || '',
    supervisorPhone: s.companyId?.supervisorPhone || s.supervisorPhone || '',
    // Pull from batch stats if available, fall back to student record values
    progress:   st.progress   ?? s.progress    ?? 0,
    weeks:      st.weeks      ?? s.weeks        ?? 0,
    indusScore: st.indusScore ?? s.indusScore   ?? s.industrialScore ?? 0,
    status:     (st.gradeId || s.gradeStatus === 'Graded') ? 'Graded' : 'Pending Grading',
    finalGrade: st.finalGrade !== '-' ? st.finalGrade : (s.finalGrade || '-'),
    gradeId:    st.gradeId    ?? s.gradeId    ?? null,
    lastVisit:  s.lastVisit   || 'None',
    placementStatus: s.placementStatus || s.status || 'Unplaced',
    profilePicture: s.profilePicture || null,
  };
};

const AcademicDashboard = () => {
  const { user, logout }            = useAuth();
  const [activeTab, setActiveTab]   = useState('overview');
  const [isSidebarOpen, setSidebar] = useState(false);
  const [nextVisit, setNextVisit]   = useState(null);
  const [visitedStudentIds, setVisitedIds] = useState(new Set());
  const [selectedStudent, setSelected]     = useState(null);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const supervisorName = user?.name || 'Academic Supervisor';
  const [totalWeeks, setTotalWeeks] = useState(6);

  useEffect(() => {
    getSettings()
      .then(res => {
        const data = res?.data || res || {};
        if (data.totalWeeks) setTotalWeeks(data.totalWeeks);
      })
      .catch(() => {});
  }, []);

  const loadStudents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Step 1 — fetch students (already scoped to this supervisor server-side)
      const res = await getStudents();
      const arr = Array.isArray(res) ? res
        : Array.isArray(res.data) ? res.data
        : Array.isArray(res.students) ? res.students : [];

      if (!arr.length) {
        setStudents([]);
        return;
      }

      // Step 2 — batch stats
      let statsMap = {};
      try {
        const ids = arr.map(s => (s._id || s.id).toString());
        const statsRes = await getStudentStats(ids, totalWeeks);
        statsMap = statsRes?.data || statsRes || {};
      } catch {
        // Fallback
      }

      setStudents(arr.map(s => norm(s, statsMap)));
    } catch { /* silent */ }
    finally { if (showLoading) setLoading(false); }
  }, [totalWeeks]);

  const loadVisits = useCallback(async () => {
    try {
      const res = await getVisits();
      const arr = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      const upcoming = arr
        .filter(v => v.status !== 'Completed' && v.status !== 'Cancelled' && new Date(v.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      setNextVisit(upcoming || null);
      const handledIds = new Set(
        arr
          .filter(v =>
            v.status === 'Completed' ||
            (v.status === 'Scheduled' && new Date(v.date) >= new Date())
          )
          .map(v => (v.student?._id || v.student || '').toString())
          .filter(Boolean)
      );
      setVisitedIds(handledIds);
    } catch { /* silent */ }
  }, []);

  // Load next visit and build visitedStudentIds set on mount
  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  useEffect(() => {
    loadStudents();
    const handleVisible = () => { if (document.visibilityState === 'visible') loadStudents(); };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [loadStudents]);

  const handleGradeUpdate = (studentId, grade) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId || s._id === studentId)
        ? { ...s, finalGrade: grade, status: 'Graded' } : s)
    );
  };

  const go = (tab) => {
    setActiveTab(tab);
    setSidebar(false);
    if (tab === activeTab) return;
    setLoading(true);
    Promise.allSettled([
      loadStudents(false),
      loadVisits(),
      new Promise(resolve => setTimeout(resolve, 250)),
    ]).finally(() => setLoading(false));
  };

  const renderContent = () => {
    if (loading) return <TabLoadingState label="Refreshing academic data" />;

    switch (activeTab) {
      case 'view-logbook': return <LogbookViewer student={selectedStudent} onBack={() => go('grading')} />;
      case 'view-report':  return <ReportReviewer student={selectedStudent} onBack={() => go('grading')} onGradeUpdate={handleGradeUpdate} />;
      case 'assigned':     return (
        <AssignedStudents
          students={students}
          visitedStudentIds={visitedStudentIds}
          onViewLogbook={(s) => { setSelected(s); go('view-logbook'); }}
          setActiveTab={go}
        />
      );
      case 'grading': return (
        <GradingSection
          students={students}
          setStudents={setStudents}
          setActiveTab={go}
          onViewLogbook={(s) => { setSelected(s); go('view-logbook'); }}
          onViewReport={(s)  => { setSelected(s); go('view-report');  }}
          onGradeUpdate={handleGradeUpdate}
        />
      );
      case 'visits':   return <VisitScheduler students={students} setNextVisit={setNextVisit} visitedStudentIds={visitedStudentIds} />;
      case 'settings': return <AcademicSettings handleLogout={() => logout()} />;
      default:         return (
        <AcademicOverview
          students={students}
          nextVisit={nextVisit}
          visitedStudentIds={visitedStudentIds}
          setActiveTab={go}
        />
      );
    }
  };

  return (
    <div className="admin-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}

      <AcademicSidebar
        activeTab={['view-logbook','view-report'].includes(activeTab) ? 'grading' : activeTab}
        setActiveTab={go}
        handleLogout={() => logout()}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setSidebar}
      />

      <main className="main-area">
        <header className="top-nav">
          <div className="top-nav-left">
            <button className="mobile-menu-toggle" onClick={() => setSidebar(true)}><Menu size={24} /></button>
            <div className="breadcrumb">
              University / <span className="active-breadcrumb">
                {activeTab === 'view-logbook' ? 'LOGBOOK REVIEW'
                  : activeTab === 'view-report' ? 'FINAL REPORT REVIEW'
                  : activeTab.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="admin-profile-pill">
            <span>{supervisorName}</span>
            <div className="admin-avatar academic">
              {user?.profilePicture ? (
                <img
                  src={avatarUrl(user.profilePicture)}
                  alt="Profile"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerText = supervisorName.charAt(0).toUpperCase(); }}
                />
              ) : (
                supervisorName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        <section className="page-content">{renderContent()}</section>
      </main>
    </div>
  );
};

export default AcademicDashboard;
