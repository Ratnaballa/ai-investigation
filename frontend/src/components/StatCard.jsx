import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color, trend, delay = 0 }) {
  const colors = {
    blue: { bg: 'from-blue-600 to-blue-800', glow: 'shadow-blue-500/20', text: 'text-blue-400', ring: 'border-blue-500/20' },
    green: { bg: 'from-green-600 to-green-800', glow: 'shadow-green-500/20', text: 'text-green-400', ring: 'border-green-500/20' },
    purple: { bg: 'from-purple-600 to-purple-800', glow: 'shadow-purple-500/20', text: 'text-purple-400', ring: 'border-purple-500/20' },
    amber: { bg: 'from-amber-600 to-amber-800', glow: 'shadow-amber-500/20', text: 'text-amber-400', ring: 'border-amber-500/20' },
    cyan: { bg: 'from-cyan-600 to-cyan-800', glow: 'shadow-cyan-500/20', text: 'text-cyan-400', ring: 'border-cyan-500/20' },
    red: { bg: 'from-red-600 to-red-800', glow: 'shadow-red-500/20', text: 'text-red-400', ring: 'border-red-500/20' },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className={`premium-card rounded-2xl border ${c.ring} p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="text-3xl font-semibold text-white">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs ${trend.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.up ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.bg} shadow-lg ${c.glow}`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </motion.div>
  );
}
