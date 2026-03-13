import { Table, ChevronLeft, ChevronRight } from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';
import { formatDate } from '@/lib/utils';

function LeadsTable() {
  const { leads, loading, currentPage, totalPages, setPage } = useDashboardStore();

  const getStatusBadge = (status) => {
    const styles = {
      cold_call: 'bg-blue-900/50 text-blue-300 border-blue-700',
      qualified_unclaimed: 'bg-green-900/50 text-green-300 border-green-700',
      claimed: 'bg-purple-900/50 text-purple-300 border-purple-700',
    };
    const labels = {
      cold_call: 'Cold Call',
      qualified_unclaimed: 'Qualified',
      claimed: 'Claimed',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getSourceBadge = (source) => {
    const styles = {
      instagram: 'bg-pink-900/50 text-pink-300 border-pink-700',
      google: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[source] || 'bg-gray-900/50 text-gray-300 border-gray-700'}`}>
        {source}
      </span>
    );
  };

  if (loading.leads) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse text-gray-400">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Table className="text-taktis-primary" size={20} />
          <h2 className="text-lg font-semibold text-white">Leads Data</h2>
          <span className="text-sm text-gray-400 ml-2">({leads.length} leads)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Lead Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                First Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Claimed By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Claimed At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {leads.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{lead.name || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{lead.whatsapp}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{lead.client_name}</td>
                  <td className="px-6 py-4">{getSourceBadge(lead.source)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate" title={lead.first_msg}>
                    {lead.first_msg || '-'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{lead.claimed_by || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatDate(lead.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatDate(lead.claimed_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadsTable;
