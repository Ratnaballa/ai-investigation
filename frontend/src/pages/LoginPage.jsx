import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock, MdShield, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuthContext } from '../utils/AuthContext';
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.16),_transparent_24%)] p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl"
          >
            <MdShield className="text-white" size={32} />
          </motion.div>
          <h1 className="text-2xl font-semibold text-white">AI Investigation Assistant</h1>
          <p className="mt-1 text-sm text-slate-400">Government Law Enforcement Portal</p>
        </div>

        <div className="premium-card rounded-[28px] border border-white/10 p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-semibold text-white">Sign In to Your Account</h2>

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
              <label className="text-sm font-medium text-slate-300">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MdLock size={16} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.75 pl-10 pr-10 text-sm text-slate-100 outline-none transition focus:border-blue-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="mb-1 text-xs font-medium text-blue-300">Demo Credentials</p>
            <p className="text-xs text-slate-400">admin@investigation.gov / Admin@123456</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2024 AI Investigation Assistant. Government Use Only.
        </p>
      </motion.div>
    </div>
  );
}
