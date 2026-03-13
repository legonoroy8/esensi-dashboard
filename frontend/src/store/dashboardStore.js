import { create } from 'zustand';
import api from '@/lib/api';

const useDashboardStore = create((set, get) => ({
  // Filters
  filters: {
    clientId: null,
    salesRepId: null,
    status: null,
    source: null,
    startDate: null,
    endDate: null,
  },
  
  // Data
  analytics: null,
  leads: [],
  clients: [],
  salesReps: [],
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  
  // Loading states
  loading: {
    analytics: false,
    leads: false,
    clients: false,
    salesReps: false,
  },

  // Actions
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1, // Reset to first page on filter change
    }));
    get().fetchAnalytics();
    get().fetchLeads();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchLeads();
  },

  fetchClients: async () => {
    set((state) => ({ loading: { ...state.loading, clients: true } }));
    try {
      const { data } = await api.get('/clients');
      set({ clients: data.clients });
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, clients: false } }));
    }
  },

  fetchSalesReps: async (clientId) => {
    if (!clientId) {
      set({ salesReps: [], filters: { ...get().filters, salesRepId: null } });
      return;
    }
    set((state) => ({ loading: { ...state.loading, salesReps: true } }));
    try {
      const { data } = await api.get(`/clients/${clientId}/sales-reps`);
      set({ salesReps: data.salesReps });
    } catch (error) {
      console.error('Failed to fetch sales reps:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, salesReps: false } }));
    }
  },

  fetchAnalytics: async () => {
    set((state) => ({ loading: { ...state.loading, analytics: true } }));
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.salesRepId) params.append('salesRepId', filters.salesRepId);
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/analytics?${params}`);
      set({ analytics: data });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, analytics: false } }));
    }
  },

  fetchLeads: async () => {
    set((state) => ({ loading: { ...state.loading, leads: true } }));
    try {
      const { filters, currentPage } = get();
      const params = new URLSearchParams({ page: currentPage, limit: 50 });
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.salesRepId) params.append('salesRepId', filters.salesRepId);
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/leads?${params}`);
      set({ leads: data.leads, totalPages: data.pagination.totalPages });
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, leads: false } }));
    }
  },

  exportCSV: async () => {
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.salesRepId) params.append('salesRepId', filters.salesRepId);
      if (filters.status) params.append('status', filters.status);
      if (filters.source) params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/export/csv?${params}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  },

  exportColdCallList: async () => {
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/export/cold-call-list?${params}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cold-call-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export cold call list:', error);
    }
  },
}));

export default useDashboardStore;
