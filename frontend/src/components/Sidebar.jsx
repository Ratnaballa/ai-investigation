import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdChat, MdGavel, MdFolder, MdBubbleChart,
  MdAssessment, MdPerson, MdLogout, MdClose, MdShield,
} from 'react-icons/md';
import { useAuthContext } from '../utils/AuthContext';
import { roleLabel, roleBadgeColor } from '../utils/helpers';

const NAV = [
  { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MdChat, label: 'AI Chat' },
  { to: '/legal', icon: MdGavel, label: 'Legal Recommendation' },
  { to: '/cases', icon: MdFolder, label: 'Cases' },
  { to: '/graph', icon: MdBubbleChart, label: 'Evidence Graph' },
  { to: '/reports', icon: MdAssessment, label: 'Reports' },
  { to: '/profile', icon: MdPerson, label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <MdShield className="text-white" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Investigation</p>
            <p className="text-xs text-blue-300">Assistant Platform</p>
          </div>
        </div>
      </div>

      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
              <span className={`status-badge ${roleBadgeColor(user.role)}`}>
                {roleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${
                isActive ? 'active text-blue-100' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="sidebar-item flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-red-300 hover:text-red-200"
        >
          <MdLogout size={19} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex h-screen w-72 flex-shrink-0 flex-col sticky top-0 border-r border-white/10 glass-dark">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 glass-dark border-r border-white/10 lg:hidden"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <MdClose size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
