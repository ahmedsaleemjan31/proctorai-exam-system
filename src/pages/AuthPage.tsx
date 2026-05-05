import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithGoogle, useAppAuth, setUserRole, signUpWithEmail, loginWithEmail } from '../lib/firebase';
import { Shield, Mail, Lock, ArrowLeft, GraduationCap, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AuthPage({ initialIsLogin = true }: { initialIsLogin?: boolean }) {
  const { user, loading } = useAppAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState(false);

  useEffect(() => {
    if (!loading && user?.role) {
      if (user.role === 'admin') navigate('/admin');
      if (user.role === 'instructor') navigate('/instructor');
      if (user.role === 'student') navigate('/student');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        alert("Google Login failed: " + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectRole = async (role: 'admin' | 'student' | 'instructor') => {
    if (!user || !user.email) return;
    setIsSettingRole(true);
    try {
      await setUserRole(user.uid, user.email, name || user.name || 'User', role);
    } catch (err) {
      console.error(err);
      alert("Failed to set role.");
      setIsSettingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#050505] items-center justify-center min-h-screen text-white">
        <div className="animate-spin text-indigo-500"><ShieldCheck className="w-10 h-10" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <motion.div animate={{ rotateZ: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors group z-20"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Shield Icon Container */}
        <div className="flex justify-center mb-8 preserve-3d">
          <motion.div animate={{ y: [0, -10, 0], rotateX: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-20 h-20 bg-glass border border-white/10 rounded-[24px] flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.2)] relative group glow-effect">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Shield className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="bg-glass border border-white/10 rounded-[32px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl glow-effect"
        >
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h1>
                  <p className="text-white/40 text-sm">
                    {isLogin ? 'Sign in to continue your assessment' : 'Sign up to start your assessment'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-indigo-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="Institutional Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-indigo-400 transition-colors">
                          <Shield className="w-5 h-5 opacity-50" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#121214] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-indigo-400 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="relative inline-flex h-14 w-full overflow-hidden rounded-2xl p-[1.5px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#0A0A0C] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-indigo-500/20 group"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c084fc_0%,#818cf8_50%,#c084fc_100%)]" />
                    <span className="inline-flex h-full w-full items-center justify-center rounded-[15px] bg-[#0A0A0C] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-3xl group-hover:bg-[#121214] transition-colors">
                      {isProcessing ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </span>
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0A0A0C] px-4 text-white/20 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                  className="w-full bg-[#121214] hover:bg-[#18181B] border border-white/5 text-white font-medium py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="group-hover:text-white transition-colors">Google Account</span>
                </button>

                <p className="text-center mt-8 text-sm text-white/40">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline-offset-4 hover:underline"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">Complete Setup</h1>
                  <p className="text-white/40 text-sm">Select your account role to continue</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/20' },
                    { id: 'instructor', label: 'Instructor', icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-400/5', border: 'border-indigo-400/20' },
                    { id: 'admin', label: 'Admin', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      disabled={isSettingRole}
                      onClick={() => handleSelectRole(role.id as any)}
                      className={`flex items-center gap-4 p-5 rounded-2xl border ${role.border} ${role.bg} hover:bg-white/5 hover:scale-105 hover:shadow-[0_10px_20px_rgba(99,102,241,0.1)] transition-all group cursor-pointer`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.bg} border ${role.border} group-hover:scale-110 transition-transform shadow-inner`}>
                        <role.icon className={`w-6 h-6 ${role.color} drop-shadow-md`} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{role.label}</div>
                        <div className="text-xs text-white/40">Access {role.label.toLowerCase()} dashboard</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {isSettingRole && (
                  <div className="mt-6 flex justify-center items-center gap-2 text-indigo-400 text-sm animate-pulse">
                    <Shield className="w-4 h-4 animate-spin" />
                    Configuring account...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

