export default function KPICard({ title, value, subtitle, loading, error }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-slate-600 mb-2">{title}</h3>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-32"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : (
        <>
          <div className="text-3xl font-bold text-slate-800 mb-1">
            {value !== null && value !== undefined ? value.toLocaleString() : '—'}
          </div>
          {subtitle && (
            <div className="text-sm text-slate-500">{subtitle}</div>
          )}
        </>
      )}
    </div>
  );
}
