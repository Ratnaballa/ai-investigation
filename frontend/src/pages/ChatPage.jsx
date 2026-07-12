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
    <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left transition hover:bg-blue-500/10"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MdGavel className="text-blue-400 flex-shrink-0" size={16} />
          <span className="text-sm font-semibold text-blue-300 truncate">{section.section}</span>
          <span className="text-xs text-slate-400 truncate hidden sm:block">— {section.title}</span>
        </div>
        {open ? <MdExpandLess className="text-slate-400 flex-shrink-0" size={18} /> : <MdExpandMore className="text-slate-400 flex-shrink-0" size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-blue-500/20">
              <p className="text-xs text-slate-300 pt-2"><span className="text-slate-500">Description:</span> {section.description}</p>
              <p className="text-xs text-red-300"><span className="text-slate-500">Punishment:</span> {section.punishment}</p>
              <p className="text-xs text-green-300"><span className="text-slate-500">Relevance:</span> {section.relevance}</p>
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
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
        {step.step}
      </div>
      <div className="flex-1 pb-3 border-b border-white/5 last:border-0">
        <p className="text-sm font-medium text-white">{step.action}</p>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-xs text-slate-400">👤 {step.responsible}</span>
          <span className="text-xs text-amber-400">⏱ {step.time_frame}</span>
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
      <div className="glass rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MdAssignment size={14} className="text-blue-400" /> Case Summary
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">{response.case_summary}</p>
      </div>

      {/* BNS Sections */}
      {response.recommended_bns_sections?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdGavel size={14} className="text-blue-400" /> Recommended BNS Sections ({response.recommended_bns_sections.length})
          </h4>
          <div className="space-y-2">
            {response.recommended_bns_sections.map((s, i) => <BNSCard key={i} section={s} />)}
          </div>
        </div>
      )}

      {/* Investigation Procedure */}
      {response.investigation_procedure?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdSearch size={14} className="text-blue-400" /> Investigation Procedure
          </h4>
          <div className="space-y-2">
            {response.investigation_procedure.map((s, i) => <InvestigationStep key={i} step={s} />)}
          </div>
        </div>
      )}

      {/* Required Evidence */}
      {response.required_evidence?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdShield size={14} className="text-blue-400" /> Required Evidence
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {response.required_evidence.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                {e}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal Precautions */}
      {response.legal_precautions?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MdWarning size={14} className="text-amber-400" /> Legal Precautions
          </h4>
          <div className="space-y-2">
            {response.legal_precautions.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-200/80">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {response.sources?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MdSource size={14} className="text-blue-400" /> Sources
          </h4>
          <div className="space-y-1">
            {response.sources.map((s, i) => (
              <p key={i} className="text-xs text-blue-400 hover:text-blue-300">{s}</p>
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
  const [lastResponse, setLastResponse] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      setSessionsLoading(true);
      try {
        const data = await chatService.getSessions();
        const loadedSessions = data.sessions || data.items || [];
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          loadSession(loadedSessions[0].id);
        }
      } catch {}
      finally { setSessionsLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await chatService.getSessions();
      setSessions(data.sessions || data.items || []);
    } catch {}
    finally { setSessionsLoading(false); }
  };

  const loadSession = async (sessionId) => {
    setActiveSession(sessionId);
    setLastResponse(null);
    try {
      const data = await chatService.getSessionHistory(sessionId);
      const msgs = (data.messages || []).map((m) => {
        if (m.role === 'assistant') {
          try {
            const parsed = JSON.parse(m.content);
            return {
              role: 'assistant',
              content: parsed.case_summary || 'Analysis complete. See structured response below.',
              time: m.created_at,
              isStructured: true,
              response: parsed,
            };
          } catch (e) {
            return {
              role: 'assistant',
              content: m.content,
              time: m.created_at,
            };
          }
        }
        return {
          role: 'user',
          content: m.content,
          time: m.created_at,
        };
      });
      setMessages(msgs);
    } catch {}
  };

  const newChat = async () => {
    try {
      const newSession = await chatService.createSession();
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession.id);
      setMessages([]);
      setLastResponse(null);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteSession = async (id) => {
    try {
      await chatService.deleteSession(id);
      const remaining = sessions.filter((x) => x.id !== id);
      setSessions(remaining);
      if (activeSession === id) {
        if (remaining.length > 0) {
          loadSession(remaining[0].id);
        } else {
          await newChat();
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setError('');
    setMessages((m) => [...m, { role: 'user', content: text, time: new Date().toISOString() }]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(text, activeSession);
      if (!activeSession) {
        setActiveSession(res.session_id);
        loadSessions();
      } else {
        setSessions((prev) => {
          const updated = prev.map((s) =>
            s.id === activeSession
              ? { ...s, last_message: text, updated_at: new Date().toISOString() }
              : s
          );
          return [...updated].sort(
            (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
          );
        });
      }
      setLastResponse(res);
      setMessages((m) => [...m, {
        role: 'assistant',
        content: res.case_summary || 'Analysis complete. See structured response below.',
        time: new Date().toISOString(),
        isStructured: true,
        response: res,
      }]);
    } catch (err) {
      setError(getErrorMessage(err));
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    'A person was caught stealing a mobile phone worth Rs 15,000 from a shop.',
    'Cybercrime: Someone hacked into a bank account and transferred Rs 2 lakhs.',
    'Domestic violence case — wife filed complaint against husband.',
    'Murder case — body found with stab wounds in a residential area.',
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Sessions sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/50 md:flex">
        <div className="border-b border-white/10 p-3">
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
                  className={`group relative mb-2 flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 border-blue-500/40 text-blue-100 shadow-md shadow-blue-500/5'
                      : 'border-transparent bg-white/0 text-slate-400 hover:bg-white/[0.04] hover:text-white hover:border-white/5'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-500" />
                  )}

                  {/* Header: Title and Delete icon */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <MdChat size={14} className={`flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-blue-100' : 'text-slate-300'}`}>
                        {s.title || 'New Investigation'}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(s.id);
                      }}
                      className="rounded p-1 text-red-500/60 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer opacity-100"
                    >
                      <MdDelete size={14} />
                    </button>
                  </div>

                  {/* Last message preview */}
                  <p className={`text-[11px] truncate px-5 ${isActive ? 'text-blue-200/60' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {s.last_message || 'No messages yet'}
                  </p>

                  {/* Footer: Time */}
                  <div className="flex items-center justify-between px-5 mt-0.5">
                    <span className="text-[10px] text-slate-600 group-hover:text-slate-500 font-mono">
                      {s.updated_at ? formatDateTime(s.updated_at) : formatDateTime(s.created_at)}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-semibold tracking-wider text-blue-400 uppercase">Active</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/55">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <MdSmartToy className="text-white" size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">CaseMind AI</p>
              <p className="text-xs text-emerald-400">● Online</p>
            </div>
          </div>
          <Button onClick={newChat} variant="secondary" size="sm" icon={<MdAdd size={14} />}>
            New
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <MdGavel className="text-blue-400" size={28} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">AI Legal Assistant</h3>
              <p className="mb-6 max-w-md text-sm text-slate-400">
                Describe a legal case or situation to get structured analysis with applicable BNS/IPC sections, investigation procedure, and legal precautions.
              </p>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-left text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <MdSmartToy className="text-white" size={14} />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-bubble-user text-white' : 'chat-bubble-ai text-slate-200'}`}>
                  {msg.content}
                </div>
                {msg.isStructured && msg.response && (
                  <div className="w-full mt-1">
                    <LegalResponsePanel response={msg.response} />
                  </div>
                )}
                <span className="text-xs text-slate-600 mt-1 px-1">{formatDateTime(msg.time)}</span>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <MdPerson className="text-white" size={14} />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <MdSmartToy className="text-white" size={14} />
              </div>
              <div className="chat-bubble-ai flex items-center gap-2 px-4 py-3">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-1.5">
                  <MdAutoAwesome className="text-cyan-300" size={14} />
                </div>
                <Spinner size="sm" />
                <span className="text-sm text-slate-400">Analysing legal query...</span>
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
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Describe a legal case or ask a legal question... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400/40"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-[24px] border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="mb-2 text-lg font-bold text-white">Delete Investigation?</h3>
              <p className="mb-6 text-sm text-slate-400">
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
