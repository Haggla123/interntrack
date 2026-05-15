import { notifyError, notifySuccess } from './toast';
<<<<<<< HEAD
import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;
=======

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
>>>>>>> 47bb090b73335bdc567c89044beaee7541368292

// Read from whichever storage holds the active session token
const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

/**
 * Download a document from the backend by its ID.
 * @param {string} docId    - MongoDB _id of the document
 * @param {string} filename - Suggested filename for the download
 */
export const downloadFile = async (docId, filename) => {
  const token = getToken();

  let response;
  try {
    response = await fetch(`${BASE_URL}/documents/${docId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err) {
    notifyError('Connection failed. Please check the server and try again.');
    throw err;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    notifyError(err.message || `Download failed (${response.status})`);
    throw new Error(err.message || `Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  notifySuccess('Download started.');
};
