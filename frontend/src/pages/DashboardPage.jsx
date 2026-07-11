import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdFolder, MdChat, MdPeople, MdAssessment, MdGavel,
  MdTrendingUp, MdWarning, MdCheckCircle,
} from 'react-icons/md';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuthContext } from '../utils/AuthContext';
import { caseService } from '../services/caseService';
import { chatService } from '../services/chatService';
import StatCard from '../components/StatCard';
import Card from '../components/ui/Card';
import { statusColor, statusLabel, formatDate } from '../utils/helpers';

const AREA_DATA = [
  { month: 'Jan', cases: 12, chats: 45 }, { month: 'Feb', cases: 19, chats: 62 },
  { month: 'Mar', cases: 15, chats: 58 }, { month: 'Apr', cases: 25, chats: 80 },
  { month: 'May', cases: 22, chats: 75 }, { month: 'Jun', cases: 30, chats: 95 },
  { month: 'Jul', cases: 28, chats: 88 },
];

const PIE_DATA = [
  { name: 'Open', value: 35, color: '#22c55e' },
  { name: 'Under Investigation', value: 45, color: '#3b82f6' },
  { name: 'Closed', value: 15, color: '#64748b' },
  { name: 'Archived', value: 5, color: '#f59e0b' },
];

const BAR_DATA = [
  { type: 'Physical', count: 28 }, { type: 'Digital', count: 45 },
  { type: 'Documentary', count: 32 }, { type: 'Testimonial', count: 18 },
  { type: 'Forensic', count: 22 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-dark rounded-xl p-3 text-xs border border-white/10">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      caseService.getCases(1, 5).catch(() => ({ items: [], total: 0 })),
      chatService.getSessions(1, 5).catch(() => ({ sessions: [], total: 0 })),
    ]).then(([c, s]) => {
      setCases(c.items || c.cases || []);
      setSessions(s.sessions || s.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: MdFolder, label: 'Total Cases', value: '142', color: 'blue', trend: { up: true, value: '12% this month' }, delay: 0 },
    { icon: MdChat, label: 'AI Consultations', value: '1,284', color: 'purple', trend: { up: true, value: '8% this week' }, delay: 0.05 },
    { icon: MdGavel, label: 'BNS Sections Used', value: '89', color: 'amber', trend: { up: true, value: '5 new' }, delay: 0.1 },
    { icon: MdPeople, label: 'Active Officers', value: '34', color: 'green', trend: { up: false, value: '2 offline' }, delay: 0.15 },
    { icon: MdAssessment, label: 'Reports Generated', value: '67', color: 'cyan', delay: 0.2 },
    { icon: MdWarning, label: 'Pending Review', value: '8', color: 'red', delay: 0.25 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Here's what's happening in your investigation portal today.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MdTrendingUp className="text-blue-400" size={18} />
            Cases & AI Consultations (2024)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={AREA_DATA}>
              <defs>
                <linearGradient id="cases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cases" stroke="#3b82f6" fill="url(#cases)" strokeWidth={2} name="Cases" />
              <Area type="monotone" dataKey="chats" stroke="#a78bfa" fill="url(#chats)" strokeWidth={2} name="AI Chats" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Evidence by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BAR_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="type" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent cases */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MdFolder className="text-blue-400" size={18} />
            Recent Cases
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="shimmer h-12 rounded-xl" />)}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <MdFolder className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm">No cases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <MdFolder className="text-blue-400" size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.case_number} · {formatDate(c.created_at)}</p>
                    </div>
                  </div>
                  <span className={`status-badge ml-2 flex-shrink-0 ${statusColor(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* System status */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'API Server', status: 'Operational' },
            { label: 'Grok AI', status: 'Operational' },
            { label: 'Database', status: 'Operational' },
            { label: 'RAG Pipeline', status: 'Standby' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
              <MdCheckCircle className={s.status === 'Operational' ? 'text-green-400' : 'text-amber-400'} size={16} />
              <div>
                <p className="text-xs font-medium text-white">{s.label}</p>
                <p className={`text-xs ${s.status === 'Operational' ? 'text-green-400' : 'text-amber-400'}`}>{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
