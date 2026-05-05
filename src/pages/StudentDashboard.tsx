import { useState, useEffect, useRef } from 'react';
import { useAppAuth, logout, setUserRole, subscribeToExams, subscribeToStudentSubmissions } from '../lib/firebase';
import { GraduationCap, LogOut, Calendar, Clock, Video, RotateCcw, AlertTriangle, Play, History, ShieldCheck, ShieldAlert, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SkeletonLoader from '../components/SkeletonLoader';

const WebcamPlayer = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full aspect-video bg-[#050505] rounded-xl overflow-hidden border border-white/10 relative">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      <div className="absolute bottom-2 left-2 flex gap-2">
         <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/20 flex items-center gap-1.5 backdrop-blur-md">
           <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
           Secure Feed Active
         </div>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const { user, loading } = useAppAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState<any[]>([]);
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  // Tick every 30s so countdowns stay live
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubExams = subscribeToExams((fetchedExams) => {
      setExams(fetchedExams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }, user.uid);
    return () => { unsubExams(); };
  }, [user]);

  // Helper: derive exam status from current time and previous attempts
  const getExamStatus = (exam: any) => {
    // Check if already submitted (Single Attempt Rule)
    const hasSubmitted = pastSubmissions.some(sub => sub.exam_id === exam.id);
    if (hasSubmitted) {
      return { canJoin: false, expired: false, countdown: 'Attempt completed' };
    }

    const dt = new Date(`${exam.date}T${exam.time}`);
    const diffMs = dt.getTime() - now.getTime();
    const diffMins = diffMs / 60_000;
    if (diffMins > 15) {
      const h = Math.floor(diffMins / 60);
      const m = Math.round(diffMins % 60);
      const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return { canJoin: false, expired: false, countdown: `Opens in ${label}` };
    }
    if (diffMins > -240) return { canJoin: true, expired: false, countdown: null };
    return { canJoin: false, expired: true, countdown: 'Exam ended' };
  };

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToStudentSubmissions(user.uid, setPastSubmissions);
    return () => unsub();
  }, [user]);

  if (loading) return <SkeletonLoader />;
  if (!user || user.role !== 'student') return <Navigate to="/login" />;





  return (
    <div className="min-h-screen bg-transparent text-[#FAFAFA] font-sans">
      <nav className="border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-medium text-lg">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span>Student Portal</span>
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
        <h1 className="text-3xl font-display font-bold mb-2">Welcome, {user.name}</h1>
        <p className="text-white/50 mb-10">Access your upcoming assessments and past results.</p>

        <h2 className="text-lg font-medium mb-4">Upcoming Exams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {exams.length > 0 ? exams.map((exam) => {
            const status = getExamStatus(exam);
            return (
            <motion.div whileHover={{ y: -5, rotateX: 2, rotateY: 2, scale: 1.02 }} key={exam.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="bg-glass border border-white/10 rounded-2xl p-6 relative overflow-hidden group flex flex-col glow-effect transition-all hover:shadow-[0_15px_40px_rgba(99,102,241,0.15)] preserve-3d">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <div className="text-xl font-bold font-display mb-1">{exam.name}</div>
                  <div className="text-sm text-indigo-300 font-medium">
                    {exam.questions?.length ? `${exam.questions.length} question${exam.questions.length > 1 ? 's' : ''}` : 'Proctored Term Exam'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8 relative z-10 flex-1">
                <div className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                  <Calendar className="w-4 h-4 text-white/40" />
                  {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </div>
                <div className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                  <Clock className="w-4 h-4 text-white/40" />
                  {exam.time} (Local Time)
                </div>
                {status.countdown && (
                  <div className={`flex items-center gap-3 text-sm p-2 rounded-lg border ${
                    status.expired ? 'bg-white/5 text-white/40 border-white/5' : 'bg-indigo-500/5 text-indigo-300 border-indigo-500/20'
                  }`}>
                    <Timer className="w-4 h-4" />
                    {status.countdown}
                  </div>
                )}
              </div>

              <button
                onClick={() => status.canJoin ? navigate(`/pre-check?examId=${exam.id}`) : undefined}
                disabled={!status.canJoin}
                className={`w-full py-4 transition-all rounded-xl font-bold flex items-center justify-center gap-3 relative z-10 uppercase tracking-widest text-[11px] ${
                  status.canJoin
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] cursor-pointer active:scale-[0.98]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                }`}>
                <Video className="w-4 h-4" /> {status.canJoin ? 'Start System Check' : status.countdown}
              </button>
            </motion.div>
            );
          }) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl border-dashed">
              <Calendar className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60 font-medium">No Upcoming Exams</p>
              <p className="text-sm text-white/40 mt-1">Check back later or contact your instructor.</p>
            </div>
          )}
        </div>

        {/* Past Results Section */}
        <div className="mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-white/40" />
          <h2 className="text-lg font-medium">Past Results</h2>
          {pastSubmissions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/40 ml-1">{pastSubmissions.length}</span>
          )}
        </div>
        <div className="space-y-3">
          {pastSubmissions.length > 0 ? pastSubmissions.map(sub => {
            const flagCount = sub.incidents?.length || 0;
            const hasFlags = flagCount > 0;
            const score = sub.trustScore ?? 'N/A';
            const scoreColor = score >= 90 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
            return (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01, x: 5 }}
                className="flex items-center justify-between p-4 bg-glass border border-white/10 rounded-xl hover:border-white/20 transition-all shadow-sm hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasFlags ? 'bg-red-500/10' : 'bg-green-500/10'
                  }`}>
                    {hasFlags ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <ShieldCheck className="w-4 h-4 text-green-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{sub.examId || 'Exam'}</div>
                    <div className="text-xs text-white/40">
                      {sub.submittedAt ? new Date(sub.submittedAt.toMillis()).toLocaleString() : 'Unknown date'}
                      {flagCount > 0 && ` · ${flagCount} flag${flagCount > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-bold font-mono ${scoreColor}`}>{score}%</div>
              </motion.div>
            );
          }) : (
            <div className="py-10 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl border-dashed">
              <History className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-sm text-white/40">No exams submitted yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
