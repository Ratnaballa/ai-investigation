import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock, MdShield, MdVisibility, MdVisibilityOff, MdWbSunny, MdNightsStay } from 'react-icons/md';
import { useAuthContext } from '../utils/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import { getErrorMessage } from '../utils/helpers';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Alert } from '../components/ui/index.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg text-white"
          >
            <MdShield size={32} />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Investigation Assistant</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Government Law Enforcement Portal</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl transition-colors">
          <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">Sign In to Your Account</h2>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@police.gov.in"
              required
              icon={<MdEmail size={16} />}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <MdLock size={16} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPass ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-3 text-left">
            <p className="mb-0.5 text-xs font-bold text-blue-800 dark:text-blue-300">Demo Credentials</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">admin@investigation.gov / Admin@123456</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          © 2026 AI Investigation Assistant. Government Use Only.
        </p>
      </motion.div>
    </div>
  );
}
