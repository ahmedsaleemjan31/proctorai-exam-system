import { useState, useEffect } from 'react';
import { useAppAuth, logout, setUserRole, subscribeToExams, createExam, deleteExam, subscribeToSettings, updateSettings } from '../lib/firebase';
import { ShieldCheck, LogOut, FileCheck2, Users, Settings, Save, RotateCcw, Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, loading } = useAppAuth();

  const [sensitivity, setSensitivity] = useState('medium');
  const [allowedApps, setAllowedApps] = useState('Calculator, Notepad');
  const [timeLimit, setTimeLimit] = useState(120);
  const [lockdown, setLockdown] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Calendar / Exam Schedule State
  const [exams, setExams] = useState<any[]>([]);
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamTime, setNewExamTime] = useState('');

  useEffect(() => {
    const unsubExams = subscribeToExams((fetchedExams) => {
      // Sort exams by date initially
      setExams(fetchedExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    });
    const unsubSettings = subscribeToSettings((settings) => {
      if (settings) {
        setSensitivity(settings.sensitivity ?? 'medium');
        setAllowedApps(settings.allowedApps ?? 'Calculator, Notepad');
        setTimeLimit(settings.timeLimit ?? 120);
        setLockdown(settings.lockdown ?? true);
      }
    });

    return () => {
      unsubExams();
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
        lockdown
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

  const handleSaveExam = async () => {
    if (!newExamName || !newExamDate || !newExamTime) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      // Create exam in Firestore
      await createExam(newExamName, newExamDate, newExamTime, user!.uid);
      
      setShowNewExamForm(false);
      setNewExamName('');
      setNewExamDate('');
      setNewExamTime('');
      toast.success('Exam scheduled in database!');
    } catch (err: any) {
      toast.error("Failed to create exam: " + err.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      try {
        await deleteExam(id);
        toast.success('Exam removed from database.');
      } catch (err: any) {
        toast.error("Failed to delete exam: " + err.message);
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
              <FileCheck2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-sm text-white/50 mb-1">Active Exams</div>
            <div className="text-3xl font-semibold">12</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-sm text-white/50 mb-1">Students Online</div>
            <div className="text-3xl font-semibold">348</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-sm text-white/50 mb-1">Flagged Incidents</div>
            <div className="text-3xl font-semibold text-red-400">7</div>
          </motion.div>
        </div>

        {/* Schedule & Calendar View */}
        <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-lg font-medium">
               <Calendar className="w-5 h-5 text-blue-400" />
               <h2>Exam Schedule</h2>
            </div>
            {!showNewExamForm && (
              <button 
                onClick={() => setShowNewExamForm(true)}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Schedule Exam
              </button>
            )}
          </div>

          {showNewExamForm ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-2 relative">
               <h3 className="text-sm font-medium mb-4 text-white/70">Schedule New Exam</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                 <div>
                   <label className="block text-xs font-medium text-white/50 mb-1.5">Exam Name</label>
                   <input 
                     type="text" 
                     value={newExamName}
                     onChange={(e) => setNewExamName(e.target.value)}
                     placeholder="e.g. History 101 Midterm"
                     className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-white/50 mb-1.5">Date</label>
                   <input 
                     type="date" 
                     value={newExamDate}
                     onChange={(e) => setNewExamDate(e.target.value)}
                     className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-white/50 mb-1.5">Time</label>
                   <input 
                     type="time" 
                     value={newExamTime}
                     onChange={(e) => setNewExamTime(e.target.value)}
                     className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                   />
                 </div>
               </div>
               <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setShowNewExamForm(false)}
                   className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleSaveExam}
                   className="px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                 >
                   Save Exam
                 </button>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.length > 0 ? exams.map((exam) => (
                <div key={exam.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col hover:border-white/20 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-semibold truncate pr-2" title={exam.name}>{exam.name}</div>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/5 rounded-md"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Calendar className="w-3.5 h-3.5 text-white/40" /> 
                      {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                       <Clock className="w-3.5 h-3.5 text-white/40" /> 
                       {exam.time}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center text-white/40 text-sm">
                  No exams scheduled yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 flex flex-col">
             <h2 className="text-lg font-medium mb-4">Recent Alerts</h2>
             <div className="flex flex-col gap-3 flex-1">
                {/* Placeholder Alerts */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex gap-4 items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <div className="text-sm font-medium">Multiple faces detected</div>
                      <div className="text-xs text-white/50">Student: Alice Johnson • CS101 Midterm</div>
                    </div>
                  </div>
                  <button className="text-xs px-3 py-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors">Review Video</button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex gap-4 items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <div className="text-sm font-medium">Device detected</div>
                      <div className="text-xs text-white/50">Student: Michael Tran • PH201 Final</div>
                    </div>
                  </div>
                  <button className="text-xs px-3 py-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors">Review Video</button>
                </div>
             </div>
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
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${lockdown ? 'bg-indigo-500' : 'bg-white/10'}`} onClick={() => setLockdown(!lockdown)}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lockdown ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Browser Lockdown</span>
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
        </div>
      </main>
    </div>
  );
}
