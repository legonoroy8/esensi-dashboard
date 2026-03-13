import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Phone, Users, Clock, AlertCircle, Database } from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';
import { formatNumber } from '@/lib/utils';

function Analytics() {
  const { analytics, loading } = useDashboardStore();

  if (loading.analytics || !analytics) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  const metrics = [
    { 
      label: 'Qualified Leads', 
      value: analytics.qualifiedLeads, 
      icon: TrendingUp, 
      color: 'text-taktis-primary' 
    },
    { 
      label: 'Cold Calls', 
      value: analytics.coldCalls, 
      icon: Phone, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Total Leads', 
      value: analytics.totalLeads, 
      icon: Users, 
      color: 'text-purple-400' 
    },
    { 
      label: 'Avg Claim Time', 
      value: `${analytics.avgClaimTimeMinutes.toFixed(1)} min`, 
      icon: Clock, 
      color: 'text-yellow-400' 
    },
    { 
      label: 'Slow Claims (>30min)', 
      value: analytics.slowClaims, 
      icon: AlertCircle, 
      color: 'text-red-400' 
    },
  ];

  const sourceData = Object.entries(analytics.leadsBySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#00bcd4', '#8c52ff', '#ff4c4c', '#fbbf24'];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.label} 
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={metric.color} size={24} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
              </div>
              <div className="text-sm text-gray-400">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source - Pie Chart */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-taktis-primary" size={20} />
            <h3 className="text-lg font-semibold text-white">Leads by Source</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status Distribution - Bar Chart */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-taktis-primary" size={20} />
            <h3 className="text-lg font-semibold text-white">Lead Status Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: 'Qualified', value: analytics.qualifiedLeads },
                { name: 'Cold Calls', value: analytics.coldCalls },
                { name: 'Slow Claims', value: analytics.slowClaims },
              ]}
            >
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="value" fill="#00bcd4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
