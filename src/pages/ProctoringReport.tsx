import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Video, Clock, EyeOff, MonitorSmartphone } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProctoringReport() {
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  // Dummy data for the report
  const report = {
    studentName: "John Doe",
    studentEmail: "john@example.com",
    examName: "Midterm Examination",
    duration: "1h 45m",
    trustScore: 82, // percentage
    flags: [
      { id: 1, time: "12:04", type: "Multiple Faces Detected", severity: "high", icon: ShieldAlert },
      { id: 2, time: "24:15", type: "Looking Away", severity: "medium", icon: EyeOff },
      { id: 3, time: "45:30", type: "Tab Switched", severity: "high", icon: MonitorSmartphone },
      { id: 4, time: "55:10", type: "Looking Away", severity: "low", icon: EyeOff },
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans pb-20">
      <nav className="h-16 border-b border-white/5 bg-[#0A0A0C] flex items-center px-6 sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="mx-auto font-display font-medium absolute left-1/2 -translate-x-1/2">
          Session Report: {id}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">{report.studentName}</h1>
            <p className="text-white/50">{report.studentEmail} &bull; {report.examName}</p>
          </div>
          
          <div className={`px-6 py-4 rounded-2xl border flex items-center gap-4 ${getScoreColor(report.trustScore)}`}>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase opacity-70 mb-1">Trust Score</div>
              <div className="text-3xl font-bold font-mono">{report.trustScore}%</div>
            </div>
            {report.trustScore >= 90 ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>
        </div>

        {/* Video Player Mockup */}
        <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl overflow-hidden mb-12">
          <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/10 group">
            <Video className="w-12 h-12 text-white/10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <span className="text-white/60 font-medium">Session recording playback goes here</span>
            </div>
            
            {/* Timeline markers */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
               {report.flags.map((flag, i) => (
                 <div 
                   key={flag.id} 
                   className={`absolute top-0 bottom-0 w-1 ${flag.severity === 'high' ? 'bg-red-500' : flag.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                   style={{ left: `${(i + 1) * 20}%` }}
                   title={flag.type}
                 />
               ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between bg-[#0A0A0C]">
             <div className="flex items-center gap-4 text-sm text-white/50">
               <button className="hover:text-white">Play</button>
               <span className="font-mono">00:00 / {report.duration}</span>
             </div>
             <button className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded text-white/70 transition-colors">Export Video</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-8">
          <button 
            className={`pb-4 font-medium transition-colors relative ${activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
            {activeTab === 'overview' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
          <button 
            className={`pb-4 font-medium transition-colors relative ${activeTab === 'timeline' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            onClick={() => setActiveTab('timeline')}
          >
            Incident Timeline
            {activeTab === 'timeline' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {report.flags.map((flag) => (
              <div key={flag.id} className="flex gap-6 items-start bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                <div className="font-mono text-sm text-white/40 pt-1 w-16">{flag.time}</div>
                <div className={`p-2 rounded-lg ${flag.severity === 'high' ? 'bg-red-500/10 text-red-400' : flag.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                   <flag.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{flag.type}</div>
                  <div className="text-sm text-white/50 mt-1 capitalize">Severity: {flag.severity}</div>
                </div>
                <button className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 mt-2">Jump to video</button>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'overview' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
               <div className="text-white/50 text-sm mb-1">Total Incidents</div>
               <div className="text-3xl font-display font-bold">{report.flags.length}</div>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
               <div className="text-white/50 text-sm mb-1">High Severity</div>
               <div className="text-3xl font-display font-bold text-red-400">{report.flags.filter(f => f.severity === 'high').length}</div>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
               <div className="text-white/50 text-sm mb-1">Time to Complete</div>
               <div className="text-3xl font-display font-bold">{report.duration}</div>
             </div>
           </div>
        )}

      </main>
    </div>
  );
}
