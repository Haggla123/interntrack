import React, { useState } from 'react';
import './Login.css';

const InternshipLogin = () => {
  const [activeRole, setActiveRole] = useState('Student');
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });

  const roles = ['Student', 'Academic Supervisor', 'Industrial Supervisor', 'Administrator'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Logging in as ${activeRole}:`, formData);
  };

  return (
    <div className="login-container">
      {/* Left Side: Dark Section */}
      <section className="side-panel left-panel">
        <div className="brand-content">
          <h1>Welcome to UENR <br />Internship Management System</h1>
          <p className="subtext">
            Streamlining the connection between students, supervisors, and 
            institutions for a professional future.
          </p>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="icon-placeholder"></div>
            <div>
              <span className="stat-value">15,000+</span>
              <span className="stat-label">Students Enrolled</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-placeholder"></div>
            <div>
              <span className="stat-value">150+</span>
              <span className="stat-label">Active Supervisors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Login Section */}
      <section className="side-panel right-panel">
        <div className="login-card">
          <div className="role-tabs">
            {roles.map((role) => (
              <button
                key={role}
                className={`tab-btn ${activeRole === role ? 'active' : 'outline'}`}
                onClick={() => setActiveRole(role)}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="identifier">ID Number</label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="Enter your credentials"
                value={formData.identifier}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="checkbox-group">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="rememberMe">Remember me for 30 days</label>
            </div>

            <button type="submit" className="submit-btn">
              Sign In as {activeRole}
            </button>
          </form>
        </div>

        <footer className="login-footer">
          <a href="#support">Contact IT Support</a>
          <p>&copy; 2025 Haggla is the GOAT. All rights reserved.</p>
        </footer>
      </section>
    </div>
  );
};

export default InternshipLogin;