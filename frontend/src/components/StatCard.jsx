import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color, trend, delay = 0 }) {
  const colors = {
    blue: { bg: 'from-blue-600 to-blue-800', glow: 'shadow-blue-500/20', text: 'text-blue-400', light: 'bg-blue-500/10' },
    green: { bg: 'from-green-600 to-green-800', glow: 'shadow-green-500/20', text: 'text-green-400', light: 'bg-green-500/10' },
    purple: { bg: 'from-purple-600 to-purple-800', glow: 'shadow-purple-500/20', text: 'text-purple-400', light: 'bg-purple-500/10' },
    amber: { bg: 'from-amber-600 to-amber-800', glow: 'shadow-amber-500/20', text: 'text-amber-400', light: 'bg-amber-500/10' },
    cyan: { bg: 'from-cyan-600 to-cyan-800', glow: 'shadow-cyan-500/20', text: 'text-cyan-400', light: 'bg-cyan-500/10' },
    red: { bg: 'from-red-600 to-red-800', glow: 'shadow-red-500/20', text: 'text-red-400', light: 'bg-red-500/10' },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.up ? 'text-green-400' : 'text-red-400'}`}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg ${c.glow}`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </motion.div>
  );
}
