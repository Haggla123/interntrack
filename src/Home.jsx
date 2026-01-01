import React, { useState } from 'react';
import './Home.css';

const Home = () => {

  const features = [
    { title: "Student Daily Reports", desc: "Maintain a comprehensive log of learning activities and daily progress updates.", color: "#2563eb" },
    { title: "Placement Management", desc: "Streamline the matching process between students and verified industry partners.", color: "#059669" },
    { title: "Supervisor Evaluations", desc: "Digital assessment tools for both industrial and academic mentors to track growth.", color: "#d97706" },
    { title: "Progress Tracking", desc: "Visual analytics and milestone monitoring throughout the internship duration.", color: "#dc2626" },
    { title: "Notifications & Deadlines", desc: "Automated reminders for report submissions, approvals, and system tasks.", color: "#7c3aed" },
    { title: "Analytics & Reports", desc: "Generate data-driven insights for institutional decision-making and performance.", color: "#4b5563" }
  ];

  const roles = [
    { title: "Students", description: "Apply for internships, log daily activities, and manage your professional portfolio." },
    { title: "Industrial Supervisors", description: "Mentor interns, assign tasks, and validate industrial learning outcomes." },
    { title: "Academic Supervisors", description: "Oversee academic compliance and monitor student progress remotely." },
    { title: "Administrators", description: "Manage user accounts, facilitate placements, and oversee program health." }
  ];

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="container nav-content">
          <div className='logo-details'>
            <div className='logo'><img src="./logo.png" alt="" /></div>
          <div className="logo-text">UENR InternTrack</div>
          </div>
          
          
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#companies">Companies</a></li>
          </ul>

          <div className="nav-auth">
            <button className="btn-outline">Login</button>
          </div>
        </div>
      </nav>

      <header id="home" className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1>Simplifying Internship Management for UENR and Industries</h1>
            <p>A centralized platform to manage placements, track student activities, and facilitate seamless evaluations between academia and industry experts.</p>
            <div className="hero-actions">
              <button className="btn-primary-lg">Get Started</button>
              <button className="btn-outline-lg">Learn More</button>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section-padding">
        <div className="container">
          <h2 className="section-title">System Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="card feature-card">
                <div className="feature-icon" style={{ backgroundColor: feature.color }}></div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-padding bg-light">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-row">
            <div className="step">
              <div className="step-badge">1</div>
              <h4>Students apply and log internship activities</h4>
              <p>Easily find placements and document day-to-day industrial experience through the portal.</p>
            </div>
            <div className="step">
              <div className="step-badge">2</div>
              <h4>Supervisors assign tasks and review reports</h4>
              <p>Provide professional guidance and validate student logs through structured feedback.</p>
            </div>
            <div className="step">
              <div className="step-badge">3</div>
              <h4>Administrators manage placements and evaluations</h4>
              <p>Ensure program quality by overseeing all placements and final academic grading.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <h2 className="section-title">Access User Portals</h2>
          <div className="roles-grid">
            {roles.map((role, index) => (
              <div key={index} className="card role-card">
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <button className="btn-primary-full">Access Portal</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-top">
            <div className="logo-white">UENR InternTrack</div>
            <p>Comprehensive Internship Tracker for UENR and forward-thinking companies.</p>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#help">Help / Support</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} UENR InternTrack</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;