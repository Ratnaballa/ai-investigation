import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MdAdd, MdFolder, MdSearch, MdEdit, MdDelete, MdVisibility,
  MdRefresh, MdShield, MdTune,
} from 'react-icons/md';
import { caseService } from '../services/caseService';
import { getErrorMessage, statusColor, statusLabel, formatDate, truncate } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Modal, Select, Textarea, Spinner, EmptyState, Alert, Badge } from '../components/ui/index.jsx';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under_investigation', label: 'Under Investigation' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_FORM_OPTIONS = STATUS_OPTIONS.slice(1);

function CaseForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    location: initial.location || '',
    status: initial.status || 'open',
    tags: (initial.tags || []).join(', '),
    is_sensitive: initial.is_sensitive || false,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Case Title" value={form.title} onChange={set('title')} placeholder="Enter case title" required />
      <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Describe the case in detail..." rows={4} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location" value={form.location} onChange={set('location')} placeholder="Crime location" />
        {initial.status !== undefined && (
          <Select label="Status" value={form.status} onChange={set('status')} options={STATUS_FORM_OPTIONS} />
        )}
      </div>
      <Input label="Tags (comma separated)" value={form.tags} onChange={set('tags')} placeholder="theft, cyber, urgent" />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_sensitive}
          onChange={(e) => setForm((f) => ({ ...f, is_sensitive: e.target.checked }))}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-sm text-slate-300">Mark as Sensitive Case</span>
      </label>
      <Button type="submit" loading={loading} className="w-full">
        {initial.id ? 'Update Case' : 'Create Case'}
      </Button>
    </form>
  );
}

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCase, setEditCase] = useState(null);
  const [viewCase, setViewCase] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await caseService.getCases(page, PAGE_SIZE, statusFilter || null);
      setCases(data.items || data.cases || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setFormLoading(true);
    try {
      await caseService.createCase(form);
      setCreateOpen(false);
      setSuccess('Case created successfully');
      load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (form) => {
    setFormLoading(true);
    try {
      await caseService.updateCase(editCase.id, form);
      setEditCase(null);
      setSuccess('Case updated successfully');
      load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this case? This action cannot be undone.')) return;
    try {
      await caseService.deleteCase(id);
      setSuccess('Case deleted');
      load();
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const filtered = search
    ? cases.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase()))
    : cases;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Case Management</h2>
          <p className="text-sm text-slate-400">{total} total cases · Active review queue</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<MdAdd size={18} />}>New Case</Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or case number..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-2.5 pl-9 pr-4 text-sm text-slate-100 outline-none transition focus:border-blue-400/40"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={STATUS_OPTIONS}
            className="sm:w-48"
          />
          <Button onClick={load} variant="secondary" icon={<MdRefresh size={16} />}>Refresh</Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MdFolder />}
            title="No cases found"
            description="Create your first case to get started with the investigation."
            action={<Button onClick={() => setCreateOpen(true)} icon={<MdAdd size={16} />}>Create Case</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Case #', 'Title', 'Status', 'Location', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-xs text-blue-400">{c.case_number}</td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-white">{truncate(c.title, 40)}</p>
                          {c.is_sensitive && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-red-400">
                              <MdShield size={12} /> Sensitive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={statusColor(c.status)}>{statusLabel(c.status)}</Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{c.location || '—'}</td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(c.created_at)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewCase(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                            <MdVisibility size={16} />
                          </button>
                          <button onClick={() => setEditCase(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <MdEdit size={16} />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer">
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="secondary" size="sm">Previous</Button>
                  <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="secondary" size="sm">Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Case" size="lg">
        <CaseForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editCase} onClose={() => setEditCase(null)} title="Edit Case" size="lg">
        {editCase && <CaseForm initial={editCase} onSubmit={handleUpdate} loading={formLoading} />}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)} title="Case Details" size="lg">
        {viewCase && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-blue-400 text-sm">{viewCase.case_number}</span>
              <Badge className={statusColor(viewCase.status)}>{statusLabel(viewCase.status)}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Title</p>
              <p className="text-white font-semibold">{viewCase.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-slate-300 text-sm leading-relaxed">{viewCase.description}</p>
            </div>
            {viewCase.location && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
                <p className="text-slate-300 text-sm">{viewCase.location}</p>
              </div>
            )}
            {viewCase.applicable_sections?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Applicable Sections</p>
                <div className="flex flex-wrap gap-2">
                  {viewCase.applicable_sections.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {viewCase.tags?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {viewCase.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg bg-white/10 text-slate-300">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm text-slate-300">{formatDate(viewCase.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Updated</p>
                <p className="text-sm text-slate-300">{formatDate(viewCase.updated_at)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
