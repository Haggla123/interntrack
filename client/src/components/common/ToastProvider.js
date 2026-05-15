import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { subscribeToToasts } from '../../utils/toast';
import './ToastProvider.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToToasts((toast) => {
    setToasts(prev => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== toast.id));
    }, toast.duration);
  }), []);

  const dismiss = (id) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  };

  return (
    <>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`app-toast app-toast-${toast.type}`} role="status">
              <span className="app-toast-icon">
                <Icon size={22} />
              </span>
              <span className="app-toast-message">{toast.message}</span>
              <button
                type="button"
                className="app-toast-close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ToastProvider;
