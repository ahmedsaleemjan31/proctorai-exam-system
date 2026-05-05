import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Mic, Wifi, ShieldCheck, AlertCircle, 
  CheckCircle2, XCircle, ArrowRight, RefreshCcw, 
  Settings, Monitor, Volume2 
} from 'lucide-react';
import TiltCard from '../components/TiltCard';
import SpotlightCard from '../components/SpotlightCard';

interface CheckState {
  status: 'pending' | 'checking' | 'pass' | 'fail';
  value?: string | number;
  label: string;
}

export default function SystemPreCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [checks, setChecks] = useState<{
    camera: CheckState;
    mic: CheckState;
    internet: CheckState;
    system: CheckState;
  }>({
    camera: { status: 'pending', label: 'Camera' },
    mic: { status: 'pending', label: 'Microphone' },
    internet: { status: 'pending', label: 'Connection' },
    system: { status: 'pending', label: 'System' },
  });

  const [isOverallPassing, setIsOverallPassing] = useState(false);
  const [speedProgress, setSpeedProgress] = useState(0);

  useEffect(() => {
    runAllChecks();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const runAllChecks = async () => {
    // 1. Camera Check
    updateCheck('camera', 'checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      updateCheck('camera', 'pass');
    } catch (err) {
      updateCheck('camera', 'fail');
    }

    // 2. Mic Check
    updateCheck('mic', 'checking');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      updateCheck('mic', 'pass');
    } catch (err) {
      updateCheck('mic', 'fail');
    }

    // 3. Internet Speed Check (Simulated for UX)
    updateCheck('internet', 'checking');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setSpeedProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const speed = (Math.random() * 50 + 10).toFixed(1);
        updateCheck('internet', 'pass', `${speed} Mbps`);
      }
    }, 100);

    // 4. System Check
    updateCheck('system', 'checking');
    setTimeout(() => {
      const isSecure = window.isSecureContext;
      updateCheck('system', isSecure ? 'pass' : 'fail', isSecure ? 'Secure' : 'Unsecured');
    }, 1500);
  };

  const updateCheck = (key: keyof typeof checks, status: CheckState['status'], value?: string | number) => {
    setChecks(prev => ({
      ...prev,
      [key]: { ...prev[key], status, value }
    }));
  };

  useEffect(() => {
    const allPass = (Object.values(checks) as CheckState[]).every(c => c.status === 'pass');
    setIsOverallPassing(allPass);
  }, [checks]);

  const handleStartExam = () => {
    const examId = new URLSearchParams(location.search).get('examId');
    if (examId) navigate(`/exam/${examId}`);
    else navigate('/student');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">System Integrity Check</h1>
          </div>
          <p className="text-white/40 max-w-2xl">
            Please ensure your environment meets the technical requirements before starting the assessment. 
            Unauthorized background applications should be closed.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Visual Checks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Camera Preview Card */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass border border-white/5 rounded-[32px] overflow-hidden shadow-2xl group relative z-10 transition-all hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] h-full">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold">Camera Feed</span>
                </div>
                {checks.camera.status === 'pass' && (
                  <span className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live
                  </span>
                )}
              </div>
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {checks.camera.status === 'fail' ? (
                  <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">Camera access denied or not found.</p>
                    <button onClick={runAllChecks} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mx-auto transition-colors">
                      <RefreshCcw className="w-4 h-4" /> Retry Access
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover grayscale-[0.2]" 
                    />
                    {/* UI Overlays */}
                    <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-indigo-500/50" />
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-indigo-500/50" />
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-indigo-500/50" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-indigo-500/50" />
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] font-medium text-white/60">
                      ProctorAI Secure Stream • 1080p
                    </div>
                  </>
                )}
              </div>
            </motion.div>
            </TiltCard>

            {/* Mic Visualizer (Simulated) */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass border border-white/5 rounded-[32px] p-8 relative z-10 shadow-xl transition-all hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold">Audio Sensitivity</span>
                </div>
                <div className="text-xs text-white/40 uppercase tracking-widest font-mono">Input: Default Mic</div>
              </div>
              <div className="flex items-end gap-1 h-12">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: checks.mic.status === 'pass' ? [10, Math.random() * 40 + 10, 10] : 8 
                    }}
                    transition={{ 
                      duration: 0.5 + Math.random() * 0.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`flex-1 rounded-full ${checks.mic.status === 'pass' ? 'bg-indigo-500/40' : 'bg-white/5'}`}
                  />
                ))}
              </div>
            </motion.div>
            </TiltCard>
          </div>

          {/* Right Column: Status Meters */}
          <div className="space-y-6">
            <TiltCard>
              <motion.div whileHover={{ y: -5 }} className="bg-glass border border-white/5 rounded-[32px] p-8 shadow-2xl relative z-10 transition-all hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] h-full">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/30 mb-8 font-mono">Control Status</h3>
              
              <div className="space-y-8">
                {/* Circular Speed Meter */}
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90">
                      <circle 
                        cx="80" cy="80" r="70" 
                        className="stroke-white/5 fill-none" 
                        strokeWidth="8" 
                      />
                      <motion.circle 
                        cx="80" cy="80" r="70" 
                        className={`fill-none ${checks.internet.status === 'fail' ? 'stroke-red-500' : 'stroke-indigo-500'}`}
                        strokeWidth="8" 
                        strokeDasharray="440"
                        animate={{ strokeDashoffset: 440 - (440 * speedProgress) / 100 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Wifi className="w-6 h-6 text-white/20 mb-1" />
                      <div className="text-2xl font-bold font-mono">
                        {checks.internet.status === 'checking' ? `${speedProgress}%` : (checks.internet.value || '0')}
                      </div>
                      <div className="text-[10px] uppercase text-white/30 font-bold tracking-tighter">Latency Opt.</div>
                    </div>
                  </div>
                </div>

                {/* Status List */}
                <div className="space-y-4">
                  {[
                    { key: 'camera', icon: Camera, label: 'Camera Status' },
                    { key: 'mic', icon: Mic, label: 'Mic Input' },
                    { key: 'internet', icon: Wifi, label: 'Connectivity' },
                    { key: 'system', icon: Monitor, label: 'Environment' }
                  ].map((item) => {
                    const check = checks[item.key as keyof typeof checks];
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${check.status === 'pass' ? 'text-indigo-400' : 'text-white/20'}`} />
                          <span className="text-sm font-medium text-white/60">{item.label}</span>
                        </div>
                        <div>
                          {check.status === 'checking' && <RefreshCcw className="w-4 h-4 text-indigo-400 animate-spin" />}
                          {check.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                          {check.status === 'fail' && <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10">
                <button
                  disabled={!isOverallPassing}
                  onClick={handleStartExam}
                  className={`w-full group py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                    isOverallPassing 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] active:scale-95' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {isOverallPassing && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    />
                  )}
                  Proceed to Exam <ArrowRight className={`w-5 h-5 transition-transform relative z-10 ${isOverallPassing ? 'group-hover:translate-x-1' : ''}`} />
                </button>
                {!isOverallPassing && (
                  <p className="text-center mt-4 text-[10px] text-red-400/60 uppercase font-bold tracking-tighter">
                    Waiting for hardware validation...
                  </p>
                )}
              </div>
            </motion.div>
            </TiltCard>

            {/* Tips Card */}
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-indigo-500/20 rounded-[32px] p-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Environment Tips</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Ensure face is clearly visible",
                  "Remove headphones/earbuds",
                  "Stay in a well-lit room",
                  "Close unauthorized browser tabs"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 leading-tight">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
