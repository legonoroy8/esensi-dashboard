import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../lib/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LeadsChart({ filters = {} }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChartData();
  }, [filters]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const data = await api.getLeadsOverTime(filters);
      
      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: 'Leads per Day',
            data: data.data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic title based on filters
  const getChartTitle = () => {
    if (filters.start_date && filters.end_date) {
      const start = new Date(filters.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const end = new Date(filters.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Leads Over Time (${start} - ${end})`;
    } else if (filters.start_date) {
      const start = new Date(filters.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Leads Over Time (From ${start})`;
    } else if (filters.end_date) {
      const end = new Date(filters.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Leads Over Time (Until ${end})`;
    }
    return 'Leads Over Time (Last 30 Days)';
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: getChartTitle(),
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load chart data</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <button
            onClick={loadChartData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : chartData ? (
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No data available</div>
      )}
    </div>
  );
}
