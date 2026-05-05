import { useState, useEffect } from 'react';
import { useAppAuth, logout, setUserRole, subscribeToExams, createExam, deleteExam, subscribeToSettings, updateSettings, subscribeToSubmissions } from '../lib/firebase';
import { ShieldCheck, LogOut, FileCheck2, Users, Settings, Save, RotateCcw, Calendar, Clock, Plus, Trash2, Search, X, AlignLeft, ListChecks, SortDesc, BrainCircuit, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence, useSpring, animate } from 'motion/react';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAIQuestions } from '../lib/gemini';
import SpotlightCard from '../components/SpotlightCard';
import SkeletonLoader from '../components/SkeletonLoader';
import Magnetic from '../components/Magnetic';
import TiltCard from '../components/TiltCard';

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.floor(v))
    });
    return controls.stop;
  }, [value]);

  return <>{displayValue}</>;
}

export default function InstructorDashboard() {
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

  // Calendar / Exam Schedule State
  const [exams, setExams] = useState<any[]>([]);
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamTime, setNewExamTime] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);

  // Question Builder
  type QType = { id: number; text: string; type: 'textarea' | 'mcq'; options: string };
  const [newExamQuestions, setNewExamQuestions] = useState<QType[]>([]);
  const addQuestion = (type: 'textarea' | 'mcq') =>
    setNewExamQuestions(prev => [...prev, { id: Date.now(), text: '', type, options: '' }]);
  const removeQuestion = (id: number) =>
    setNewExamQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id: number, field: string, value: string) =>
    setNewExamQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));

  // AI Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const questions = await generateAIQuestions(aiTopic);
      const formatted = questions.map((q, i) => ({
        id: Date.now() + i,
        ...q
      }));
      setNewExamQuestions(prev => [...prev, ...formatted]);
      toast.success(`Successfully generated ${questions.length} questions!`);
      setAiTopic('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate questions');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Submissions Filter
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'flagged' | 'clean'>('all');
  const [submissionSort, setSubmissionSort] = useState<'newest' | 'mostFlags'>('newest');

  useEffect(() => {
    // Fetch all users to filter students
    fetch('http://localhost:8000/users')
      .then(res => res.json())
      .then(data => {
        setAllStudents(data.filter((u: any) => u.role === 'student'));
      });

    const unsubExams = subscribeToExams((fetchedExams) => {
      setExams(fetchedExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    });
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

    const unsubSubmissions = subscribeToSubmissions((fetchedSubmissions) => {
      setSubmissions(fetchedSubmissions);
    });

    return () => {
      unsubExams();
      unsubSettings();
      unsubSubmissions();
    };
  }, []);

  if (loading) return <SkeletonLoader />;
  if (!user || user.role !== 'instructor') return <Navigate to="/login" />;

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
      }, user.uid);
      toast.success('Settings saved to database successfully!');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExam = async () => {
    if (!newExamName || !newExamDate || !newExamTime) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const questions = newExamQuestions
        .filter(q => q.text.trim())
        .map((q, i) => {
          const base = { id: i + 1, text: q.text.trim(), type: q.type };
          if (q.type === 'mcq') {
            return { ...base, options: q.options.split(',').map(o => o.trim()).filter(Boolean) };
          }
          return base;
        });
      await createExam(newExamName, newExamDate, newExamTime, user!.uid, questions, assignedStudents);
      setShowNewExamForm(false);
      setNewExamName('');
      setNewExamDate('');
      setNewExamTime('');
      setNewExamQuestions([]);
      setAssignedStudents([]);
      toast.success(`Exam scheduled for ${assignedStudents.length || 'all'} students!`);
    } catch (err: any) {
      toast.error('Failed to create exam: ' + err.message);
    }
  };

  const getRealFlags = (incidents: any[]) => (incidents || []).filter(i => !i.type.includes('Identity Verified'));

  const filteredSubmissions = submissions
    .filter(s => {
      const matchSearch = !submissionSearch ||
        s.student_name?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.student_email?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.exam_id?.toLowerCase().includes(submissionSearch.toLowerCase());
      const realFlags = getRealFlags(s.incidents);
      const matchFilter =
        submissionFilter === 'flagged' ? realFlags.length > 0 :
          submissionFilter === 'clean' ? realFlags.length === 0 : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      submissionSort === 'mostFlags'
        ? getRealFlags(b.incidents).length - getRealFlags(a.incidents).length
        : (b.submittedAt?.toMillis() || 0) - (a.submittedAt?.toMillis() || 0)
    );

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
    <div className="min-h-screen bg-transparent text-[#FAFAFA] font-sans">
      <nav className="border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-medium text-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Instructor Portal</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-sm text-white/50">{user.email}</span>

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
          <TiltCard>
            <Magnetic strength={0.1}>
              <motion.div whileHover={{ y: -8 }} className="bg-glass border border-white/10 rounded-2xl p-6 glow-effect relative overflow-hidden transition-all hover:shadow-[0_15px_40px_rgba(99,102,241,0.15)] group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
                <Magnetic strength={0.4}>
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 relative z-10 shadow-inner">
                    <FileCheck2 className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  </div>
                </Magnetic>
                <div className="text-sm text-white/50 mb-1">Active Exams</div>
                <div className="text-3xl font-semibold"><AnimatedCounter value={exams.length} /></div>
              </motion.div>
            </Magnetic>
          </TiltCard>

          <TiltCard>
            <Magnetic strength={0.1}>
              <motion.div whileHover={{ y: -8 }} className="bg-glass border border-white/10 rounded-2xl p-6 glow-effect relative overflow-hidden transition-all hover:shadow-[0_15px_40px_rgba(59,130,246,0.15)] group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
                <Magnetic strength={0.4}>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 relative z-10 shadow-inner">
                    <Users className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  </div>
                </Magnetic>
                <div className="text-sm text-white/50 mb-1">Total Submissions</div>
                <div className="text-3xl font-semibold"><AnimatedCounter value={submissions.length} /></div>
              </motion.div>
            </Magnetic>
          </TiltCard>

          <TiltCard>
            <Magnetic strength={0.1}>
              <motion.div whileHover={{ y: -8 }} className="bg-glass border border-white/10 rounded-2xl p-6 glow-effect relative overflow-hidden transition-all hover:shadow-[0_15px_40px_rgba(248,113,113,0.15)] group h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full group-hover:bg-red-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
                <Magnetic strength={0.4}>
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 relative z-10 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  </div>
                </Magnetic>
                <div className="text-sm text-white/50 mb-1">Flagged Incidents</div>
                <div className="text-3xl font-semibold text-red-400">
                  <AnimatedCounter value={submissions.filter(s => (s.incidents?.length || 0) > 0).length} />
                </div>
              </motion.div>
            </Magnetic>
          </TiltCard>
        </div>

        {/* Schedule & Calendar View */}
        <div className="bg-glass border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden flex flex-col shadow-lg">
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-2">
              <h3 className="text-sm font-medium mb-4 text-white/70">Schedule New Exam</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Exam Name</label>
                  <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)}
                    placeholder="e.g. History 101 Midterm"
                    className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Date</label>
                  <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)}
                    className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Time</label>
                  <input type="time" value={newExamTime} onChange={e => setNewExamTime(e.target.value)}
                    className="w-full bg-[#111115] border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]" />
                </div>
              </div>

              {/* Student Assignment */}
              <div className="border-t border-white/5 pt-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">Assign Students (Optional)</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#050505] rounded-lg border border-white/5">
                  {allStudents.length > 0 ? allStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        if (assignedStudents.includes(student.id)) {
                          setAssignedStudents(prev => prev.filter(id => id !== student.id));
                        } else {
                          setAssignedStudents(prev => [...prev, student.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                        assignedStudents.includes(student.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {student.name || student.email}
                    </button>
                  )) : (
                    <div className="text-[10px] text-white/20 p-2 italic">No students found in the system.</div>
                  )}
                </div>
                <p className="text-[10px] text-white/30 mt-2">If no students are selected, the exam will be visible to everyone.</p>
              </div>

              {/* AI Generator Panel */}
              <div className="border-t border-white/5 pt-5 mb-5">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">AI Question Assistant</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                      placeholder="Enter topic (e.g. JavaScript Closures, World History...)"
                      className="flex-1 bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    >
                      {isGeneratingAI ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Generate
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 mt-2">Gemini AI will generate a mix of MCQ and Essay questions based on your topic.</p>
                </div>
              </div>

              {/* Question Builder */}
              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white/70">Questions <span className="text-white/30">({newExamQuestions.length})</span></label>
                  <div className="flex gap-2">
                    <button onClick={() => addQuestion('textarea')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 transition-colors">
                      <AlignLeft className="w-3.5 h-3.5" /> Essay
                    </button>
                    <button onClick={() => addQuestion('mcq')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 transition-colors">
                      <ListChecks className="w-3.5 h-3.5" /> MCQ
                    </button>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {newExamQuestions.length === 0 && (
                    <div className="text-center py-5 border border-dashed border-white/10 rounded-xl text-xs text-white/30">
                      No questions yet — click Essay or MCQ to add one.
                    </div>
                  )}
                  {newExamQuestions.map((q, i) => (
                    <div key={q.id} className="bg-[#111115] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                          Q{i + 1} · {q.type === 'mcq' ? 'Multiple Choice' : 'Essay'}
                        </span>
                        <button onClick={() => removeQuestion(q.id)} className="text-white/30 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <textarea rows={2} value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                        placeholder="Question text..."
                        className="w-full bg-transparent text-sm text-white/80 outline-none resize-none placeholder:text-white/20 mb-2" />
                      {q.type === 'mcq' && (
                        <input type="text" value={q.options} onChange={e => updateQuestion(q.id, 'options', e.target.value)}
                          placeholder="Options (comma-separated): A, B, C, D"
                          className="w-full bg-[#050505] border border-white/5 rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-indigo-500/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button onClick={() => { setShowNewExamForm(false); setNewExamQuestions([]); }}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSaveExam}
                  className="relative inline-flex h-10 overflow-hidden rounded-lg p-[1.5px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#050505] shadow-[0_0_15px_rgba(99,102,241,0.2)] group transition-shadow cursor-pointer"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c084fc_0%,#818cf8_50%,#c084fc_100%)]" />
                  <span className="inline-flex h-full w-full items-center justify-center rounded-[6.5px] bg-[#0A0A0C] px-4 py-2 text-sm font-medium text-white backdrop-blur-3xl group-hover:bg-[#121214] transition-colors">
                    Save Exam
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exams.length > 0 ? exams.map((exam) => (
                <SpotlightCard whileHover={{ scale: 1.02, y: -2 }} key={exam.id} className="bg-glass border border-white/10 rounded-xl p-4 flex flex-col hover:border-white/20 transition-all shadow-sm hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-semibold truncate pr-2" title={exam.name}>{exam.name}</div>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/5 rounded-md relative z-20"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 relative z-20">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      {exam.time}
                    </div>
                    {exam.assigned_students?.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] text-blue-400 mt-1">
                        <Users className="w-3 h-3" />
                        {exam.assigned_students.length} Assigned Students
                      </div>
                    )}
                  </div>
                </SpotlightCard>
              )) : (
                <div className="col-span-full py-8 text-center text-white/40 text-sm">
                  No exams scheduled yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 perspective-1000">
          <div className="bg-glass border border-white/10 rounded-2xl p-6 flex flex-col shadow-lg">
            <h2 className="text-lg font-medium mb-4">Recent Submissions & Alerts</h2>

            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={submissionSearch} onChange={e => setSubmissionSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-white/20 transition-colors" />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'flagged', 'clean'] as const).map(f => (
                  <button key={f} onClick={() => setSubmissionFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${submissionFilter === f ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}>{f}</button>
                ))}
                <button onClick={() => setSubmissionSort(s => s === 'newest' ? 'mostFlags' : 'newest')}
                  title={submissionSort === 'newest' ? 'Sort: Newest' : 'Sort: Most Flags'}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:bg-white/10 transition-colors flex items-center gap-1.5">
                  <SortDesc className="w-3.5 h-3.5" />
                  {submissionSort === 'newest' ? 'Newest' : 'Most Flags'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
              {filteredSubmissions.length > 0 ? filteredSubmissions.map((sub: any) => {
                const realFlags = getRealFlags(sub.incidents);
                const flagCount = realFlags.length;
                const hasFlags = flagCount > 0;
                return (
                  <motion.div whileHover={{ scale: 1.01, x: 5 }} key={sub.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all shadow-sm hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${hasFlags ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{hasFlags ? `${flagCount} Flag${flagCount > 1 ? 's' : ''}` : 'Clean Session'}</div>
                        <div className="text-xs text-white/50 truncate">{sub.student_name} · Trust: {sub.trust_score}%</div>
                      </div>
                    </div>
                    <Link to={`/instructor/report/${sub.id}`}
                      className="text-xs px-3 py-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors shrink-0 ml-3">
                      Review
                    </Link>
                  </motion.div>
                );
              }) : (
                <div className="text-sm text-white/40 text-center py-8">
                  {submissions.length === 0 ? 'No submissions yet.' : 'No results match your filter.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
