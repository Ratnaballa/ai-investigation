import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdShield, MdEmail, MdLock, MdPerson, MdBadge, MdPhone, MdWbSunny, MdNightsStay } from 'react-icons/md';
import { authService } from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
import { getErrorMessage } from '../utils/helpers';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Alert } from '../components/ui/index.jsx';

const ROLES = [
  { value: 'public', label: 'Public' },
  { value: 'police_officer', label: 'Police Officer' },
  { value: 'investigation_officer', label: 'Investigation Officer' },
  { value: 'lawyer', label: 'Lawyer' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'public',
    badge_number: '', department: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.badge_number) delete payload.badge_number;
      if (!payload.department) delete payload.department;
      if (!payload.phone) delete payload.phone;
      const res = await authService.register(payload);
      setSuccess(res.message || 'Registration successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition cursor-pointer"
        >
          {isDark ? <MdWbSunny className="text-amber-400" size={18} /> : <MdNightsStay className="text-slate-700" size={18} />}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg text-white">
            <MdShield size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">AI Investigation Assistant Portal</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl transition-colors">
          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Arjun Sharma" required icon={<MdPerson size={16} />} />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="officer@police.gov.in" required icon={<MdEmail size={16} />} />
            </div>
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, uppercase, digit, special" required icon={<MdLock size={16} />} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Role <span className="text-red-500">*</span></label>
              <select
                value={form.role}
                onChange={set('role')}
                required
                className="cursor-pointer rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {ROLES.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{o.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Badge Number" value={form.badge_number} onChange={set('badge_number')} placeholder="MH-1234" icon={<MdBadge size={16} />} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+919876543210" icon={<MdPhone size={16} />} />
            </div>
            <Input label="Department" value={form.department} onChange={set('department')} placeholder="Cyber Crime Division" />
            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
