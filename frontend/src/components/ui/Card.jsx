export default function Card({ children, className = '', glow = false }) {
  return (
    <div className={`rounded-2xl p-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm transition-colors ${className}`}>
      {children}
    </div>
  );
}
