import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSend, MdChat, MdDelete, MdAdd, MdGavel, MdSearch,
  MdExpandMore, MdExpandLess, MdShield, MdAssignment,
  MdWarning, MdSource, MdPerson, MdSmartToy,
} from 'react-icons/md';
import { chatService } from '../services/chatService';
import { getErrorMessage, formatDateTime } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Spinner, Alert } from '../components/ui/index.jsx';

function BNSCard({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-500/10 transition-colors"
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
      className="space-y-4 mt-4"
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSessions();
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
      const msgs = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        time: m.created_at,
      }));
      setMessages(msgs);
    } catch {}
  };

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    setLastResponse(null);
    setError('');
    inputRef.current?.focus();
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatService.deleteSession(id);
      setSessions((s) => s.filter((x) => x.id !== id));
      if (activeSession === id) newChat();
    } catch {}
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
      <div className="hidden md:flex flex-col w-64 glass rounded-2xl overflow-hidden flex-shrink-0">
        <div className="p-3 border-b border-white/10">
          <Button onClick={newChat} className="w-full" size="sm" icon={<MdAdd size={16} />}>
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No sessions yet</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left p-2.5 rounded-xl mb-1 group flex items-center justify-between transition-all ${
                  activeSession === s.id ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MdChat size={14} className="flex-shrink-0" />
                  <span className="text-xs truncate">{s.title || 'Chat Session'}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5 rounded transition-all"
                >
                  <MdDelete size={14} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MdSmartToy className="text-white" size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Grok Legal AI</p>
              <p className="text-xs text-green-400">● Online</p>
            </div>
          </div>
          <Button onClick={newChat} variant="secondary" size="sm" icon={<MdAdd size={14} />}>
            New
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
                <MdGavel className="text-blue-400" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Legal Assistant</h3>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Describe a legal case or situation to get structured analysis with applicable BNS/IPC sections, investigation procedure, and legal precautions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="text-left p-3 rounded-xl glass text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/5"
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
              <div className="chat-bubble-ai px-4 py-3 flex items-center gap-2">
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
        <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Describe a legal case or ask a legal question... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 input-glass rounded-xl px-4 py-3 text-sm resize-none"
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
    </div>
  );
}
