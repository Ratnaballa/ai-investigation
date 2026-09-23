import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color, trend, delay = 0 }) {
  const colors = {
    blue: { bg: 'from-blue-600 to-blue-700', glow: 'shadow-blue-500/20', text: 'text-blue-600 dark:text-blue-400', ring: 'border-slate-200 dark:border-slate-800' },
    green: { bg: 'from-emerald-600 to-emerald-700', glow: 'shadow-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'border-slate-200 dark:border-slate-800' },
    purple: { bg: 'from-purple-600 to-purple-700', glow: 'shadow-purple-500/20', text: 'text-purple-600 dark:text-purple-400', ring: 'border-slate-200 dark:border-slate-800' },
    amber: { bg: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20', text: 'text-amber-600 dark:text-amber-400', ring: 'border-slate-200 dark:border-slate-800' },
    cyan: { bg: 'from-cyan-600 to-cyan-700', glow: 'shadow-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', ring: 'border-slate-200 dark:border-slate-800' },
    red: { bg: 'from-red-600 to-red-700', glow: 'shadow-red-500/20', text: 'text-red-600 dark:text-red-400', ring: 'border-slate-200 dark:border-slate-800' },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border ${c.ring} bg-white dark:bg-slate-900 p-5 shadow-sm transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-semibold ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.up ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.bg} text-white shadow-md ${c.glow}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}
