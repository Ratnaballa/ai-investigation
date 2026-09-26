import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

export function Badge({ children, className = '' }) {
  return (
    <span className={`status-badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
  );
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <svg className={`animate-spin ${s} text-blue-600 dark:text-cyan-400`} fill="none" viewBox="0 0 24 24">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full ${widths[size]} max-h-[90vh] overflow-y-auto rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-2xl transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827] transition"
              >
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
      {label && (
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="cursor-pointer rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-cyan-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, className = '', required = false }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="resize-none rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111827] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#94A3B8] outline-none transition focus:border-blue-500 dark:focus:border-cyan-400"
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#111827] p-4 text-5xl text-slate-400 dark:text-[#94A3B8]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-slate-600 dark:text-[#94A3B8]">{description}</p>}
      {action}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-600 dark:text-[#94A3B8] text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export function Alert({ type = 'error', message, onClose }) {
  const styles = {
    error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    info: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${styles[type]}`}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition">
          <MdClose size={16} />
        </button>
      )}
    </motion.div>
  );
}
