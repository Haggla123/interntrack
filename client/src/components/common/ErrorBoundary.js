import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('UI error boundary caught:', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-fallback-state" role="alert">
        <AlertCircle size={34} />
        <h1>Something went wrong</h1>
        <p>Please refresh this view and try again.</p>
        <button type="button" onClick={() => window.location.reload()}>
          <RotateCcw size={16} /> Refresh
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
