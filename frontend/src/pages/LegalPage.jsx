import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdGavel, MdSend, MdExpandMore, MdExpandLess,
  MdShield, MdWarning, MdSearch, MdSource, MdAssignment,
  MdAutoAwesome, MdDelete, MdHistory, MdVisibility,
} from 'react-icons/md';
import { legalService } from '../services/legalService';
import { legalHistoryService } from '../services/legalHistoryService';
import { getErrorMessage, formatDateTime, truncate } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Spinner, Alert } from '../components/ui/index.jsx';

const SAMPLE_QUERIES = [
  { label: 'Theft', query: 'A person stole a motorcycle worth Rs 80,000 from a parking lot at night.' },
  { label: 'Cybercrime', query: 'Someone sent threatening messages via WhatsApp and demanded Rs 5 lakhs.' },
  { label: 'Assault', query: 'A group of 4 people attacked a shopkeeper causing grievous injuries.' },
  { label: 'Fraud', query: 'A person sold fake gold jewellery worth Rs 3 lakhs to an elderly woman.' },
  { label: 'Drug Trafficking', query: 'Police seized 2 kg of heroin from a vehicle during a routine check.' },
  { label: 'Kidnapping', query: 'A child was abducted from school premises and ransom was demanded.' },
];

function generateTitle(query) {
  const q = query.toLowerCase();
  if (q.includes('murder') || q.includes('kill') || q.includes('stab')) return 'Murder Investigation';
  if (q.includes('theft') || q.includes('stole') || q.includes('stolen')) return 'Theft Case';
  if (q.includes('cyber') || q.includes('hack') || q.includes('whatsapp') || q.includes('online')) return 'Cybercrime';
  if (q.includes('fraud') || q.includes('fake') || q.includes('cheat')) return 'Fraud Case';
  if (q.includes('drug') || q.includes('heroin') || q.includes('narcotic')) return 'Drug Trafficking';
  if (q.includes('kidnap') || q.includes('abduct') || q.includes('ransom')) return 'Kidnapping';
  if (q.includes('assault') || q.includes('attack') || q.includes('beat')) return 'Assault Case';
  if (q.includes('domestic') || q.includes('wife') || q.includes('husband')) return 'Domestic Violence';
  if (q.includes('rape') || q.includes('sexual')) return 'Sexual Offence';
  if (q.includes('robbery') || q.includes('dacoity')) return 'Robbery Case';
  if (q.includes('cheque') || q.includes('bounce')) return 'Cheque Bounce';
  if (q.includes('accident') || q.includes('vehicle')) return 'Vehicle Accident';
  return truncate(query, 30) || 'Legal Query';
}

function normaliseResult(res) {
  if (res.recommended_bns_sections) return res;

  return {
    case_summary: res.reasoning || res.case_description || '',
    recommended_bns_sections: (res.recommended_sections || []).map((s) => ({
      section: `${s.act_name} § ${s.section_number}`,
      title: s.title,
      description: s.description,
      punishment: s.punishment || '—',
      relevance: `Relevance score: ${s.relevance_score}`,
    })),
    investigation_procedure: (res.investigation_procedure || []).map((s) => ({
      step: s.step_number,
      action: s.action,
      responsible: s.responsible_authority,
      time_frame: s.time_frame || '—',
    })),
    required_evidence: [],
    legal_precautions: res.bail_eligibility
      ? [`Bail eligibility: ${res.bail_eligibility}`, ...(res.applicable_courts || []).map((c) => `Applicable court: ${c}`)]
      : (res.applicable_courts || []).map((c) => `Applicable court: ${c}`),
    sources: [],
  };
}

function BNSAccordion({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 overflow-hidden bg-blue-50/40 dark:bg-blue-500/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100/50 dark:hover:bg-blue-500/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
            <MdGavel size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-300">{section.section}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{section.title}</p>
          </div>
        </div>
        {open ? <MdExpandLess className="text-slate-500" size={20} /> : <MdExpandMore className="text-slate-500" size={20} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-blue-200 dark:border-blue-500/20">
              <div className="pt-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-800 dark:text-slate-200">{section.description}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Punishment</p>
                <p className="text-sm text-red-900 dark:text-red-300">{section.punishment}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Relevance to Case</p>
                <p className="text-sm text-emerald-900 dark:text-emerald-300">{section.relevance}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultPanel({ result }) {
  if (!result) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Case Summary */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <MdAssignment className="text-blue-600 dark:text-blue-400" size={16} /> Case Summary
          </h3>
          <span className="rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            Verified
          </span>
        </div>
        <p className="leading-relaxed text-slate-800 dark:text-slate-200 font-medium">{result.case_summary}</p>
      </Card>

      {/* BNS Sections */}
      {result.recommended_bns_sections?.length > 0 && (
        <Card>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MdGavel className="text-blue-600 dark:text-blue-400" size={16} />
            Applicable BNS / IPC Sections ({result.recommended_bns_sections.length})
          </h3>
          <div className="space-y-3">
            {result.recommended_bns_sections.map((s, i) => <BNSAccordion key={i} section={s} />)}
          </div>
        </Card>
      )}

      {/* Investigation + Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {result.investigation_procedure?.length > 0 && (
          <Card>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdSearch className="text-blue-600 dark:text-blue-400" size={16} /> Investigation Procedure
            </h3>
            <div className="space-y-3">
              {result.investigation_procedure.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                    {step.step}
                  </div>
                  <div className="flex-1 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{step.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">👤 {step.responsible} · ⏱ {step.time_frame}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {result.required_evidence?.length > 0 && (
          <Card>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdShield className="text-blue-600 dark:text-blue-400" size={16} /> Required Evidence
            </h3>
            <div className="space-y-2">
              {result.required_evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 text-sm">✓</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{e}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Legal Precautions */}
      {result.legal_precautions?.length > 0 && (
        <Card>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MdWarning className="text-amber-600 dark:text-amber-400" size={16} /> Legal Precautions & Rights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.legal_precautions.map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <span className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">⚠</span>
                <span className="text-sm text-amber-900 dark:text-amber-200 font-medium">{p}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sources */}
      {result.sources?.length > 0 && (
        <Card>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MdSource className="text-blue-600 dark:text-blue-400" size={16} /> Sources
          </h3>
          {result.sources.map((s, i) => <p key={i} className="text-sm text-blue-600 dark:text-blue-400 font-medium">{s}</p>)}
        </Card>
      )}
    </motion.div>
  );
}

export default function LegalPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await legalHistoryService.getHistory();
      setHistory(data.items || []);
    } catch {
      // silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setResult(null);
    setActiveHistoryId(null);
    setLoading(true);

    try {
      const raw = await legalService.recommend(query.trim());
      const normalised = normaliseResult(raw);
      setResult(normalised);

      const title = generateTitle(query.trim());
      const summary = truncate(normalised.case_summary, 120);
      try {
        const saved = await legalHistoryService.saveHistory(
          query.trim(),
          normalised,
          title,
          summary,
        );
        setHistory((prev) => [saved, ...prev]);
        setActiveHistoryId(saved.id);
      } catch {
        // history save failure should not break result display
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = (item) => {
    setActiveHistoryId(item.id);
    setResult(item.result);
    setQuery(item.query);
    setError('');
  };

  const confirmDelete = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await legalHistoryService.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (activeHistoryId === id) {
        setActiveHistoryId(null);
        setResult(null);
        setQuery('');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* ── History Sidebar ── */}
      <div className="hidden w-72 flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-2 px-1">
            <MdHistory className="text-blue-600 dark:text-blue-400" size={16} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">History</span>
            <span className="ml-auto text-xs font-semibold text-slate-500">{history.length}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-3">
              <MdGavel className="text-slate-400 mb-2" size={28} />
              <p className="text-xs font-semibold text-slate-500">No recommendations yet</p>
              <p className="text-xs text-slate-400 mt-1">Your legal analyses will appear here</p>
            </div>
          ) : (
            history.map((item) => {
              const isActive = activeHistoryId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => openHistoryItem(item)}
                  className={`group relative mb-2 flex flex-col gap-1 rounded-2xl p-3 cursor-pointer border transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40 shadow-sm'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-600 dark:bg-blue-500" />
                  )}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <MdGavel size={13} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => confirmDelete(e, item.id)}
                      className="rounded p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <MdDelete size={13} />
                    </button>
                  </div>
                  <p className={`text-[11px] truncate px-5 ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-slate-500'}`}>
                    {item.summary}
                  </p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 px-5 font-mono">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto space-y-6 min-w-0">
        {/* Query form */}
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <MdGavel size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Legal Recommendation Engine</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Powered by CaseMind AI · Indian Law (BNS/IPC)</p>
            </div>
          </div>

          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Describe the Case / Legal Situation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe the incident in detail — what happened, who was involved, what was the nature of the crime..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUERIES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setQuery(s.query)}
                    className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" icon={<MdSend size={16} />}>
              Get Legal Analysis
            </Button>
          </form>
        </Card>

        {/* Loading */}
        {loading && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <MdAutoAwesome size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">Analysing Legal Query...</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Consulting CaseMind AI with Indian law database</p>
              </div>
              <Spinner size="lg" />
            </div>
          </Card>
        )}

        {/* Results */}
        {result && !loading && <ResultPanel result={result} />}
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Delete Recommendation?</h3>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                This will permanently remove this legal recommendation from your history. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
