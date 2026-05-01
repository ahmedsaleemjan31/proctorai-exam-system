import { useState, useEffect } from 'react';
import { useAppAuth, logout, setUserRole, subscribeToSettings, updateSettings } from '../lib/firebase';
import { ShieldCheck, LogOut, Settings, Save, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, loading } = useAppAuth();

  const [sensitivity, setSensitivity] = useState('medium');
  const [allowedApps, setAllowedApps] = useState('Calculator, Notepad');
  const [timeLimit, setTimeLimit] = useState(120);
  const [lockdown, setLockdown] = useState(true);
  const [isGazeEnabled, setIsGazeEnabled] = useState(true);
  const [isObjectEnabled, setIsObjectEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isIdentityEnabled, setIsIdentityEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubSettings = subscribeToSettings((settings) => {
      if (settings) {
        setSensitivity(settings.sensitivity ?? 'medium');
        setAllowedApps(settings.allowedApps ?? 'Calculator, Notepad');
        setTimeLimit(settings.timeLimit ?? 120);
        setLockdown(settings.lockdown ?? true);
        setIsGazeEnabled(settings.isGazeEnabled ?? true);
        setIsObjectEnabled(settings.isObjectEnabled ?? true);
        setIsAudioEnabled(settings.isAudioEnabled ?? true);
        setIsIdentityEnabled(settings.isIdentityEnabled ?? true);
      }
    });

    return () => {
      unsubSettings();
    };
  }, []);

  if (loading) return <div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        sensitivity,
        allowedApps,
        timeLimit,
        lockdown,
        isGazeEnabled,
        isObjectEnabled,
        isAudioEnabled,
        isIdentityEnabled
      });
      toast.success('Settings saved to database successfully!');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToStudent = async () => {
    if (confirm("Developer Mode: Switch your account to Student?")) {
      try {
        await setUserRole(user.uid, user.email, user.name, 'student');
        toast.info("Switched to Student portal");
      } catch (err: any) {
        toast.error("Failed to switch role: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans">
      <nav className="border-b border-white/5 bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-medium text-lg">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <span>Admin Portal</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-sm text-white/50">{user.email}</span>
            <button
              onClick={handleSwitchToStudent}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-indigo-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-400/30"
              title="Test Mode: Switch Role"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:block text-xs">Switch to Student</span>
            </button>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-400/30">
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display font-bold mb-8">Dashboard Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div whileHover={{ y: -4 }} className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-sm text-white/50 mb-1">Configuration</div>
            <div className="text-xl font-semibold">Active</div>
          </motion.div>
        </div>

        <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-lg font-medium">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2>Exam Settings & Rules</h2>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">AI Detection Sensitivity</label>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full bg-[#111115] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="low">Low (Forgiving)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">Strict (Maximum Security)</option>
              </select>
              <p className="text-xs text-white/40 mt-2">Determines how aggressively the AI flags background noise or eye movement.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Allowed Applications (Comma Separated)</label>
              <input
                type="text"
                value={allowedApps}
                onChange={(e) => setAllowedApps(e.target.value)}
                placeholder="e.g., Calculator, VS Code"
                className="w-full bg-[#111115] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Default Time Limit (min)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  className="w-full bg-[#111115] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    className={`w-10 h-5 rounded-full relative transition-colors ${lockdown ? 'bg-indigo-500' : 'bg-white/10'}`} 
                    onClick={() => setLockdown(!lockdown)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lockdown ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Browser Lockdown</span>
                </label>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Advanced AI Modules</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white/70">Gaze Tracking</span>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-colors ${isGazeEnabled ? 'bg-indigo-500' : 'bg-white/10'}`} 
                    onClick={() => setIsGazeEnabled(!isGazeEnabled)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isGazeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white/70">Object Detection</span>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-colors ${isObjectEnabled ? 'bg-indigo-500' : 'bg-white/10'}`} 
                    onClick={() => setIsObjectEnabled(!isObjectEnabled)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isObjectEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white/70">Audio Monitoring</span>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-colors ${isAudioEnabled ? 'bg-indigo-500' : 'bg-white/10'}`} 
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isAudioEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-sm text-white/70">Identity Selfie</span>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-colors ${isIdentityEnabled ? 'bg-indigo-500' : 'bg-white/10'}`} 
                    onClick={() => setIsIdentityEnabled(!isIdentityEnabled)}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isIdentityEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}