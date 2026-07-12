import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdGavel, MdSend, MdExpandMore, MdExpandLess,
  MdShield, MdWarning, MdSearch, MdSource, MdAssignment,
  MdAutoAwesome, MdSecurity,
} from 'react-icons/md';
import { chatService } from '../services/chatService';
import { getErrorMessage } from '../utils/helpers';
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

function BNSAccordion({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-blue-500/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-500/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <MdGavel className="text-blue-400" size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-300">{section.section}</p>
            <p className="text-xs text-slate-400">{section.title}</p>
          </div>
        </div>
        {open ? <MdExpandLess className="text-slate-400" size={20} /> : <MdExpandMore className="text-slate-400" size={20} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-blue-500/20">
              <div className="pt-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-300">{section.description}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">Punishment</p>
                <p className="text-sm text-red-300">{section.punishment}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">Relevance to Case</p>
                <p className="text-sm text-green-300">{section.relevance}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LegalPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await chatService.sendMessage(query.trim());
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query form */}
      <Card glow>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <MdGavel className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Legal Recommendation Engine</h2>
            <p className="text-xs text-slate-400">Powered by CaseMind AI · Indian Law (BNS/IPC)</p>
          </div>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Describe the Case / Legal Situation <span className="text-red-400">*</span>
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the incident in detail — what happened, who was involved, what was the nature of the crime..."
              rows={5}
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/50 focus:bg-slate-900/70"
              required
            />
          </div>

          {/* Sample queries */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setQuery(s.query)}
                  className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/15 hover:text-white"
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
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
              <MdAutoAwesome className="text-cyan-300" size={24} />
            </div>
            <div className="text-center">
              <p className="font-medium text-white">Analysing Legal Query...</p>
              <p className="mt-1 text-sm text-slate-400">Consulting CaseMind AI with Indian law database</p>
            </div>
            <Spinner size="lg" />
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Case Summary */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                <MdAssignment className="text-blue-400" size={16} /> Case Summary
              </h3>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-300">
                Verified
              </span>
            </div>
            <p className="leading-relaxed text-slate-200">{result.case_summary}</p>
          </Card>

          {/* BNS Sections */}
          {result.recommended_bns_sections?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MdGavel className="text-blue-400" size={16} />
                Applicable BNS / IPC Sections ({result.recommended_bns_sections.length})
              </h3>
              <div className="space-y-3">
                {result.recommended_bns_sections.map((s, i) => <BNSAccordion key={i} section={s} />)}
              </div>
            </Card>
          )}

          {/* Two column: Investigation + Evidence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.investigation_procedure?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdSearch className="text-blue-400" size={16} /> Investigation Procedure
                </h3>
                <div className="space-y-3">
                  {result.investigation_procedure.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
                        {step.step}
                      </div>
                      <div className="flex-1 pb-3 border-b border-white/5 last:border-0">
                        <p className="text-sm font-medium text-white">{step.action}</p>
                        <p className="text-xs text-slate-400 mt-0.5">👤 {step.responsible} · ⏱ {step.time_frame}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {result.required_evidence?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MdShield className="text-blue-400" size={16} /> Required Evidence
                </h3>
                <div className="space-y-2">
                  {result.required_evidence.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0 text-sm">✓</span>
                      <span className="text-sm text-slate-300">{e}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Legal Precautions */}
          {result.legal_precautions?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MdWarning className="text-amber-400" size={16} /> Legal Precautions & Rights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.legal_precautions.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">⚠</span>
                    <span className="text-sm text-amber-200/80">{p}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sources */}
          {result.sources?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MdSource className="text-blue-400" size={16} /> Sources
              </h3>
              {result.sources.map((s, i) => <p key={i} className="text-sm text-blue-400">{s}</p>)}
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
