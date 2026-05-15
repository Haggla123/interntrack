import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, User, Eye, EyeOff, GraduationCap,
  Briefcase, ShieldCheck, ChevronRight,
} from 'lucide-react';
import './Login.css';
import ForgotAccessModal    from './pages/ForgotAccessModal';
import ChangePasswordModal  from './components/ChangePasswordModal';
import { login as apiLogin } from './api';
import { useAuth }           from './context/AuthContext';
import { notifyError, notifySuccess } from './utils/toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ROLE_LABELS = {
  student: 'Student',
  academic: 'Faculty',
  industrial: 'Industry',
  company_manager: 'Manager',
  admin: 'Admin',
};

const Login = ({ adminOnly = false }) => {
  const [role,           setRole]           = useState(adminOnly ? 'admin' : 'student');
  const [showPassword,   setShowPassword]   = useState(false);
  const [credentials,    setCredentials]    = useState({ email: '', password: '' });
  const [rememberMe,     setRememberMe]     = useState(false);
  const [isForgotOpen,   setIsForgotOpen]   = useState(false);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [showChangePw,   setShowChangePw]   = useState(false);

  const { login: authLogin } = useAuth();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  const getPlaceholder = () => {
    switch (role) {
      case 'student':    return 'student@uenr.edu.gh';
      case 'academic':   return 'lecturer@uenr.edu.gh';
      case 'industrial': return 'supervisor@company.com';
      case 'admin':      return 'admin@uenr.edu.gh';
      default:           return 'your@email.com';
    }
  };

  const roleRoutes = {
    student:         '/student',
    academic:        '/academic',
    industrial:      '/industrial',
    company_manager: '/company-manager',
    admin:           '/admin',
  };

  React.useEffect(() => {
    if (sessionStorage.getItem('authExpired')) {
      setError('Your session expired. Please sign in again.');
      notifyError('Your session expired. Please sign in again.');
      sessionStorage.removeItem('authExpired');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!credentials.email.trim() || !credentials.password) {
      const message = 'Please enter your email and password.';
      setError(message);
      notifyError(message);
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin({
        email:    credentials.email,
        password: credentials.password,
        role,
      });

      // Pass rememberMe so AuthContext writes to the correct storage atomically
      authLogin(data.token, data.user, rememberMe);
      notifySuccess('Signed in successfully.');

      if (data.user?.needsPasswordChange) {
        setShowChangePw(true);
        setLoading(false);
        return;
      }

      const next = searchParams.get('next');
      const dest = next || roleRoutes[data.user?.role] || roleRoutes[role];
      navigate(dest, { replace: true });
    } catch (err) {
      const message = 'Login failed. Check credentials.';
      setError(err.message || message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="bg-gradient-mesh" />

      <div className="login-content-box fade-in">
        <div className="login-card-glass">

          <Link to="/" className="login-brand" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="brand-icon-circle">
              {adminOnly
                ? <ShieldCheck size={24} color="#06bee1" />
                : <GraduationCap size={24} color="#06bee1" />}
            </div>
            <h1>InternTrack</h1>
            <p>{adminOnly ? 'Administrator Access' : 'Unified Internship Management System'}</p>
          </Link>

          {!adminOnly && <div className="role-selector-tabs">
            <button className={role === 'student'    ? 'active' : ''} onClick={() => setRole('student')}>
              <User size={14} /> Student
            </button>
            <button className={role === 'academic'   ? 'active' : ''} onClick={() => setRole('academic')}>
              <GraduationCap size={14} /> Faculty
            </button>
            <button className={role === 'industrial' ? 'active' : ''} onClick={() => setRole('industrial')}>
              <Briefcase size={14} /> Industry
            </button>
            <button className={role === 'company_manager' ? 'active' : ''} onClick={() => setRole('company_manager')}>
              <ShieldCheck size={14} /> Manager
            </button>
          </div>}

          <form onSubmit={handleSubmit} className="login-form-fields" noValidate>
            <div className="form-group-custom">
              <label>Email Address</label>
              <div className="input-wrapper-glass">
                <User size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder={getPlaceholder()}
                  value={credentials.email}
                  onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label>Password</label>
              <div className="input-wrapper-glass">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options-flex">
              <label className="checkbox-custom" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a
                href="#reset"
                className="link-text"
                onClick={e => { e.preventDefault(); setIsForgotOpen(true); }}
              >
                Forgot Access?
              </a>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading
                ? 'Signing in…'
                : `Sign In to ${ROLE_LABELS[role] || 'Portal'} Portal`}
              <ChevronRight size={18} />
            </button>

            {error && (
              <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
                {error}
              </p>
            )}
          </form>

          <ForgotAccessModal
            isOpen={isForgotOpen}
            onClose={() => setIsForgotOpen(false)}
            currentRole={role}
          />

          <ChangePasswordModal
            isOpen={showChangePw}
            onDone={() => {
              setShowChangePw(false);
              const stored = JSON.parse(
                localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'
              );
              const next = searchParams.get('next');
              const dest = next || roleRoutes[stored?.role] || roleRoutes[role];
              navigate(dest, { replace: true });
            }}
          />

          <footer className="login-card-footer">
            <p>Need assistance? <a href="mailto:support@uenr.edu.gh">University IT Support</a></p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
