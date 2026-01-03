// Centralized API client for Esensi Dashboard
//
// In production the frontend is served by the same Express app, so API calls should be same-origin.
// In development, Vite proxies /api to the backend (see vite.config.js).
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session auth
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async checkAuth() {
    return this.request('/api/auth/me');
  }

  // KPI endpoints
  async getKPISummary(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/kpi/summary?${params}`);
  }

  async getLeadsPerClient(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/kpi/leads-per-client?${params}`);
  }

  async getLeadsPerSalesRep(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/kpi/leads-per-sales-rep?${params}`);
  }

  // Chart endpoints
  async getLeadsOverTime(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/chart/leads-over-time?${params}`);
  }

  // Table endpoints
  async getRecentLeads(page = 1, pageSize = 20, filters = {}) {
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });
    return this.request(`/api/table/recent-leads?${params}`);
  }
}

export default new ApiClient();
