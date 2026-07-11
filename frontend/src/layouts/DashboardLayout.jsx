import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MdMenu, MdNotifications, MdSearch } from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import { useAuthContext } from '../utils/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/legal': 'Legal Recommendation',
  '/cases': 'Case Management',
  '/graph': 'Evidence Relationship Graph',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuthContext();

  const title = PAGE_TITLES[pathname] || 'AI Investigation Assistant';

  return (
    <div className="flex h-screen overflow-hidden gradient-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="glass-dark border-b border-white/10 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <MdMenu size={22} />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">{title}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">AI Investigation Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-2">
              <MdSearch className="text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-40"
              />
            </div>
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <MdNotifications size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            {user && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
