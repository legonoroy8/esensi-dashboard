import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function FilterBar({ onFilterChange }) {
  const [clients, setClients] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    client_id: '',
    sales_rep_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const [clientsData, salesRepsData] = await Promise.all([
        api.getClients(),
        api.getSalesReps(),
      ]);
      setClients(clientsData);
      setSalesReps(salesRepsData);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    // Only send non-empty filters
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        activeFilters[key] = filters[key];
      }
    });
    onFilterChange(activeFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      client_id: '',
      sales_rep_id: '',
      start_date: '',
      end_date: '',
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Client Filter */}
        <div>
          <label htmlFor="client-filter" className="block text-sm font-medium text-slate-700 mb-2">
            Client
          </label>
          <select
            id="client-filter"
            value={filters.client_id}
            onChange={(e) => handleFilterChange('client_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sales Rep Filter */}
        <div>
          <label htmlFor="sales-rep-filter" className="block text-sm font-medium text-slate-700 mb-2">
            Sales Representative
          </label>
          <select
            id="sales-rep-filter"
            value={filters.sales_rep_id}
            onChange={(e) => handleFilterChange('sales_rep_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Sales Reps</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label htmlFor="start-date-filter" className="block text-sm font-medium text-slate-700 mb-2">
            Start Date
          </label>
          <input
            id="start-date-filter"
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label htmlFor="end-date-filter" className="block text-sm font-medium text-slate-700 mb-2">
            End Date
          </label>
          <input
            id="end-date-filter"
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition duration-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
