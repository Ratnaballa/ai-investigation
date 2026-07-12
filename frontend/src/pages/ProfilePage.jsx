import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MdPerson, MdEdit, MdSave, MdLock, MdBadge,
  MdPhone, MdEmail, MdDepartureBoard, MdVerified,
} from 'react-icons/md';
import { useAuthContext } from '../utils/AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { getErrorMessage, roleLabel, roleBadgeColor, formatDate } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Alert } from '../components/ui/index.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    badge_number: user?.badge_number || '',
    preferred_language: user?.preferred_language || 'en',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await userService.updateMe(form);
      await refreshUser();
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New passwords do not match');
      return;
    }
    setPwLoading(true); setPwError('');
    try {
      await authService.changePassword(pwForm.current_password, pwForm.new_password);
      setPwSuccess('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card glow>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-3xl font-bold text-white shadow-xl">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <MdVerified className="text-white" size={14} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">{user.full_name}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`status-badge ${roleBadgeColor(user.role)}`}>{roleLabel(user.role)}</span>
                {user.badge_number && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MdBadge size={12} /> {user.badge_number}
                  </span>
                )}
                <span className={`text-xs ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                  ● {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <Button
              onClick={() => { setEditing(!editing); setError(''); }}
              variant={editing ? 'secondary' : 'primary'}
              icon={editing ? null : <MdEdit size={16} />}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Profile info / edit form */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MdPerson className="text-blue-400" size={18} /> Profile Information
        </h3>

        {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.full_name} onChange={set('full_name')} required icon={<MdPerson size={16} />} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+919876543210" icon={<MdPhone size={16} />} />
              <Input label="Department" value={form.department} onChange={set('department')} placeholder="Cyber Crime Division" />
              <Input label="Badge Number" value={form.badge_number} onChange={set('badge_number')} placeholder="MH-1234" icon={<MdBadge size={16} />} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading} icon={<MdSave size={16} />}>Save Changes</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user.full_name, icon: MdPerson },
              { label: 'Email', value: user.email, icon: MdEmail },
              { label: 'Phone', value: user.phone || '—', icon: MdPhone },
              { label: 'Department', value: user.department || '—', icon: MdDepartureBoard },
              { label: 'Badge Number', value: user.badge_number || '—', icon: MdBadge },
              { label: 'Preferred Language', value: user.preferred_language?.toUpperCase() || 'EN', icon: MdPerson },
              { label: 'Member Since', value: formatDate(user.created_at), icon: MdPerson },
              { label: 'Account Status', value: user.is_active ? 'Active' : 'Inactive', icon: MdVerified },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <Icon className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm text-white font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MdLock className="text-blue-400" size={18} /> Change Password
        </h3>

        {pwError && <div className="mb-4"><Alert type="error" message={pwError} onClose={() => setPwError('')} /></div>}
        {pwSuccess && <div className="mb-4"><Alert type="success" message={pwSuccess} onClose={() => setPwSuccess('')} /></div>}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={pwForm.current_password} onChange={setPw('current_password')} required icon={<MdLock size={16} />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="New Password" type="password" value={pwForm.new_password} onChange={setPw('new_password')} placeholder="Min 8 chars" required icon={<MdLock size={16} />} />
            <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={setPw('confirm')} placeholder="Repeat new password" required icon={<MdLock size={16} />} />
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300">Password must be at least 8 characters with uppercase, lowercase, digit, and special character.</p>
          </div>
          <Button type="submit" loading={pwLoading} icon={<MdLock size={16} />}>Update Password</Button>
        </form>
      </Card>
    </div>
  );
}
