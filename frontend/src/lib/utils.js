import { format, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'MMM d, yyyy HH:mm');
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

export const formatPercentage = (num) => {
  return `${(num || 0).toFixed(1)}%`;
};

export const downloadCSV = (data, filename = 'export.csv') => {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
