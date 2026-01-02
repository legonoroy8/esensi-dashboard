import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import KPICard from '../components/KPICard';
import LeadsChart from '../components/LeadsChart';
import LeadsTable from '../components/LeadsTable';
import api from '../lib/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [kpiData, setKpiData] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load KPI data
  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      setKpiLoading(true);
      const data = await api.getKPISummary();
      setKpiData(data);
    } catch (err) {
      setKpiError(err.message);
    } finally {
      setKpiLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' · ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Esensi Lead Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">{formatDateTime(currentTime)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, <span className="font-semibold">{user?.username}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Leads"
            value={kpiData?.totalLeads}
            subtitle="All time"
            loading={kpiLoading}
            error={kpiError}
          />
          <KPICard
            title="Leads (7 Days)"
            value={kpiData?.leads7Days}
            subtitle="Last week"
            loading={kpiLoading}
            error={kpiError}
          />
          <KPICard
            title="Leads (30 Days)"
            value={kpiData?.leads30Days}
            subtitle="Last month"
            loading={kpiLoading}
            error={kpiError}
          />
          <KPICard
            title="Qualified Ratio"
            value={kpiData?.qualifiedRatio}
            subtitle="Coming soon"
            loading={kpiLoading}
            error={kpiError}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <LeadsChart />
        </div>

        {/* Table */}
        <div>
          <LeadsTable />
        </div>
      </main>
    </div>
  );
}
