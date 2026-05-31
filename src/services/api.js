/**
 * Centralized API client for the SMS to Board dashboard.
 * All requests go through this module so headers, base URL,
 * and error normalisation are consistent across sagas.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Build standard Monday context headers from the redux context object.
 * @param {string} token - Monday short-lived token
 * @param {object} context - Monday SDK context
 */
export function buildAuthHeaders(token, context) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(context?.boardId ? { 'x-monday-board-id': String(context.boardId) } : {}),
    ...(context?.user?.accountId ? { 'x-monday-account-id': String(context.user.accountId) } : {}),
    ...(context?.workspaceId ? { 'x-monday-workspace-id': String(context.workspaceId) } : {}),
  };
}

/**
 * Make an authenticated API request.
 * @param {string} path - API path (e.g. '/api/monday/dashboard/overview')
 * @param {object} headers - Auth/context headers
 * @param {object} [options] - Axios request options (method, data, params, etc.)
 * @returns {Promise<any>} - Resolved response data
 */
export async function request(path, headers = {}, options = {}) {
  const { method = 'get', data, params, ...rest } = options;
  const response = await axios({
    url: `${API_BASE}${path}`,
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(data !== undefined ? { data } : {}),
    ...(params !== undefined ? { params } : {}),
    ...rest,
  });
  return response.data;
}

// ─── Dashboard endpoints ──────────────────────────────────────────────────────

export const dashboardApi = {
  getOverview: (headers) =>
    request('/api/monday/dashboard/overview', headers),

  getRecentMessages: (headers) =>
    request('/api/monday/dashboard/messages/recent', headers),

  getReservedNumbers: (headers) =>
    request('/api/monday/dashboard/numbers', headers),

  getLinkedNumbersByBoard: (headers) =>
    request('/api/monday/dashboard/boards/linked-numbers', headers),

  reserveNumber: (headers, body) =>
    request('/api/monday/dashboard/numbers/reserve', headers, { method: 'post', data: body }),

  removeNumber: (headers, id) =>
    request(`/api/monday/dashboard/numbers/${id}`, headers, { method: 'delete' }),

  linkNumberToBoard: (headers, id, body) =>
    request(`/api/monday/dashboard/numbers/${id}/link`, headers, { method: 'post', data: body }),

  getProviderCredentials: (headers) =>
    request('/api/monday/dashboard/providers/credentials', headers),

  saveProviderCredentials: (headers, body) =>
    request('/api/monday/dashboard/providers/credentials', headers, { method: 'post', data: body }),

  searchAvailableNumbers: (headers, body) =>
    request('/api/monday/dashboard/providers/search-numbers', headers, { method: 'post', data: body }),

  rentNumber: (headers, body) =>
    request('/api/monday/dashboard/numbers/rent', headers, { method: 'post', data: body }),

  updateNumber: (headers, id, body) =>
    request(`/api/monday/dashboard/numbers/${id}`, headers, { method: 'put', data: body }),
};
