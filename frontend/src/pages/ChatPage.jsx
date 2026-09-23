import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSend, MdChat, MdDelete, MdAdd, MdGavel, MdSearch,
  MdExpandMore, MdExpandLess, MdShield, MdAssignment,
  MdWarning, MdSource, MdPerson, MdSmartToy, MdAutoAwesome,
} from 'react-icons/md';
import { chatService } from '../services/chatService';
import { getErrorMessage, formatDateTime } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Spinner, Alert } from '../components/ui/index.jsx';

function BNSCard({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left transition hover:bg-blue-100/50 dark:hover:bg-blue-500/20"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MdGavel className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={16} />
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-300 truncate">{section.section}</span>
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate hidden sm:block">— {section.title}</span>
        </div>
        {open ? <MdExpandLess className="text-slate-500 flex-shrink-0" size={18} /> : <MdExpandMore className="text-slate-500 flex-shrink-0" size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-blue-200 dark:border-blue-500/20">
              <p className="text-xs text-slate-800 dark:text-slate-300 pt-2"><span className="font-semibold text-slate-500 dark:text-slate-400">Description:</span> {section.description}</p>
              <p className="text-xs text-red-700 dark:text-red-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Punishment:</span> {section.punishment}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300"><span className="font-semibold text-slate-500 dark:text-slate-400">Relevance:</span> {section.relevance}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InvestigationStep({ step }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
        {step.step}
      </div>
      <div className="flex-1 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{step.action}</p>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-xs text-slate-600 dark:text-slate-400">👤 {step.responsible}</span>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">⏱ {step.time_frame}</span>
        </div>
      </div>
    </div>
  );
}

function LegalResponsePanel({ response }) {
  if (!response) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-4"
    >
      {/* Case Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MdAssignment size={14} className="text-blue-600 dark:text-blue-400" /> Case Summary
        </h4>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{response.case_summary}</p>
      </div>

      {/* BNS Sections */}
      {response.recommended_bns_sections?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdGavel size={14} className="text-blue-600 dark:text-blue-400" /> Recommended BNS Sections ({response.recommended_bns_sections.length})
          </h4>
          <div className="space-y-2">
            {response.recommended_bns_sections.map((s, i) => <BNSCard key={i} section={s} />)}
          </div>
        </div>
      )}

      {/* Investigation Procedure */}
      {response.investigation_procedure?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdSearch size={14} className="text-blue-600 dark:text-blue-400" /> Investigation Procedure
          </h4>
          <div className="space-y-2">
            {response.investigation_procedure.map((s, i) => <InvestigationStep key={i} step={s} />)}
          </div>
        </div>
      )}

      {/* Precautions */}
      {response.legal_precautions?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 p-4">
          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MdWarning size={14} /> Legal Precautions
          </h4>
          <ul className="space-y-1">
            {response.legal_precautions.map((p, i) => (
              <li key={i} className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                <span>•</span><span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {response.sources?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MdSource size={14} className="text-blue-600 dark:text-blue-400" /> Sources
          </h4>
          <div className="flex flex-wrap gap-2">
            {response.sources.map((s, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const data = await chatService.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSession = async (sessionId) => {
    setActiveSession(sessionId);
    setLoading(true);
    setError('');
    try {
      const data = await chatService.getHistory(sessionId);
      const formatted = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        time: m.created_at,
        isStructured: !!m.structured_response,
        response: m.structured_response || null,
      }));
      setMessages(formatted);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput('');
    setError('');
    inputRef.current?.focus();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: q, time: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError('');

    try {
      const data = await chatService.sendMessage(q, activeSession);

      if (!activeSession && data.session_id) {
        setActiveSession(data.session_id);
        fetchSessions();
      }

      const aiMsg = {
        role: 'assistant',
        content: data.response?.case_summary || data.reply || 'Legal analysis generated.',
        time: new Date().toISOString(),
        isStructured: true,
        response: data.response || null,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    try {
      await chatService.deleteSession(id);
      setSessions((s) => s.filter((x) => x.id !== id));
      if (activeSession === id) newChat();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const SUGGESTIONS = [
    'Theft of motor vehicle from parking area at night.',
    'Cyber fraud — unauthorized Rs 2 lakh bank transfer via phishing.',
    'Domestic violence case — wife filed complaint against husband.',
    'Murder case — body found with stab wounds in a residential area.',
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Sessions sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 p-3">
          <Button onClick={newChat} className="w-full" size="sm" icon={<MdAdd size={16} />}>
            New Investigation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No sessions yet</p>
          ) : (
            sessions.map((s) => {
              const isActive = activeSession === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`group relative mb-2 flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-blue-100 shadow-sm'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-600 dark:bg-blue-500" />
                  )}

                  {/* Header: Title and Delete icon */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <MdChat size={14} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {s.title || 'New Investigation'}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(s.id);
                      }}
                      className="rounded p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <MdDelete size={14} />
                    </button>
                  </div>

                  {/* Last message preview */}
                  <p className={`text-[11px] truncate px-5 ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-slate-500'}`}>
                    {s.last_message || 'No messages yet'}
                  </p>

                  {/* Footer: Time */}
                  <div className="flex items-center justify-between px-5 mt-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {s.updated_at ? formatDateTime(s.updated_at) : formatDateTime(s.created_at)}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">Active</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <MdSmartToy size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">CaseMind AI</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">● Online</p>
            </div>
          </div>
          <Button onClick={newChat} variant="secondary" size="sm" icon={<MdAdd size={14} />}>
            New
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MdGavel size={32} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">AI Legal Assistant</h3>
              <p className="mb-6 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Describe a legal case or situation to get structured analysis with applicable BNS/IPC sections, investigation procedure, and legal precautions.
              </p>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 text-white shadow-sm">
                  <MdSmartToy size={16} />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 text-sm leading-relaxed rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.isStructured && msg.response && (
                  <div className="w-full mt-1">
                    <LegalResponsePanel response={msg.response} />
                  </div>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-1 font-mono">{formatDateTime(msg.time)}</span>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <MdPerson size={16} />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white">
                <MdSmartToy size={16} />
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 px-4 py-3 shadow-sm">
                <div className="rounded-full bg-blue-50 dark:bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                  <MdAutoAwesome size={14} />
                </div>
                <Spinner size="sm" />
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Analysing legal query...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Describe a legal case or ask a legal question... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              loading={loading}
              className="self-end"
              icon={<MdSend size={16} />}
            >
              Send
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Delete Investigation?</h3>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                This will permanently delete this conversation and all associated messages. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    deleteSession(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
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
