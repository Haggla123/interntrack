const LOCAL_API_URL = 'http://localhost:5000/api';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configured = process.env.REACT_APP_API_URL?.trim();
  if (configured) return trimTrailingSlash(configured);

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: REACT_APP_API_URL');
  }

  return LOCAL_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
