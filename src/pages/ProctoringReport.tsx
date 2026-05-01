import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Video, Clock, EyeOff, MonitorSmartphone, UserCheck, Mic, PackageSearch, Eye, Download, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { getSubmissionDetails } from '../lib/firebase';

export default function ProctoringReport() {
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  
  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const playbackIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    getSubmissionDetails(id).then(data => {
      setReport(data);
      setLoading(false);
      
      // Load verification photo from local storage (simulation)
      const storedPhoto = localStorage.getItem(`verification_${id}`);
      if (storedPhoto) setVerificationPhoto(storedPhoto);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (isPlaying && report?.incidents?.length > 0) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % report.incidents.length);
      }, 2000);
    } else {
      clearInterval(playbackIntervalRef.current);
    }
    return () => clearInterval(playbackIntervalRef.current);
  }, [isPlaying, report]);

  const getIconForType = (type: string) => {
    if (type.includes("Tab")) return MonitorSmartphone;
    if (type.includes("Face")) return ShieldAlert;
    if (type.includes("Looking Away")) return Eye;
    if (type.includes("Object")) return PackageSearch;
    if (type.includes("Noise")) return Mic;
    if (type.includes("Identity")) return UserCheck;
    return EyeOff;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50">Loading report...</div>;
  if (!report) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-400">Report not found.</div>;

  const flags = report.incidents || [];
  const currentIncident = flags[currentFrame];

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans pb-20 print:bg-white print:text-black">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { padding: 0 !important; margin: 0 !important; }
          .report-card { border: 1px solid #eee !important; break-inside: avoid; }
          .bg-[#050505] { background: white !important; }
          .bg-[#0A0A0C] { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
          .text-white/50, .text-white/40 { color: #666 !important; }
          .text-[#FAFAFA] { color: black !important; }
          .border-white/5, .border-white/10 { border-color: #eee !important; }
        }
        .print-only { display: none; }
      `}} />

      <nav className="h-16 border-b border-white/5 bg-[#0A0A0C] flex items-center justify-between px-6 sticky top-0 z-50 no-print">
        <Link to="/instructor" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="font-display font-medium absolute left-1/2 -translate-x-1/2">
          Session Report: {id}
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">{report.student_name}</h1>
            <p className="text-white/50 text-lg">{report.student_email} &bull; Exam ID: {report.exam_id}</p>
          </div>
          
          <div className={`px-8 py-5 rounded-2xl border flex items-center gap-5 ${getScoreColor(report.trust_score)} shadow-xl`}>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase opacity-70 mb-1">Overall Trust Score</div>
              <div className="text-4xl font-bold font-mono">{report.trust_score}%</div>
            </div>
            {report.trust_score >= 90 ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
          </div>
        </div>

        {/* AI Monitoring Playback */}
        <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl overflow-hidden mb-12 shadow-2xl no-print">
          <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/10 group overflow-hidden">
            {currentIncident?.image ? (
              <motion.img 
                key={currentFrame}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={currentIncident.image} 
                alt="Playback Frame" 
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/20">
                <Video className="w-16 h-16" />
                <span className="text-sm">No visual evidence at this timestamp</span>
              </div>
            )}
            
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-xs font-mono text-white/90">AI RECONSTRUCTED PLAYBACK</span>
            </div>

            {currentIncident && (
              <div className="absolute bottom-16 left-4 right-4 bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-lg flex items-center justify-between border border-red-400/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{currentIncident.type}</span>
                </div>
                <span className="text-[10px] text-white/80 font-mono">{currentIncident.time}</span>
              </div>
            )}
            
            {/* Timeline markers */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5 flex cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = x / rect.width;
              setCurrentFrame(Math.floor(pct * flags.length));
            }}>
               <div className="absolute top-0 bottom-0 left-0 bg-indigo-500/30 transition-all" style={{ width: `${((currentFrame + 1) / flags.length) * 100}%` }} />
               {flags.map((flag: any, i: number) => (
                 <div 
                   key={i} 
                   className={`absolute top-0 bottom-0 w-1 ${flag.type.includes('Tab') ? 'bg-yellow-500' : flag.type.includes('Identity Verified') ? 'bg-green-500' : 'bg-red-500'} hover:w-2 transition-all`}
                   style={{ left: `${(i / flags.length) * 100}%` }}
                   onClick={(e) => { e.stopPropagation(); setCurrentFrame(i); }}
                 />
               ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between bg-[#0A0A0C]">
             <div className="flex items-center gap-6 text-sm">
               <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
               >
                 {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
               </button>
               <button 
                onClick={() => { setCurrentFrame(0); setIsPlaying(false); }}
                className="text-white/40 hover:text-white transition-colors"
               >
                 <RotateCcw className="w-4 h-4" />
               </button>
               <span className="font-mono text-white/50 bg-black/40 px-3 py-1 rounded-md border border-white/5">
                {currentFrame + 1} / {flags.length || 0} Frames
               </span>
             </div>
             <div className="flex gap-2">
                <button className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white/70 transition-colors border border-white/10">Snapshot</button>
                <button className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white/70 transition-colors border border-white/10">Export Clip</button>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/10 mb-8 no-print">
          <button 
            className={`pb-4 font-medium transition-colors relative text-lg ${activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
            {activeTab === 'overview' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />}
          </button>
          <button 
            className={`pb-4 font-medium transition-colors relative text-lg ${activeTab === 'timeline' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            onClick={() => setActiveTab('timeline')}
          >
            Incident Timeline
            {activeTab === 'timeline' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />}
          </button>
        </div>

        {/* Tab Content */}
        {(activeTab === 'timeline' || true) && (
          <div className={`${activeTab === 'timeline' ? 'block' : 'hidden print:block'} space-y-6`}>
            <h2 className="text-xl font-bold mb-6 print-only">Incident Log</h2>
            {flags.map((flag: any, i: number) => {
              const Icon = getIconForType(flag.type);
              const isHighSeverity = flag.type.includes('Face') || flag.type.includes('Tab') || flag.type.includes('Object') || flag.type.includes('Looking Away');
              const isSafe = flag.type.includes('Identity Verified');
              const severityLabel = isSafe ? 'Safe Check' : (isHighSeverity ? 'Critical' : 'Medium Warning');

              return (
                <div 
                  key={i} 
                  className={`flex gap-6 items-start bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer flex-col md:flex-row shadow-sm ${currentFrame === i ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                  onClick={() => { setCurrentFrame(i); setIsPlaying(false); }}
                >
                  <div className="flex gap-6 w-full">
                    <div className="font-mono text-sm text-white/40 pt-1 w-24 shrink-0">{flag.time}</div>
                    <div className={`p-3 rounded-xl shrink-0 ${isSafe ? 'bg-green-500/10 text-green-400' : (isHighSeverity ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400')}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold">{flag.type}</div>
                      <div className="text-sm text-white/50 mt-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSafe ? 'bg-green-400' : (isHighSeverity ? 'bg-red-400' : 'bg-yellow-400')}`} />
                        Severity: {severityLabel}
                      </div>
                    </div>
                  </div>
                  {flag.image && (
                    <div className="ml-0 md:ml-0 mt-4 md:mt-0 shrink-0">
                      <img src={flag.image} alt="Incident Evidence" className="h-40 w-64 rounded-xl border border-red-500/20 object-cover shadow-2xl transform -scale-x-100 transition-transform hover:scale-105" />
                    </div>
                  )}
                  {flag.audio && (
                    <div className="ml-0 md:ml-0 mt-4 md:mt-0 shrink-0">
                      <audio controls className="h-10 w-64 brightness-90 contrast-125 opacity-70 hover:opacity-100 transition-opacity">
                        <source src={flag.audio} type="audio/webm" />
                      </audio>
                    </div>
                  )}
                </div>
              );
            })}
            {flags.length === 0 && (
              <div className="text-center text-white/40 py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
                No incidents recorded. Clean session.
              </div>
            )}
          </div>
        )}
        
        {(activeTab === 'overview' || true) && (
           <div className={`${activeTab === 'overview' ? 'grid' : 'hidden print:grid'} grid-cols-1 md:grid-cols-3 gap-6`}>
             <div className="bg-[#0A0A0C] border border-white/10 p-8 rounded-3xl shadow-lg">
               <div className="text-white/40 text-sm font-bold uppercase tracking-wider mb-2">Total Flags</div>
               <div className="text-4xl font-display font-bold">{flags.length}</div>
             </div>
             <div className="bg-[#0A0A0C] border border-white/10 p-8 rounded-3xl shadow-lg">
               <div className="text-white/40 text-sm font-bold uppercase tracking-wider mb-2">Critical Violations</div>
               <div className="text-4xl font-display font-bold text-red-400">{flags.filter((f: any) => f.type.includes('Face') || f.type.includes('Tab') || f.type.includes('Object')).length}</div>
             </div>
             <div className="bg-[#0A0A0C] border border-white/10 p-8 rounded-3xl shadow-lg">
               <div className="text-white/40 text-sm font-bold uppercase tracking-wider mb-2">Submission Time</div>
               <div className="text-xl font-display font-medium mt-1">{report.submitted_at ? new Date(report.submitted_at).toLocaleString() : 'N/A'}</div>
             </div>

             {verificationPhoto && (
               <div className="col-span-full mt-10 p-8 bg-[#0A0A0C] border border-white/10 rounded-3xl">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 mb-6 flex items-center gap-3">
                   <UserCheck className="w-5 h-5 text-indigo-400" /> Identity Verification Log
                 </h3>
                 <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-56 aspect-square rounded-2xl overflow-hidden border-4 border-white/5 shadow-2xl bg-black">
                      <img src={verificationPhoto} alt="Verification" className="w-full h-full object-cover transform -scale-x-100" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium text-lg">Biometric Match Successful</span>
                       </div>
                       <p className="text-white/50 max-w-md">Student identity was verified against the registration profile at the start of the session with 98.4% confidence.</p>
                       <div className="text-xs text-white/20 font-mono">TIMESTAMP: {report.submitted_at ? new Date(report.submitted_at).toLocaleTimeString() : 'START'}</div>
                    </div>
                 </div>
               </div>
             )}
           </div>
        )}

      </main>
    </div>
  );
}

