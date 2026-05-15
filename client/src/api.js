import { notifyError, notifySuccess } from './utils/toast';
import { API_BASE_URL, SERVER_BASE_URL } from './config';

const BASE_URL = API_BASE_URL;

// Check both storages — Login.js uses sessionStorage when
// "Remember Me" is unchecked. The old code only read localStorage,
// causing every API call to send no token → 401 on all requests.
const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const successMessage = (method, path, data) => {
  if (!mutatingMethods.has(method)) return null;
  if (data?.message) return data.message;
  if (path.includes('/auth/login')) return 'Signed in successfully.';
  if (method === 'DELETE') return 'Deleted successfully.';
  return 'Action completed successfully.';
};

const request = async (method, path, body) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: headers(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    notifyError('Connection failed. Please check the server and try again.');
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const message = path === '/auth/login'
      ? 'Login failed. Check credentials.'
      : data?.message || 'Request failed';
    notifyError(message);
    throw new Error(data?.message || message);
  }
  const message = successMessage(method, path, data);
  if (message) notifySuccess(message);
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────
export const login          = (creds)        => request('POST', '/auth/login', creds);
export const register       = (data)         => request('POST', '/auth/register', data);
export const changePassword = (data)         => request('POST', '/auth/change-password', data);
export const forgotPassword = (data)         => request('POST', '/auth/forgot-password', data);
export const getMe          = ()             => request('GET',  '/auth/me');
export const updateProfile  = (data)         => request('PATCH', '/auth/me', data);

// Upload avatar — sends FormData, cannot use the shared `request` helper
export const uploadAvatar = async (file) => {
  const token = getToken();
  const form  = new FormData();
  form.append('avatar', file);
  let r;
  try {
    r = await fetch(`${BASE_URL}/auth/me/avatar`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
    });
  } catch (err) {
    notifyError('Connection failed. Please check the server and try again.');
    throw err;
  }
  const data = await r.json();
  if (!r.ok) {
    notifyError(data.message || 'Avatar upload failed');
    throw new Error(data.message || 'Avatar upload failed');
  }
  notifySuccess(data.message || 'Avatar uploaded successfully.');
  return data;
};

// Build full URL for a stored profilePicture path (e.g. "avatars/avatar-123.png")
export const avatarUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE_URL}/uploads/${path}`;
};

// ── Companies ────────────────────────────────────────────────────
export const getCompanies   = ()             => request('GET',    '/companies');
export const getCompany     = (id)           => request('GET',    `/companies/${id}`);
export const createCompany  = (data)         => request('POST',   '/companies', data);
export const updateCompany  = (id, data)     => request('PUT',    `/companies/${id}`, data);
export const deleteCompany  = (id)           => request('DELETE', `/companies/${id}`);
export const applyForSlot   = (id)           => request('POST',   `/companies/${id}/apply`);

// ── Students ─────────────────────────────────────────────────────
export const getStudents          = ()       => request('GET',  '/students');
export const getStudent           = (id)     => request('GET',  `/students/${id}`);
export const assignStudent        = (id, d)  => request('PUT',    `/students/${id}/assign`, d);
export const unassignStudent      = (id)     => request('DELETE', `/students/${id}/assign`);
export const updateStudent        = (id, d)  => request('PUT',  `/students/${id}`, d);
export const resetStudentPassword = (id)     => request('POST', `/students/${id}/reset-password`);
export const revokePlacement      = (id)     => request('PUT',  `/students/${id}/revoke`);
export const deleteStudent        = (id)     => request('DELETE',`/students/${id}`);

// ── Placements ───────────────────────────────────────────────────
export const submitPlacementRequest = (data) => request('POST', '/placements', data);
export const getPlacementRequests   = (params) => {
  const qs = params?.status ? `?status=${params.status}` : '';
  return request('GET', `/placements${qs}`);
};
export const approvePlacement       = (id,d) => request('PUT',  `/placements/${id}/approve`, d);
export const declinePlacement       = (id)   => request('PUT',  `/placements/${id}/decline`);

// ── Logs ─────────────────────────────────────────────────────────
export const submitLog        = (data)       => request('POST', '/logs', data);
export const getLogs          = ()           => request('GET',  '/logs');
export const getMyLogs        = ()           => request('GET',  '/logs/me');
export const getPendingLogs   = ()           => request('GET',  '/logs/pending');
export const getStudentLogs   = (studentId)  => request('GET',  `/logs/student/${studentId}`);
export const approveLog       = (id, note)   => request('PUT',  `/logs/${id}/approve`, { note: note || '' });
export const rejectLog        = (id, note)   => request('PUT',  `/logs/${id}/reject`,  { note: note || '' });

// ── Grades ───────────────────────────────────────────────────────
export const getGrades       = ()            => request('GET',  '/grades');
export const getMyGrades     = ()            => request('GET',  '/grades/mine');
export const submitGrade     = (data)        => request('POST', '/grades', data);
export const updateGrade     = (id, data)    => request('PUT',  `/grades/${id}`, data);
export const getStudentGrade = (studentId)   => request('GET',  `/grades/student/${studentId}`);
// Batch stats: 2 aggregations server-side instead of 2N individual requests.
// Pass an array of student IDs and the configured totalWeeks.
export const getStudentStats = (ids, totalWeeks = 6) =>
  request('GET', `/students/stats?ids=${ids.join(',')}&totalWeeks=${totalWeeks}`);

// ── Supervisors / Academic ────────────────────────────────────────
export const getSupervisors    = ()          => request('GET',    '/supervisors');
export const updateSupervisor  = (id, data)  => request('PUT',    `/supervisors/${id}`, data);
export const deleteSupervisor  = (id)        => request('DELETE', `/supervisors/${id}`);
export const assignSupervisor  = (id, data)  => request('PUT',    `/supervisors/${id}/assign`, data);

// ── Documents / Letters ──────────────────────────────────────────
export const getDocuments       = (params)   => {
  const parts = [];
  if (params?.studentId) parts.push(`studentId=${params.studentId}`);
  if (params?.type)      parts.push(`type=${params.type}`);
  const qs = parts.length ? `?${parts.join('&')}` : '';
  return request('GET', `/documents${qs}`);
};
export const getPublicDocuments = ()         => request('GET',    '/documents?public=true');
export const downloadDocument   = (id)       => request('GET',    `/documents/${id}/download`);
export const deleteDocument     = (id)       => request('DELETE', `/documents/${id}`);

// ── Notifications / Broadcast ─────────────────────────────────────
export const sendBroadcast    = (data)       => request('POST', '/broadcast', data);
export const getNotifications = ()          => request('GET',  '/notifications');
export const markNotificationRead = (id)    => request('PATCH', `/notifications/${id}/read`);

// ── Visits ───────────────────────────────────────────────────────
export const scheduleVisit  = (data)        => request('POST', '/visits', data);
export const getVisits      = ()            => request('GET',  '/visits');
export const updateVisit    = (id, data)    => request('PUT',  `/visits/${id}`, data);

// ── Settings ─────────────────────────────────────────────────────
export const getSettings       = ()         => request('GET',    '/settings');
export const updateSettings    = (data)     => request('PUT',    '/settings', data);
export const addDepartment     = (name)     => request('POST',   '/settings/departments', { name });

// ── Company Manager ──────────────────────────────────────────────
export const getManagerCompany      = ()     => request('GET',  '/cm/company');
export const getManagerInterns      = ()     => request('GET',  '/cm/interns');
export const getManagerSupervisors  = ()     => request('GET',  '/cm/supervisors');
export const createManagerSupervisor = (data) => request('POST', '/cm/supervisors', data);
export const updateManagerSupervisor = (id, data) => request('PUT', `/cm/supervisors/${id}`, data);
export const deleteManagerSupervisor = (id) => request('DELETE', `/cm/supervisors/${id}`);
export const assignInternsToSupervisor = (assignments) => request('PUT', '/cm/assign', { assignments });
export const getManagerStats        = ()     => request('GET',  '/cm/stats');
export const removeDepartment  = (name)     => request('DELETE', `/settings/departments/${encodeURIComponent(name)}`);

// ── File upload helper (used by FinalReport and AdminDocumentsTab) ────────
export const uploadFile = async (formData) => {
  const token = getToken();
  let r;
  try {
    r = await fetch(`${BASE_URL}/documents`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    formData,
    });
  } catch (err) {
    notifyError('Connection failed. Please check the server and try again.');
    throw err;
  }
  const data = await r.json();
  if (!r.ok) {
    notifyError(data.message || 'Upload failed');
    throw new Error(data.message || 'Upload failed');
  }
  notifySuccess(data.message || 'Upload completed successfully.');
  return data;
};

// ── Default export ────────────────────────────────────────────────
const api = {
  login, register, changePassword, forgotPassword, getMe, updateProfile, uploadAvatar, avatarUrl,
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany, applyForSlot,
  getStudents, getStudent, assignStudent, unassignStudent, updateStudent,
  resetStudentPassword, revokePlacement, deleteStudent,
  submitPlacementRequest, getPlacementRequests, approvePlacement, declinePlacement,
  submitLog, getLogs, getMyLogs, getPendingLogs, getStudentLogs, approveLog, rejectLog,
  getGrades, getMyGrades, submitGrade, updateGrade, getStudentGrade, getStudentStats,
  getSupervisors, assignSupervisor, updateSupervisor, deleteSupervisor,
  getDocuments, getPublicDocuments, downloadDocument, deleteDocument,
  sendBroadcast, getNotifications, markNotificationRead,
  scheduleVisit, getVisits, updateVisit,
  getSettings, updateSettings, addDepartment, removeDepartment,
  uploadFile,
  getManagerCompany, getManagerInterns, getManagerSupervisors, createManagerSupervisor, updateManagerSupervisor, deleteManagerSupervisor, assignInternsToSupervisor, getManagerStats,
};

export default api;
