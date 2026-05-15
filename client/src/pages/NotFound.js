import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';

const NotFound = () => (
  <main className="app-fallback-state">
    <AlertCircle size={34} />
    <h1>Page not found</h1>
    <p>The page you opened does not exist or has moved.</p>
    <Link to="/login">
      <LogIn size={16} /> Go to login
    </Link>
  </main>
);

export default NotFound;
