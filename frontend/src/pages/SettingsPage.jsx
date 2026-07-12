import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MdSettings, MdNotifications, MdSecurity, MdLanguage,
  MdPalette, MdApi, MdSave, MdInfo,
} from 'react-icons/md';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Select, Alert } from '../components/ui/index.jsx';
import { useAuthContext } from '../utils/AuthContext';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications: { email: true, push: true, caseUpdates: true, aiAlerts: false },
    privacy: { twoFactor: false, sessionTimeout: '30', activityLog: true },
    ai: { language: 'en', useRag: false, autoSave: true, detailedAnalysis: true },
    display: { compactMode: false, animations: true, highContrast: false },
  });

  const toggle = (section, key) => setSettings((s) => ({
    ...s,
    [section]: { ...s[section], [key]: !s[section][key] },
  }));

  const set = (section, key) => (e) => setSettings((s) => ({
    ...s,
    [section]: { ...s[section], [key]: e.target.value },
  }));

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      icon: MdNotifications, title: 'Notifications', color: 'text-blue-400',
      content: (
        <>
          <ToggleSwitch checked={settings.notifications.email} onChange={() => toggle('notifications', 'email')} label="Email Notifications" description="Receive updates via email" />
          <ToggleSwitch checked={settings.notifications.push} onChange={() => toggle('notifications', 'push')} label="Push Notifications" description="Browser push notifications" />
          <ToggleSwitch checked={settings.notifications.caseUpdates} onChange={() => toggle('notifications', 'caseUpdates')} label="Case Updates" description="Notify when case status changes" />
          <ToggleSwitch checked={settings.notifications.aiAlerts} onChange={() => toggle('notifications', 'aiAlerts')} label="AI Analysis Alerts" description="Alert when AI analysis completes" />
        </>
      ),
    },
    {
      icon: MdSecurity, title: 'Security & Privacy', color: 'text-green-400',
      content: (
        <>
          <ToggleSwitch checked={settings.privacy.twoFactor} onChange={() => toggle('privacy', 'twoFactor')} label="Two-Factor Authentication" description="Add extra security to your account" />
          <ToggleSwitch checked={settings.privacy.activityLog} onChange={() => toggle('privacy', 'activityLog')} label="Activity Logging" description="Log all account activities" />
          <div className="py-3">
            <Select
              label="Session Timeout"
              value={settings.privacy.sessionTimeout}
              onChange={set('privacy', 'sessionTimeout')}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
              ]}
            />
          </div>
        </>
      ),
    },
    {
      icon: MdApi, title: 'AI Configuration', color: 'text-purple-400',
      content: (
        <>
          <div className="py-3">
            <Select
              label="Response Language"
              value={settings.ai.language}
              onChange={set('ai', 'language')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
                { value: 'mr', label: 'Marathi' },
                { value: 'ta', label: 'Tamil' },
                { value: 'te', label: 'Telugu' },
              ]}
            />
          </div>
          <ToggleSwitch checked={settings.ai.useRag} onChange={() => toggle('ai', 'useRag')} label="Enable RAG Pipeline" description="Use document retrieval for enhanced analysis (requires FAISS index)" />
          <ToggleSwitch checked={settings.ai.autoSave} onChange={() => toggle('ai', 'autoSave')} label="Auto-save Chat Sessions" description="Automatically save all AI conversations" />
          <ToggleSwitch checked={settings.ai.detailedAnalysis} onChange={() => toggle('ai', 'detailedAnalysis')} label="Detailed Legal Analysis" description="Request comprehensive BNS section analysis" />
        </>
      ),
    },
    {
      icon: MdPalette, title: 'Display', color: 'text-amber-400',
      content: (
        <>
          <ToggleSwitch checked={settings.display.compactMode} onChange={() => toggle('display', 'compactMode')} label="Compact Mode" description="Reduce spacing for more content" />
          <ToggleSwitch checked={settings.display.animations} onChange={() => toggle('display', 'animations')} label="Animations" description="Enable UI animations and transitions" />
          <ToggleSwitch checked={settings.display.highContrast} onChange={() => toggle('display', 'highContrast')} label="High Contrast" description="Increase contrast for better visibility" />
        </>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <p className="text-sm text-slate-400">Manage your preferences and configuration</p>
          </div>
          <Button onClick={handleSave} icon={<MdSave size={16} />}>Save Settings</Button>
        </div>
      </motion.div>

      {saved && <Alert type="success" message="Settings saved successfully!" />}

      {/* System info */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <MdInfo className="text-blue-400" size={18} />
          <h3 className="text-sm font-semibold text-white">System Information</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'API Version', value: 'v1.0.0' },
            { label: 'AI Model', value: 'CaseMind AI' },
            { label: 'Backend', value: 'FastAPI' },
            { label: 'Database', value: 'MongoDB 8.3' },
            { label: 'User Role', value: user?.role || '—' },
            { label: 'Environment', value: 'Production' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm text-white font-medium capitalize">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {sections.map(({ icon: Icon, title, color, content }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Icon className={color} size={18} />
              <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {content}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
