export default function Card({ children, className = '', glow = false }) {
  return (
    <div className={`rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors ${className}`}>
      {children}
    </div>
  );
}
