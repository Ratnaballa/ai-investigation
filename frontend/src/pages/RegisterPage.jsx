import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdShield, MdEmail, MdLock, MdPerson, MdBadge, MdPhone } from 'react-icons/md';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/helpers';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Select, Alert } from '../components/ui/index.jsx';

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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl mb-4">
            <MdShield className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">AI Investigation Assistant Portal</p>
        </div>

        <div className="glass rounded-2xl p-8 card-glow">
          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Arjun Sharma" required icon={<MdPerson size={16} />} />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="officer@police.gov.in" required icon={<MdEmail size={16} />} />
            </div>
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, uppercase, digit, special" required icon={<MdLock size={16} />} />
            <Select label="Role" value={form.role} onChange={set('role')} options={ROLES} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Badge Number" value={form.badge_number} onChange={set('badge_number')} placeholder="MH-1234" icon={<MdBadge size={16} />} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+919876543210" icon={<MdPhone size={16} />} />
            </div>
            <Input label="Department" value={form.department} onChange={set('department')} placeholder="Cyber Crime Division" />
            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
