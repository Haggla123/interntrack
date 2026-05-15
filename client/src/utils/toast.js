const listeners = new Set();
let lastToast = { message: '', type: '', at: 0 };

const emit = (toast) => {
  const now = Date.now();
  const type = toast.type || 'info';
  const message = toast.message || 'Action completed.';
  if (lastToast.message === message && lastToast.type === type && now - lastToast.at < 900) {
    return null;
  }
  lastToast = { message, type, at: now };

  const payload = {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    duration: toast.duration ?? 4200,
  };
  listeners.forEach(listener => listener(payload));
  return payload.id;
};

export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notify = (message, type = 'info', options = {}) =>
  emit({ message, type, ...options });

export const notifySuccess = (message, options) =>
  notify(message || 'Action completed successfully.', 'success', options);

export const notifyError = (message, options) =>
  notify(message || 'Something went wrong. Please try again.', 'error', options);

export const notifyInfo = (message, options) =>
  notify(message || 'Working on it.', 'info', options);
