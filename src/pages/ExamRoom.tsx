import { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth, submitExam, getExamById } from '../lib/firebase';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, ShieldCheck, Video, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { Camera, Shield, Check, Mic, Monitor, UserCheck } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced AI State
  const [verificationStage, setVerificationStage] = useState<'idle' | 'verifying' | 'completed'>('idle');
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  const [objectModel, setObjectModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioLevelRef = useRef(0);
  const [isAudioProctoringEnabled, setIsAudioProctoringEnabled] = useState(true);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastIncidentTimeRef = useRef<Record<string, number>>({});
  const faceMissingCountRef = useRef(0);

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

  const [modelError, setModelError] = useState<string | null>(null);

  // Timeout for model loading to prevent being stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isModelLoaded && !modelError) {
        setModelError("Loading is taking longer than expected...");
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isModelLoaded, modelError]);

  // Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Ensure TensorFlow is ready
        await tf.ready();
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://vladmandic.github.io/face-api/model/'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://vladmandic.github.io/face-api/model/'),
        ]);
        const model = await cocoSsd.load();
        setObjectModel(model);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load AI models:", err);
        setModelError("Model loading failed (CORS or Connection)");
        // Don't toast error here to avoid spamming, the UI will show it
      }
    };
    loadModels();
  }, []);

  // Real AI Detection Loop (Faces, Gaze, Objects)
  useEffect(() => {
    if (!isModelLoaded || !stream || !videoRef.current || verificationStage !== 'completed' || isSubmitting) return;

    const video = videoRef.current;
    
    // Warm-up period to avoid false positives at start
    const startTime = Date.now();
    
    const runDetections = async () => {
      if (video.paused || video.ended || !stream.active || (Date.now() - startTime < 3000)) return;
      try {
        // 1. Face & Gaze Detection
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 })).withFaceLandmarks();
        
        let newWarning: string | null = null;
        const now = Date.now();

        if (detections.length === 0) {
          faceMissingCountRef.current++;
          newWarning = "Face Not Detected";
          
          if (faceMissingCountRef.current >= 2 && now - (lastIncidentTimeRef.current['face_missing'] || 0) > 20000) {
            setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Face Not Detected" }]);
            lastIncidentTimeRef.current['face_missing'] = now;
          }
        } else if (detections.length > 1) {
          faceMissingCountRef.current = 0;
          newWarning = "Multiple Faces Detected!";
          if (now - (lastIncidentTimeRef.current['multi_face'] || 0) > 10000) {
            setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Multiple Faces Detected" }]);
            lastIncidentTimeRef.current['multi_face'] = now;
          }
        } else {
          faceMissingCountRef.current = 0;
          // Face is present and single - no additional gaze check
          newWarning = null;
        }

        // 2. Object Detection
        if (objectModel && !newWarning) {
          const objDetections = await objectModel.detect(video);
          const forbidden = objDetections.find(d => ['cell phone', 'book', 'laptop'].includes(d.class));
          if (forbidden) {
            newWarning = `Prohibited Object: ${forbidden.class}`;
            if (now - (lastIncidentTimeRef.current['object'] || 0) > 15000) {
              setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: `Object Detected: ${forbidden.class}` }]);
              lastIncidentTimeRef.current['object'] = now;
            }
          }
        }

        if (newWarning !== aiWarning) {
          setAiWarning(newWarning);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    };

    const interval = setInterval(runDetections, 4000); 
    return () => clearInterval(interval);
  }, [isModelLoaded, stream, verificationStage, objectModel, aiWarning, isSubmitting]);

  // Audio Proctoring
  useEffect(() => {
    if (!stream || !isAudioProctoringEnabled || verificationStage !== 'completed') return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    analyserRef.current = analyser;
    audioContextRef.current = context;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const average = sum / bufferLength;
      
      // Throttle visual update to prevent excessive re-renders
      if (Math.abs(audioLevelRef.current - average) > 2) {
        audioLevelRef.current = average;
        setAudioLevel(average);
      }

      if (average > 50) { // Threshold for suspicious noise
        const now = Date.now();
        const lastNoise = lastIncidentTimeRef.current['noise'] || 0;
        
        if (now - lastNoise > 10000) { // 10 second cooldown for noise incidents
          setIncidents(prev => [...prev, { time: new Date().toLocaleTimeString(), type: "Suspicious Noise Detected" }]);
          toast.warning("Loud noise detected! Please remain quiet.", { duration: 2000 });
          lastIncidentTimeRef.current['noise'] = now;
        }
      }
    };

    const audioInterval = setInterval(checkAudio, 100);

    return () => {
      clearInterval(audioInterval);
      context.close();
      analyserRef.current = null;
      audioContextRef.current = null;
    };
  }, [stream, isAudioProctoringEnabled, verificationStage]);

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


  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const finalIncidents = [...incidents];
    if (verificationPhoto) {
      finalIncidents.push({ time: "Pre-Exam", type: `Identity Verified (Photo Captured)` });
    }
    
    try {
      const trustScore = Math.max(0, 100 - incidents.length * 15);
      const submissionId = await submitExam(
        id || 'unknown_exam', 
        user.uid, 
        user.name, 
        user.email, 
        answers, 
        finalIncidents, 
        trustScore
      );
      
      // Store verification photo in local storage for the report (simulating DB storage for now)
      if (verificationPhoto) {
        localStorage.setItem(`verification_${submissionId}`, verificationPhoto);
      }
      
      // Pass the incidents securely to the results page
      localStorage.setItem('examIncidents', JSON.stringify(finalIncidents));
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
      {/* Verification Overlay */}
      {verificationStage !== 'completed' && (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x" />
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Secure Identity Verification</h2>
              <p className="text-white/50">Please complete the security check to start your exam.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${stream ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Camera Check</div>
                    <div className="text-xs text-white/40">{stream ? 'Camera connected' : 'Accessing camera...'}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isModelLoaded ? 'bg-green-500/10 border-green-500/50 text-green-400' : modelError ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">AI Security Guard</div>
                    <div className="text-xs text-white/40">
                      {isModelLoaded ? 'AI Models ready' : modelError ? <span className="text-red-400">{modelError}</span> : 'Loading security models...'}
                    </div>
                    {modelError && (
                      <button 
                        onClick={() => { setIsModelLoaded(true); setModelError(null); }}
                        className="text-[10px] text-indigo-400 hover:underline mt-1 block"
                      >
                        Skip AI Check (Testing Mode)
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${verificationPhoto ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Identity Snap</div>
                    <div className="text-xs text-white/40">{verificationPhoto ? 'Photo captured' : 'Take a photo to proceed'}</div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-square bg-black rounded-2xl border border-white/10 overflow-hidden relative">
                  {stream ? (
                    <>
                      <video 
                        autoPlay 
                        playsInline 
                        muted 
                        ref={(v) => { if (v) v.srcObject = stream; }}
                        className="w-full h-full object-cover transform -scale-x-100" 
                      />
                      {!verificationPhoto && (
                        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-2xl m-4 pointer-events-none" />
                      )}
                      {verificationPhoto && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-white text-black p-2 rounded-full">
                            <Check className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    const video = document.querySelector('video');
                    const canvas = document.createElement('canvas');
                    if (video) {
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      canvas.getContext('2d')?.drawImage(video, 0, 0);
                      setVerificationPhoto(canvas.toDataURL('image/jpeg'));
                      toast.success("Identity snap captured!");
                    }
                  }}
                  disabled={!stream}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {verificationPhoto ? "Retake Photo" : "Capture Snap"}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setVerificationStage('completed')}
              disabled={!verificationPhoto || !isModelLoaded}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Start Exam Now
            </button>
          </motion.div>
        </div>
      )}
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
            
            {/* Audio Indicator */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
               <Mic className={`w-3 h-3 ${audioLevel > 30 ? 'text-red-400' : 'text-white/50'}`} />
               <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-100 ${audioLevel > 30 ? 'bg-red-400' : 'bg-indigo-400'}`} 
                   style={{ width: `${Math.min(100, audioLevel * 2)}%` }} 
                 />
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
