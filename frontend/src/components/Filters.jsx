import { useEffect } from 'react';
import { Filter, Download } from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';

function Filters() {
  const { 
    filters, 
    clients, 
    salesReps, 
    setFilter, 
    fetchSalesReps,
    exportCSV 
  } = useDashboardStore();

  useEffect(() => {
    if (filters.clientId) {
      fetchSalesReps(filters.clientId);
    }
  }, [filters.clientId]);

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="text-taktis-primary" size={20} />
        <h2 className="text-lg font-semibold text-white">Filters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
          <select
            value={filters.clientId || ''}
            onChange={(e) => setFilter('clientId', e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-taktis-primary"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sales Rep</label>
          <select
            value={filters.salesRepId || ''}
            onChange={(e) => setFilter('salesRepId', e.target.value || null)}
            disabled={!filters.clientId}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-taktis-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Sales Reps</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilter('startDate', e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-taktis-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilter('endDate', e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-taktis-primary"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-taktis-primary hover:bg-taktis-primary/90 text-white rounded-lg transition"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}

export default Filters;
