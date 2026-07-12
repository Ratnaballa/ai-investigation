import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MdAssessment, MdAdd, MdDelete, MdDownload, MdVisibility,
  MdRefresh, MdSearch,
} from 'react-icons/md';
import { reportService } from '../services/graphReportService';
import { generateReportPDF } from '../utils/pdfGenerator';
import { getErrorMessage, formatDateTime } from '../utils/helpers';
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

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [genForm, setGenForm] = useState({ case_id: '', report_type: 'investigation', title: '' });

  const setGF = (k) => (e) => setGenForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getReports();
      // Sort newest first
      const items = (data.items || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setReports(items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await reportService.generateReport(genForm);
      setReports((r) => [res, ...r].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setGenerateOpen(false);
      setSuccess('Report generated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenLoading(false);
    }
  };

  const handleOpenReport = async (reportId) => {
    setViewLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await reportService.getReportById(reportId);
      setViewReport(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await reportService.deleteReport(id);
      setReports((r) => r.filter((x) => x.id !== id));
      setSuccess('Report deleted successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? reports.filter((r) =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.case_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.report_type?.toLowerCase().includes(search.toLowerCase())
      )
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Reports</h2>
          <p className="text-sm text-slate-400">{reports.length} reports generated · Ready for review</p>
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
            className="premium-card rounded-2xl border border-white/10 p-4"
          >
            <p className="text-2xl font-semibold text-white">{s.count}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{s.label}</p>
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
              placeholder="Search reports by title, case ID, or type..."
              className="w-full input-glass rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <Button onClick={load} variant="secondary" icon={<MdRefresh size={16} />}>Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<MdAssessment className="text-slate-500" />}
            title="No Reports Generated Yet"
            description="Create or generate your first professional legal report to begin."
            action={<Button onClick={() => setGenerateOpen(true)} icon={<MdAdd size={16} />}>Generate First Report</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MdAssessment className="text-slate-500" />}
            title="No reports match search"
            description="Try adjusting your keywords."
            action={<Button onClick={() => setSearch('')}>Clear Search</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleOpenReport(r.id)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition hover:bg-white/5 cursor-pointer"
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
                      {r.case_id && (
                        <span className="text-xs text-blue-400 font-mono font-medium">Case: {r.case_id}</span>
                      )}
                      <span className="text-xs text-slate-500">• {formatDateTime(r.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenReport(r.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                  >
                    <MdVisibility size={16} />
                  </button>
                  <button
                    onClick={() => generateReportPDF(r)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer"
                  >
                    <MdDownload size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(r.id, e)}
                    className="p-1.5 rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
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
      <Modal open={!!viewReport || viewLoading} onClose={() => setViewReport(null)} title="Report Details Preview" size="xl">
        {viewLoading && (
          <div className="space-y-4 animate-pulse p-4">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-white/10 rounded w-24"></div>
              <div className="h-4 bg-white/10 rounded w-32"></div>
            </div>
            <div className="h-8 bg-white/10 rounded w-2/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-white/10 rounded-xl"></div>
              <div className="h-12 bg-white/10 rounded-xl"></div>
            </div>
            <div className="h-40 bg-white/10 rounded-xl"></div>
          </div>
        )}
        {viewReport && !viewLoading && (
          <div className="space-y-6">
            {/* Top Action Bar inside Modal */}
            <div className="flex justify-end gap-3 border-b border-white/10 pb-4">
              <Button onClick={() => window.print()} variant="secondary" icon={<MdVisibility size={16} />}>
                Print Report
              </Button>
              <Button onClick={() => generateReportPDF(viewReport)} icon={<MdDownload size={16} />}>
                Download PDF
              </Button>
            </div>

            {/* Virtual Page Printable Container */}
            <div
              id="printable-report-area"
              className="bg-white text-slate-800 p-8 rounded-[16px] border border-slate-200 shadow-xl max-h-[60vh] overflow-y-auto font-sans leading-relaxed"
            >
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Logo and Branding */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-900 font-bold text-base tracking-wider">👮 AI INVESTIGATION ASSISTANT</span>
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{viewReport.title}</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
                      CONFIDENTIAL // LAW ENFORCEMENT & LEGAL USE ONLY
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                      {(viewReport.report_type || '').replace(/_/g, ' ')}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">Status: {viewReport.is_finalized ? 'FINALIZED' : 'DRAFT'}</p>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Report ID</span>
                  <span className="font-semibold text-slate-700">{viewReport.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Case ID</span>
                  <span className="font-semibold text-slate-700">{viewReport.case_id || '—'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Generated Date & Time</span>
                  <span className="font-semibold text-slate-700">{formatDateTime(viewReport.created_at)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">Officer Name</span>
                  <span className="font-semibold text-slate-700">{viewReport.created_by_name || 'System Generated'}</span>
                </div>
              </div>

              {/* Report Body */}
              <div className="space-y-6 text-xs text-slate-700">
                {/* 1. Case Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    1. Executive Case Summary
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {viewReport.content?.case_summary || viewReport.summary || 'No summary details generated.'}
                  </p>
                </div>

                {/* 2. Applicable BNS Sections */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    2. Applicable BNS / IPC Sections
                  </h3>
                  {viewReport.content?.applicable_bns_sections?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {viewReport.content.applicable_bns_sections.map((sec, i) => (
                        <li key={i}>{sec}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-slate-400 text-[11px]">No BNS sections specified in this report.</p>
                  )}
                </div>

                {/* 3. Investigation Procedure */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    3. Recommended Investigation Procedure
                  </h3>
                  {viewReport.content?.investigation_procedure?.length > 0 ? (
                    <ol className="list-decimal pl-5 space-y-1.5">
                      {viewReport.content.investigation_procedure.map((step, i) => (
                        <li key={i} className="pl-1">{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="italic text-slate-400 text-[11px]">No investigation procedure steps specified.</p>
                  )}
                </div>

                {/* 4. Required Evidence */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    4. Required Evidence Checklist
                  </h3>
                  {viewReport.content?.required_evidence?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {viewReport.content.required_evidence.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-300 rounded flex-shrink-0"></span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-slate-400 text-[11px]">No required evidence items specified.</p>
                  )}
                </div>

                {/* 5. Legal Precautions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    5. Legal Precautions & Safeguards
                  </h3>
                  {viewReport.content?.legal_precautions?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-red-800">
                      {viewReport.content.legal_precautions.map((p, i) => (
                        <li key={i}>⚠ {p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-slate-400 text-[11px]">No legal precautions specified.</p>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl text-center font-sans">
                <p className="text-[9px] text-slate-400 italic">
                  Disclaimer: This report is generated by an artificial intelligence system for investigation support purposes. All findings, legal recommendations, and procedures must be verified by a qualified human officer before taking official action.
                </p>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>System Timestamp: {new Date(viewReport.created_at).toLocaleString('en-IN')}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Report?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400 font-medium">
            Are you sure you want to delete this report? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
