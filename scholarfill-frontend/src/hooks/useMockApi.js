// Real API calls — replaces useMockApi.js mock implementation
// Function names kept identical so no callers need to change.

import client from '../api/client';

export const mockApi = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password });
    localStorage.setItem('sf_token', data.token);
    return data; // { user, token }
  },

  register: async (name, email, password) => {
    const { data } = await client.post('/api/auth/register', { name, email, password });
    localStorage.setItem('sf_token', data.token);
    return data; // { user, token }
  },

  getMe: async () => {
    const { data } = await client.get('/api/auth/me');
    return data; // user object
  },

  // ── CV ────────────────────────────────────────────────────────────────────

  uploadCV: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await client.post('/api/cv/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data; // cv profile object
  },

  getCV: async () => {
    const { data } = await client.get('/api/cv/me');
    return data;
  },

  updateCV: async (structured_data) => {
    const { data } = await client.put('/api/cv/update', { structured_data });
    return data;
  },

  // ── Forms / Scraping ──────────────────────────────────────────────────────

  scrapeForm: async (url, html = null, userInstructions = null) => {
    const { data } = await client.post('/api/forms/scrape', { url, html, user_instructions: userInstructions });
    return data; // new application object
  },

  refillApplication: async (applicationId, userInstructions = null) => {
    const { data } = await client.post('/api/forms/fill', {
      application_id: applicationId,
      user_instructions: userInstructions,
    });
    return data; // updated application object
  },

  // ── Applications ──────────────────────────────────────────────────────────

  getApplications: async () => {
    const { data } = await client.get('/api/applications/');
    return data; // array of applications
  },

  getApplication: async (id) => {
    const { data } = await client.get(`/api/applications/${id}`);
    return data;
  },

  reviewApplication: async (id, filled_data) => {
    const { data } = await client.put(`/api/applications/${id}/review`, { filled_data });
    return data;
  },

  submitApplication: async (id) => {
    const { data } = await client.post(`/api/applications/${id}/submit`);
    return data; // { success, submitted_at }
  },

  deleteApplication: async (id) => {
    const { data } = await client.delete(`/api/applications/${id}`);
    return data;
  },

  uploadFieldFile: async (applicationId, fieldName, file) => {
    const form = new FormData();
    form.append('field_name', fieldName);
    form.append('file', file);
    const { data } = await client.post(`/api/applications/${applicationId}/upload-field`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data; // { field_name, file_url, application }
  },

  getPrefillUrl: async (id) => {
    const { data } = await client.get(`/api/applications/${id}/prefill-url`);
    return data; // { prefill_url: string | null }
  },

  markStatus: async (id, status, errorMessage = null) => {
    const body = { status };
    if (errorMessage) body.error_message = errorMessage;
    const { data } = await client.post(`/api/applications/${id}/mark-status`, body);
    return data; // updated application
  },

  // ── Google OAuth ──────────────────────────────────────────────────────────

  googleLoginUrl: async () => {
    const { data } = await client.get('/api/auth/google/login');
    return data.url;
  },

  googleStatus: async () => {
    const { data } = await client.get('/api/auth/google/status');
    return data; // { oauth_configured, connected, token_expiry }
  },

  googleUnlink: async () => {
    const { data } = await client.delete('/api/auth/google/unlink');
    return data;
  },
  updateSettings: async (settings) => {
    const { data } = await client.put('/api/auth/settings', settings);
    return data; // returns updated user
  },

  // ── Opportunities ─────────────────────────────────────────────────────────

  getOpportunities: async () => {
    const { data } = await client.get('/api/opportunities');
    return data;
  },

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotifications: async () => {
    const { data } = await client.get('/api/notifications');
    return data;
  },

  markNotificationRead: async (id) => {
    const { data } = await client.put(`/api/notifications/${id}/read`);
    return data;
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminGetUsers: async () => {
    const { data } = await client.get('/api/admin/users');
    return data;
  },

  adminCreateOpportunity: async (oppData) => {
    const { data } = await client.post('/api/admin/opportunities', oppData);
    return data;
  },

  adminDeleteOpportunity: async (id) => {
    const { data } = await client.delete(`/api/admin/opportunities/${id}`);
    return data;
  },

  adminDeleteUser: async (id) => {
    const { data } = await client.delete(`/api/admin/users/${id}`);
    return data;
  },

  adminCreateNotification: async (notifData) => {
    const { data } = await client.post('/api/admin/notifications', notifData);
    return data;
  },

  adminGetNotifications: async () => {
    const { data } = await client.get('/api/admin/notifications');
    return data;
  },

  adminDeleteNotification: async (id) => {
    const { data } = await client.delete(`/api/admin/notifications/${id}`);
    return data;
  }
};
