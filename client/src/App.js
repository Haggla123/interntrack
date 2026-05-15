// src/App.js
import React from 'react';
import './design-system.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ToastProvider from './components/common/ToastProvider';
import ErrorBoundary from './components/common/ErrorBoundary';

import Home                from './pages/Home';
import Login               from './Login';
import AdminDashboard      from './pages/AdminDashboard';
import AcademicDashboard   from './pages/AcademicDashboard';
import StudentDashboard    from './pages/StudentDashboard';
import IndustrialDashboard from './pages/IndustrialDashboard';
import CompanyManagerDashboard from './pages/CompanyManagerDashboard';
import ChangePassword      from './pages/ChangePassword';
import NotFound            from './pages/NotFound';
import LogbookHistory      from './components/student/LogbookHistory';

const ROLE_HOME = {
  student:         '/student',
  academic:        '/academic',
  industrial:      '/industrial',
  company_manager: '/company-manager',
  industry:        '/industrial',
};

function AdminEntry() {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Login adminOnly />;
  }

  if (user.role !== 'admin') {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  if (user.needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return <AdminDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
        <Router>
          <Routes>

          {/* Public */}
          <Route path="/"      element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminEntry />} />

          {/* Academic supervisor */}
          <Route path="/academic" element={
            <PrivateRoute roles={['academic']}>
              <AcademicDashboard />
            </PrivateRoute>
          } />

          {/* Student */}
          <Route path="/student" element={
            <PrivateRoute roles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } />
          <Route path="/student/history" element={
            <PrivateRoute roles={['student']}>
              <LogbookHistory />
            </PrivateRoute>
          } />

          {/* change-password now requires authentication.*/}
          
          <Route path="/change-password" element={
            <PrivateRoute roles={['admin', 'student', 'academic', 'industrial', 'company_manager']}>
              <ChangePassword />
            </PrivateRoute>
          } />

          {/* Industrial supervisor */}
          <Route path="/industrial" element={
            <PrivateRoute roles={['industrial']}>
              <IndustrialDashboard />
            </PrivateRoute>
          } />

          {/* Company Manager / HR */}
          <Route path="/company-manager" element={
            <PrivateRoute roles={['company_manager']}>
              <CompanyManagerDashboard />
            </PrivateRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />

          </Routes>
        </Router>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
