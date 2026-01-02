import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeads(pagination.page);
  }, []);

  const loadLeads = async (page) => {
    try {
      setLoading(true);
      const data = await api.getRecentLeads(page, pagination.pageSize);
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    loadLeads(newPage);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading && leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load leads</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <button
            onClick={() => loadLeads(pagination.page)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Recent Leads</h2>
        <p className="text-sm text-slate-600 mt-1">
          Showing {leads.length} of {pagination.total} leads
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Interest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Sales Rep
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.created_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                  {lead.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <button
                    onClick={() => copyToClipboard(lead.whatsapp)}
                    className="flex items-center space-x-2 hover:text-blue-600"
                    title="Click to copy"
                  >
                    <span>{lead.whatsapp}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {lead.interest}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {lead.client_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      lead.sales_rep_name === 'Unassigned'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {lead.sales_rep_name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
