import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdFolder, MdChat, MdPeople, MdAssessment, MdGavel,
  MdTrendingUp, MdWarning, MdCheckCircle, MdAutoAwesome, MdTimeline,
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
    <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-xl">
      <p className="mb-1 font-medium text-slate-100">{label}</p>
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden rounded-[28px] border border-white/10"
      >
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              <MdAutoAwesome size={14} />
              Secure command center
            </div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Officer'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Monitor investigations, legal analysis, and evidence relationships from one premium workspace designed for high-stakes operations.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live intake</p>
              <p className="mt-1 text-xl font-semibold text-white">24 new</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Threat score</p>
              <p className="mt-1 text-xl font-semibold text-emerald-400">Low</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MdTrendingUp className="text-blue-400" size={18} />
              Cases & AI Consultations
            </h3>
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-blue-300">
              Weekly growth
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={AREA_DATA}>
              <defs>
                <linearGradient id="cases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
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

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="45%" innerRadius={55} outerRadius={84} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Evidence by Type</h3>
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

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MdFolder className="text-blue-400" size={18} />
              Recent Investigations
            </h3>
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live queue</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
            </div>
          ) : cases.length === 0 ? (
            <div className="py-8 text-center">
              <MdFolder className="mx-auto mb-2 text-slate-600" size={32} />
              <p className="text-sm text-slate-500">No cases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 p-3 transition hover:bg-white/5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                      <MdFolder className="text-blue-400" size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{c.title}</p>
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

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MdTimeline className="text-cyan-400" size={18} />
            Operational Timeline
          </h3>
          <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Updated now</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'API Server', status: 'Operational' },
            { label: 'CaseMind AI', status: 'Operational' },
            { label: 'Database', status: 'Operational' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3">
              <MdCheckCircle className={s.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'} size={18} />
              <div>
                <p className="text-sm font-medium text-white">{s.label}</p>
                <p className={`text-xs ${s.status === 'Operational' ? 'text-emerald-400' : 'text-amber-400'}`}>{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
