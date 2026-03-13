import { useEffect } from 'react';
import Layout from '@/components/Layout';
import Filters from '@/components/Filters';
import Analytics from '@/components/Analytics';
import LeadsTable from '@/components/LeadsTable';
import useDashboardStore from '@/store/dashboardStore';

function Dashboard() {
  const { fetchClients, fetchAnalytics, fetchLeads } = useDashboardStore();

  useEffect(() => {
    fetchClients();
    fetchAnalytics();
    fetchLeads();
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <Filters />
        <Analytics />
        <LeadsTable />
      </div>
    </Layout>
  );
}

export default Dashboard;
