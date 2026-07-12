import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

export function Badge({ children, className = '' }) {
  return (
    <span className={`status-badge ${className}`}>{children}</span>
  );
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <svg className={`animate-spin ${s} text-blue-400`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.76)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full ${widths[size]} max-h-[90vh] overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/90 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Select({ label, value, onChange, options = [], className = '', required = false }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-300">{label} {required && <span className="text-red-400">*</span>}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.75 text-sm text-slate-100 outline-none appearance-none transition focus:border-blue-400/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#1e293b' }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, className = '', required = false }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-300">{label} {required && <span className="text-red-400">*</span>}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.75 text-sm text-slate-100 outline-none transition focus:border-blue-400/40"
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-5xl opacity-80">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-200">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function Alert({ type = 'error', message, onClose }) {
  const styles = {
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      <span>{message}</span>
      {onClose && <button onClick={onClose} className="opacity-70 transition hover:opacity-100"><MdClose size={16} /></button>}
    </motion.div>
  );
}
