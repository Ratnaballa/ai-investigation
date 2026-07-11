import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MdAssessment, MdAdd, MdDelete, MdDownload, MdVisibility,
  MdRefresh, MdSearch,
} from 'react-icons/md';
import { reportService } from '../services/graphReportService';
import { getErrorMessage, formatDateTime, truncate } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Modal, Select, Spinner, EmptyState, Alert, Badge } from '../components/ui/index.jsx';
import Input from '../components/ui/Input';

const REPORT_TYPES = [
  { value: 'investigation', label: 'Investigation Report' },
  { value: 'legal_analysis', label: 'Legal Analysis' },
  { value: 'evidence_summary', label: 'Evidence Summary' },
  { value: 'case_summary', label: 'Case Summary' },
];

const TYPE_COLORS = {
  investigation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  legal_analysis: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  evidence_summary: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  case_summary: 'bg-green-500/20 text-green-300 border-green-500/30',
};

// Demo reports for display
const DEMO_REPORTS = [
  { id: '1', title: 'Investigation Report - Theft Case #001', report_type: 'investigation', created_at: new Date().toISOString(), case_id: 'CASE-001' },
  { id: '2', title: 'Legal Analysis - Cybercrime Case', report_type: 'legal_analysis', created_at: new Date(Date.now() - 86400000).toISOString(), case_id: 'CASE-002' },
  { id: '3', title: 'Evidence Summary - Murder Case', report_type: 'evidence_summary', created_at: new Date(Date.now() - 172800000).toISOString(), case_id: 'CASE-003' },
  { id: '4', title: 'Case Summary - Fraud Investigation', report_type: 'case_summary', created_at: new Date(Date.now() - 259200000).toISOString(), case_id: 'CASE-004' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState(DEMO_REPORTS);
  const [loading, setLoading] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [genForm, setGenForm] = useState({ case_id: '', report_type: 'investigation', title: '' });

  const setGF = (k) => (e) => setGenForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports();
      if (data.items?.length) setReports(data.items);
    } catch {
      // Use demo data if API not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    try {
      const res = await reportService.generateReport(genForm);
      setReports((r) => [res, ...r]);
      setGenerateOpen(false);
      setSuccess('Report generated successfully');
    } catch (err) {
      // Demo: add locally
      const demo = { id: Date.now().toString(), ...genForm, created_at: new Date().toISOString() };
      setReports((r) => [demo, ...r]);
      setGenerateOpen(false);
      setSuccess('Report generated (demo mode)');
    } finally {
      setGenLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await reportService.deleteReport(id);
    } catch {}
    setReports((r) => r.filter((x) => x.id !== id));
    setSuccess('Report deleted');
  };

  const filtered = search
    ? reports.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase()))
    : reports;

  const stats = REPORT_TYPES.map((t) => ({
    ...t,
    count: reports.filter((r) => r.report_type === t.value).length,
  }));

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Reports</h2>
          <p className="text-sm text-slate-400">{reports.length} reports generated</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} icon={<MdAdd size={18} />}>Generate Report</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-2xl font-bold text-white">{s.count}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & list */}
      <Card>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full input-glass rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <Button onClick={load} variant="secondary" icon={<MdRefresh size={16} />}>Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MdAssessment />}
            title="No reports found"
            description="Generate your first report to get started."
            action={<Button onClick={() => setGenerateOpen(true)} icon={<MdAdd size={16} />}>Generate Report</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MdAssessment className="text-blue-400" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${TYPE_COLORS[r.report_type]} border`}>
                        {REPORT_TYPES.find((t) => t.value === r.report_type)?.label || r.report_type}
                      </Badge>
                      <span className="text-xs text-slate-500">{formatDateTime(r.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => setViewReport(r)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <MdVisibility size={16} />
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors">
                    <MdDownload size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Report">
        <form onSubmit={handleGenerate} className="space-y-4">
          <Input label="Report Title" value={genForm.title} onChange={setGF('title')} placeholder="e.g. Investigation Report - Case #001" required />
          <Input label="Case ID" value={genForm.case_id} onChange={setGF('case_id')} placeholder="Enter case ID" required />
          <Select label="Report Type" value={genForm.report_type} onChange={setGF('report_type')} options={REPORT_TYPES} required />
          <Button type="submit" loading={genLoading} className="w-full">Generate Report</Button>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewReport} onClose={() => setViewReport(null)} title="Report Details" size="lg">
        {viewReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${TYPE_COLORS[viewReport.report_type]} border`}>
                {REPORT_TYPES.find((t) => t.value === viewReport.report_type)?.label}
              </Badge>
              <span className="text-xs text-slate-400">{formatDateTime(viewReport.created_at)}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Title</p>
              <p className="text-white font-semibold">{viewReport.title}</p>
            </div>
            {viewReport.case_id && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Case ID</p>
                <p className="text-blue-400 font-mono text-sm">{viewReport.case_id}</p>
              </div>
            )}
            {viewReport.content && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Content</p>
                <div className="glass rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {viewReport.content}
                </div>
              </div>
            )}
            <Button className="w-full" variant="secondary" icon={<MdDownload size={16} />}>
              Download PDF
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
