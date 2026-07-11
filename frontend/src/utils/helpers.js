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
  admin: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  police_officer: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  investigation_officer: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  lawyer: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  public: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
}[role] || 'bg-slate-500/20 text-slate-300');

export const statusColor = (status) => ({
  open: 'bg-green-500/20 text-green-300 border border-green-500/30',
  under_investigation: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  archived: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}[status] || 'bg-slate-500/20 text-slate-300');

export const statusLabel = (status) => ({
  open: 'Open',
  under_investigation: 'Under Investigation',
  closed: 'Closed',
  archived: 'Archived',
}[status] || status);

export const evidenceTypeColor = (type) => ({
  physical: 'bg-orange-500/20 text-orange-300',
  digital: 'bg-cyan-500/20 text-cyan-300',
  documentary: 'bg-blue-500/20 text-blue-300',
  testimonial: 'bg-purple-500/20 text-purple-300',
  forensic: 'bg-red-500/20 text-red-300',
}[type] || 'bg-slate-500/20 text-slate-300');

export const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.message) return error.response.data.message;
  if (Array.isArray(error?.response?.data?.detail)) {
    return error.response.data.detail.map(e => e.msg).join(', ');
  }
  return error?.message || 'An unexpected error occurred';
};

export const truncate = (str, n = 60) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
