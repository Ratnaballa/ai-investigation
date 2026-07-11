import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard, MdChat, MdGavel, MdFolder, MdBubbleChart,
  MdAssessment, MdPerson, MdLogout, MdMenu, MdClose, MdShield,
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
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <MdShield className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">AI Investigation</p>
            <p className="text-xs text-blue-400 font-medium">Assistant</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
              <span className={`status-badge text-xs ${roleBadgeColor(user.role)}`}>
                {roleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'active bg-blue-500/20 text-blue-300'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <MdLogout size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-dark border-r border-white/10 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 glass-dark border-r border-white/10 lg:hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
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
