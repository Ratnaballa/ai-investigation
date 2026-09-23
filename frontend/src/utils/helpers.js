export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const roleLabel = (role) => ({
  admin: 'Administrator',
  police_officer: 'Police Officer',
  investigation_officer: 'Investigation Officer',
  lawyer: 'Lawyer',
  public: 'Public',
}[role] || role);

export const roleBadgeColor = (role) => ({
  admin: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  police_officer: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  investigation_officer: 'bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  lawyer: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  public: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600',
}[role] || 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300');

export const statusColor = (status) => ({
  open: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  under_investigation: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  closed: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600',
  archived: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
}[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300');

export const statusLabel = (status) => ({
  open: 'Open',
  under_investigation: 'Under Investigation',
  closed: 'Closed',
  archived: 'Archived',
}[status] || status);

export const evidenceTypeColor = (type) => ({
  physical: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  digital: 'bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  documentary: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  testimonial: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  forensic: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
}[type] || 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-300');

export const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors
        .map((e) => (typeof e === 'object' && e.message ? `${e.field ? e.field + ': ' : ''}${e.message}` : String(e)))
        .join('; ');
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((e) => (typeof e === 'object' && (e.msg || e.message) ? e.msg || e.message : String(e)))
        .join('; ');
    }
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string' && data.message !== 'Request validation failed') {
      return data.message;
    }
  }
  return error?.message || 'An unexpected error occurred';
};

export const truncate = (str, n = 60) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
