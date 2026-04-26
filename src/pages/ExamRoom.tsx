import { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth, submitExam, getExamById } from '../lib/firebase';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, ShieldCheck, Video, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import * as faceapi from '@vladmandic/face-api';

export default function ExamRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAppAuth();
  
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [incidents, setIncidents] = useState<{time: string, type: string}[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [examData, setExamData] = useState<any>(null);

  // Browser Lockdown
  useEffect(() => {
    const requestFS = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    // Attempt fullscreen immediately
    requestFS();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Tab Switched / Out of Focus" }]);
        toast.error("Warning: Tab switching is prohibited!", { style: { background: '#ef4444', color: 'white', border: 'none' } });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Exited Fullscreen" }]);
        toast.error("Warning: You left fullscreen mode!", { style: { background: '#ef4444', color: 'white', border: 'none' } });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load AI models:", err);
      }
    };
    loadModels();
  }, []);

  // Real AI Face Detection Loop
  useEffect(() => {
    if (!isModelLoaded || !stream || !videoRef.current) return;

    const video = videoRef.current;
    
    const detectFaces = async () => {
      if (video.paused || video.ended) return;
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }));
        if (detections.length === 0) {
          setAiWarning("Face Not Detected");
          setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Face Not Detected" }]);
        } else if (detections.length > 1) {
          setAiWarning("Multiple Faces Detected!");
          setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Multiple Faces Detected" }]);
        } else {
          setAiWarning(null); // Exactly 1 face, all good
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    };

    const interval = setInterval(detectFaces, 2500); // Scan every 2.5 seconds
    return () => clearInterval(interval);
  }, [isModelLoaded, stream]);

  // Fetch exam data + validate time window
  useEffect(() => {
    if (!id) return;
    getExamById(id).then(exam => {
      if (!exam) { toast.error('Exam not found.'); navigate('/student'); return; }
      setExamData(exam);
      // Time-gate check
      const dt = new Date(`${exam.date}T${exam.time}`);
      const diffMins = (dt.getTime() - Date.now()) / 60_000;
      if (diffMins > 15) {
        toast.error('This exam has not started yet.');
        navigate('/student');
      } else if (diffMins < -240) {
        toast.error('This exam session has expired.');
        navigate('/student');
      }
    }).catch(() => { toast.error('Failed to load exam.'); navigate('/student'); });
  }, [id]);

  // Fallback dummy questions (used only if admin added none)
  const FALLBACK_QUESTIONS = [
    { id: 1, text: "Explain the main differences between React's Virtual DOM and the real DOM.", type: "textarea" },
    { id: 2, text: "Which of the following hooks is used to manage side effects in functional components?", type: "mcq", options: ["useState", "useEffect", "useMemo", "useContext"] },
    { id: 3, text: "Describe how closure works in JavaScript and provide a practical use case.", type: "textarea" }
  ];

  const questions: any[] = (examData?.questions?.length > 0) ? examData.questions : FALLBACK_QUESTIONS;

  // Request camera access on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        activeStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        toast.error("Camera access required for this exam.");
      }
    };
    
    initCamera();
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const trustScore = Math.max(0, 100 - incidents.length * 15);
      const submissionId = await submitExam(
        id || 'unknown_exam', 
        user.uid, 
        user.name, 
        user.email, 
        answers, 
        incidents, 
        trustScore
      );
      
      // Pass the incidents securely to the results page
      localStorage.setItem('examIncidents', JSON.stringify(incidents));
      navigate(`/results/${id}`, { state: { incidentCount: incidents.length } });
    } catch (err: any) {
      console.error(err);
      toast.warning("Cloud save failed (check Firestore rules). Saving locally instead.");
      
      // Still navigate so they aren't stuck!
      localStorage.setItem('examIncidents', JSON.stringify(incidents));
      navigate(`/results/${id}`, { state: { incidentCount: incidents.length } });
    }
  };

  const handlePreventCheating = (e: SyntheticEvent) => {
    e.preventDefault();
    toast.warning("Copy, Paste, and Right-Click are disabled.");
  };

  if (loading) return null;
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans relative overflow-hidden flex flex-col select-none"
      onCopy={handlePreventCheating}
      onPaste={handlePreventCheating}
      onContextMenu={handlePreventCheating}
    >
      {/* Top Navbar */}
      <nav className="h-16 border-b border-white/5 bg-[#0A0A0C] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="font-display font-medium">ProctorAI Secure Exam</span>
          <span className="px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-white/50 ml-2">ID: {id}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white/40'}`} />
            <span className={`font-mono text-sm ${timeLeft < 300 ? 'text-red-400 font-bold' : 'text-white/70'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-1.5 rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"} <Send className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 pb-32">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">{examData?.name || 'Exam'}</h1>
          <p className="text-white/50 text-sm">Please answer all questions below. Your activity is being monitored.</p>
        </div>

        <div className="space-y-8">
          {questions.map((q, index) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden"
            >
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20 shrink-0">
                  {index + 1}
                </div>
                <h3 className="text-lg font-medium text-white/90 pt-1 leading-relaxed">{q.text}</h3>
              </div>

              <div className="pl-12">
                {q.type === 'textarea' ? (
                  <textarea 
                    className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[150px] resize-y"
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                  />
                ) : (
                  <div className="space-y-3">
                    {q.options?.map((opt, i) => (
                      <label key={i} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#050505] border-white/10 hover:border-white/20'}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[q.id] === opt ? 'border-indigo-400' : 'border-white/30'}`}>
                          {answers[q.id] === opt && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />}
                        </div>
                        <span className="text-white/80">{opt}</span>
                        <input 
                          type="radio" 
                          name={`q-${q.id}`} 
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers({...answers, [q.id]: opt})}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Webcam PiP */}
      <div className="fixed bottom-6 right-6 w-64 aspect-video bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl z-50 group">
        {!stream ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0A0A0C]">
            <Video className="w-6 h-6 text-white/20 animate-pulse" />
            <span className="text-xs text-white/40">Initializing Camera...</span>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100" 
            />
            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/80 backdrop-blur-md rounded flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white tracking-wider uppercase">Recording</span>
            </div>
            {/* Dynamic AI Overlay */}
            {aiWarning && (
              <div className="absolute inset-0 bg-red-500/30 flex flex-col items-center justify-center backdrop-blur-sm z-10 transition-all border-2 border-red-500 rounded-xl">
                <ShieldAlert className="w-10 h-10 text-red-500 mb-2 animate-bounce" />
                <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md text-center px-4">
                  {aiWarning}
                </span>
              </div>
            )}
            
            {/* Loading AI State */}
            {!isModelLoaded && !aiWarning && (
               <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-500/80 backdrop-blur-md rounded flex items-center gap-1.5">
                 <span className="text-[10px] font-bold text-white tracking-wider uppercase">Loading AI...</span>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
