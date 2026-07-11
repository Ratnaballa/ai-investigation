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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl mb-4"
          >
            <MdShield className="text-white" size={32} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">AI Investigation Assistant</h1>
          <p className="text-slate-400 text-sm mt-1">Government Law Enforcement Portal</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 card-glow">
          <h2 className="text-lg font-semibold text-white mb-6">Sign In to Your Account</h2>

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
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm pl-10 pr-10"
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

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300 font-medium mb-1">Demo Credentials</p>
            <p className="text-xs text-slate-400">admin@investigation.gov / Admin@123456</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2024 AI Investigation Assistant. Government Use Only.
        </p>
      </motion.div>
    </div>
  );
}
