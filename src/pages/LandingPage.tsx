import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../lib/firebase';
import { 
  ShieldCheck, Eye, Smartphone, FileCheck2, Lock, ArrowRight, Play, 
  GraduationCap, Building2, CheckCircle2, BrainCircuit, AlertTriangle, Fingerprint
} from 'lucide-react';
import Magnetic from '../components/Magnetic';
import TiltCard from '../components/TiltCard';

export default function LandingPage() {
  const { user, loading } = useAppAuth();
  const navigate = useNavigate();

  const handlePortalAccess = () => {
    if (user?.role === 'admin') navigate('/admin');
    else if (user?.role === 'student') navigate('/student');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#FAFAFA] font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Proctor<span className="text-white/60">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <button onClick={handlePortalAccess} className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-white/90 outline-none transition-all flex items-center gap-2 cursor-pointer">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link to="/login">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block text-sm font-medium hover:text-indigo-400 transition-colors cursor-pointer">
                    Log In
                  </motion.button>
                </Link>
                <Link to="/signup">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-white/90 outline-none transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer">
                    Sign Up <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6 perspective-1000">
        <motion.div 
          animate={{ rotateZ: 360 }} 
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" 
        />
        <motion.div 
          animate={{ rotateZ: -360 }} 
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" 
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            ProctorAI 2.0 is now live
          </div>
          <motion.h1 
            initial="hidden" 
            animate="show" 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6 flex flex-wrap justify-center gap-x-4"
          >
            {["The", "intelligent", "standard", "for"].map((word, i) => (
              <motion.span key={i} variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }} className="inline-block">{word}</motion.span>
            ))}
            <motion.span variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }} className="text-gradient w-full mt-2">secure assessments.</motion.span>
          </motion.h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ensure academic integrity with AI-driven monitoring, real-time behavioral analytics, and seamless LMS integrations. The platform built for modern institutions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link to="/signup" className="w-full sm:w-auto">
                <Magnetic strength={0.2} className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    className="relative inline-flex h-14 w-full sm:w-auto overflow-hidden rounded-full p-[1.5px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#050505] cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-shadow group"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c084fc_0%,#818cf8_50%,#c084fc_100%)]" />
                    <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-[#050505] px-8 py-3.5 font-medium text-white backdrop-blur-3xl gap-2 group-hover:bg-[#0A0A0C] transition-colors">
                      Start Free Trial
                    </span>
                  </motion.button>
                </Magnetic>
              </Link>
          </div>
        </motion.div>

        {/* Hero Image Mockup (3D) */}
        <Magnetic strength={0.05} className="w-full max-w-5xl mx-auto mt-20 relative z-10 preserve-3d animate-float">
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.2, delay: 0.2, type: "spring", stiffness: 100 }}
            className="w-full h-full relative"
          >
            <div className="bg-glass rounded-2xl p-2 md:p-4 glow-effect shadow-[0_30px_60px_rgba(99,102,241,0.2)] border-t border-l border-white/20 transform transition-transform duration-500 hover:scale-[1.02]">
              <div className="bg-[#0A0A0C] rounded-xl overflow-hidden border border-white/5 relative shadow-inner">
              {/* Fake UI Header */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-[#111]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="ml-4 text-xs font-mono text-white/40">app.proctorai.com/live-session/CS101</div>
              </div>
              {/* Fake UI Body */}
              <div className="h-[400px] md:h-[600px] flex">
                <div className="w-64 border-r border-white/5 hidden md:block p-4 flex flex-col gap-4">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Live Exams</div>
                  {[1, 2, 3].map((i) => (
                    <motion.div whileHover={{ x: 5 }} key={i} className={`p-3 rounded-lg border ${i === 1 ? 'bg-indigo-500/10 border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-transparent'} flex items-center gap-3 cursor-pointer`}>
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs shadow-md">
                        {['CS', 'MA', 'PH'][i-1]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Midterm {i}</div>
                        <div className="text-xs text-white/50">{24 + i * 12} Students</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex-1 p-6 bg-gradient-to-br from-[#0A0A0C] to-[#12121A] relative overflow-hidden">
                   {/* Abstract visualizing of AI tracking */}
                   <motion.div 
                     animate={{ rotateZ: 360, scale: [1, 1.05, 1] }} 
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 flex items-center justify-center opacity-40"
                   >
                      <div className="w-64 h-64 border border-indigo-500/30 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                        <div className="w-48 h-48 border border-white/10 rounded-full flex items-center justify-center shadow-inner">
                          <Eye className="w-12 h-12 text-indigo-400 opacity-80 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                        </div>
                      </div>
                      
                      {/* Fake tracking lines */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <path d="M50 50 L20 20 M50 50 L80 30 M50 50 L70 80 M50 50 L30 70" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.5" fill="none" />
                      </svg>
                   </motion.div>
                   
                   {/* Fake alerts overlay */}
                   <div className="absolute top-6 right-6 flex flex-col gap-3">
                      <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }} className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-lg flex items-start gap-3 backdrop-blur-md shadow-[0_10px_20px_rgba(239,68,68,0.1)]">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <div>
                          <div className="text-sm font-medium text-red-200">Multiple Faces Detected</div>
                          <div className="text-xs text-red-400/70">Candidate: J. Doe • 1m ago</div>
                        </div>
                      </motion.div>
                      <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.5 }} className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 rounded-lg flex items-start gap-3 backdrop-blur-md shadow-[0_10px_20px_rgba(234,179,8,0.1)]">
                        <Smartphone className="w-5 h-5 text-yellow-400 mt-0.5 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                        <div>
                          <div className="text-sm font-medium text-yellow-200">Device Detected</div>
                          <div className="text-xs text-yellow-400/70">Candidate: S. Smith • 3m ago</div>
                        </div>
                      </motion.div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Magnetic>
      </section>

      {/* Infinite Marquee Section */}
      <div className="relative flex overflow-x-hidden border-y border-white/5 bg-white/[0.01] py-8 md:py-12">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full scale-150 animate-pulse pointer-events-none" />
        <div className="animate-marquee whitespace-nowrap flex items-center relative z-10">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-white/20 uppercase tracking-tighter italic select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">AI POWERED</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-indigo-500/50 uppercase tracking-tighter italic select-none drop-shadow-[0_0_25px_rgba(99,102,241,0.5)] animate-pulse">•</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-white/20 uppercase tracking-tighter italic select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">99.9% ACCURACY</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-purple-500/50 uppercase tracking-tighter italic select-none drop-shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-pulse">•</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-white/20 uppercase tracking-tighter italic select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">REAL-TIME MONITORING</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-indigo-500/50 uppercase tracking-tighter italic select-none drop-shadow-[0_0_25px_rgba(99,102,241,0.5)] animate-pulse">•</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-white/20 uppercase tracking-tighter italic select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">BROWSER LOCKDOWN</span>
              <span className="text-4xl md:text-7xl font-bold font-display mx-8 text-purple-500/50 uppercase tracking-tighter italic select-none drop-shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-pulse">•</span>
            </div>
          ))}
        </div>
        
        {/* Subtle fade effect on the edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
      </div>

      {/* Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-white/40 mb-6 font-medium">TRUSTED BY INNOVATIVE INSTITUTIONS GLOBALLY</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Institution Logos using Icons and Text */}
             <div className="flex items-center gap-2 text-xl font-display font-bold"><GraduationCap className="w-6 h-6"/> Stanford Univ.</div>
             <div className="flex items-center gap-2 text-xl font-display font-bold"><Building2 className="w-6 h-6"/> MIT Tech</div>
             <div className="flex items-center gap-2 text-xl font-display font-bold text-white"><ShieldCheck className="w-6 h-6"/> EdX Partners</div>
             <div className="flex items-center gap-2 text-xl font-display font-bold"><GraduationCap className="w-6 h-6"/> Oxford Inst.</div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 md:py-32 max-w-7xl mx-auto px-6 relative">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">Built for Secure Assessments</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg hover:text-white transition-colors duration-300">
               Everything you need to maintain academic integrity, packed into a single, seamless platform.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 (Large) */}
            <TiltCard className="md:col-span-2">
              <motion.div whileHover={{ y: -8 }} className="bg-glass rounded-3xl p-8 glow-effect flex flex-col justify-between group overflow-hidden relative transition-all hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] h-full">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/30 group-hover:scale-150 transition-all duration-700" />
                 <motion.div animate={{ rotateZ: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity }} className="relative z-10 w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <BrainCircuit className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                 </motion.div>
                 <div className="relative z-10 mt-auto pt-32">
                    <h3 className="text-2xl font-bold font-display mb-2 text-white">AI Behavioral Analysis</h3>
                    <p className="text-white/70 leading-relaxed font-medium">
                       Our proprietary models analyze eye movement, posture, and micro-expressions in real-time. Detects suspicious behavior with 99% accuracy without violating student privacy.
                    </p>
                 </div>
              </motion.div>
            </TiltCard>

            {/* Feature 2 (Tall) */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass rounded-3xl p-8 glow-effect flex flex-col group overflow-hidden relative transition-all hover:shadow-[0_20px_50px_rgba(168,85,247,0.2)] h-full">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />
                 <motion.div whileHover={{ scale: 1.1 }} className="relative z-10 w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Fingerprint className="w-7 h-7 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                 </motion.div>
                 <h3 className="text-2xl font-bold font-display mb-2 mt-auto text-white">Automated ID Verification</h3>
                 <p className="text-white/70 leading-relaxed text-sm font-medium">
                    Seamlessly verify student identities pre-exam using facial recognition against official university records.
                 </p>
              </motion.div>
            </TiltCard>

            {/* Feature 3 */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass rounded-3xl p-8 glow-effect group transition-all hover:shadow-[0_15px_40px_rgba(59,130,246,0.2)] border-t border-l border-white/10 h-full">
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                    <Lock className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 </div>
                 <h3 className="text-xl font-bold font-display mb-2 text-white">Browser Lockdown</h3>
                 <p className="text-white/70 text-sm font-medium">
                    Restricts access to dual monitors, keyboard shortcuts, external sites, and unauthorized applications.
                 </p>
              </motion.div>
            </TiltCard>

            {/* Feature 4 */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass rounded-3xl p-8 glow-effect group border border-red-500/10 transition-all hover:border-red-500/30 hover:shadow-[0_15px_40px_rgba(248,113,113,0.2)] h-full">
                 <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                    <AlertTriangle className="w-6 h-6 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                 </div>
                 <h3 className="text-xl font-bold font-display mb-2 text-white">Real-Time Alerts</h3>
                 <p className="text-white/70 text-sm font-medium">
                    Live proctors receive instantly flagged timestamps for manual review when AI detects anomalies.
                 </p>
              </motion.div>
            </TiltCard>

            {/* Feature 5 */}
            <TiltCard>
              <motion.div whileHover={{ y: -8 }} className="bg-glass rounded-3xl p-8 glow-effect group overflow-hidden relative transition-all hover:shadow-[0_15px_40px_rgba(74,222,128,0.2)] h-full">
               {/* Decorative background grid */}
               <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/5 to-transparent pointer-events-none transition-all duration-700 group-hover:h-48" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
               <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 relative z-10 shadow-inner">
                  <FileCheck2 className="w-6 h-6 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
               </div>
               <h3 className="text-xl font-bold font-display mb-2 relative z-10 text-white">Detailed Audit Logs</h3>
               <p className="text-white/70 text-sm relative z-10 font-medium">
                  Comprehensive post-exam reports including severity scores, video clips, and behavioral graphs.
               </p>
            </motion.div>
           </TiltCard>
         </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 relative border-t border-white/5 bg-[#08080A]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
               <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">Plug & play integration.</h2>
                  <p className="text-lg text-white/60">Get your institution set up in minutes, not months. ProctorAI integrates directly into your existing workflow.</p>
               </div>
               <div className="flex gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium">View API Docs</motion.button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               {[
                  { title: "Connect LMS", desc: "One-click integrations for Canvas, Blackboard, and Moodle." },
                  { title: "Configure Rules", desc: "Select AI strictness, lockdown settings, and allowed materials." },
                  { title: "Students Verify", desc: "30-second automated facial ID check before starting." },
                  { title: "Review Results", desc: "Access the dashboard for flagged incidents and video logs." }
               ].map((step, i) => (
                  <div key={i} className="relative">
                     {/* Connector line */}
                     {i < 3 && <div className="hidden md:block absolute top-6 left-12 w-full h-[1px] bg-white/10" />}
                     
                     <div className="relative z-10 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold mb-6">
                        {i + 1}
                     </div>
                     <h4 className="text-lg font-bold font-display mb-2">{step.title}</h4>
                     <p className="text-sm text-white/60">{step.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-indigo-500/10 blur-[150px] pointer-events-none" />
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">Ready to secure your exams?</h2>
            <p className="text-xl text-white/60 mb-10">
               Join hundreds of institutions using ProctorAI to maintain academic integrity on a massive scale.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link to="/signup">
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]">
                   Start Your Free Trial
                 </motion.button>
               </Link>
               <motion.button 
                 whileHover={{ scale: 1.05 }} 
                 whileTap={{ scale: 0.95 }} 
                 onClick={() => window.open('https://wa.me/923218528796', '_blank')}
                 className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-full font-medium transition-all cursor-pointer"
               >
                 Contact Sales
               </motion.button>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/40">
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel anytime</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> SOC2 Compliant</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 24/7 Support</li>
            </ul>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-12">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start justify-between gap-12">
            <div className="max-w-xs">
               <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight mb-4">
                 <ShieldCheck className="w-6 h-6 text-indigo-400" />
                 <span>Proctor<span className="text-white/60">AI</span></span>
               </div>
               <p className="text-sm text-white/40 leading-relaxed">
                  Building the future of secure, accessible, and intelligent online assessments for everyone.
               </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 text-sm">
               <div>
                  <h5 className="font-semibold text-white mb-4">Product</h5>
                  <ul className="flex flex-col gap-2 text-white/50">
                     <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                  </ul>
               </div>
               <div>
                  <h5 className="font-semibold text-white mb-4">Resources</h5>
                  <ul className="flex flex-col gap-2 text-white/50">
                     <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  </ul>
               </div>
               <div>
                  <h5 className="font-semibold text-white mb-4">Company</h5>
                  <ul className="flex flex-col gap-2 text-white/50">
                     <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-sm text-white/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 ProctorAI Inc. All rights reserved.</p>
            <div className="flex gap-4">
               <a href="#" className="hover:text-white transition-colors">Twitter</a>
               <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
               <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
         </div>
      </footer>
    </div>
  );
}
