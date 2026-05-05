import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import ParticleBackground from './components/ParticleBackground';
import PageTransition from './components/PageTransition';
import { useAppAuth } from './lib/firebase';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamRoom from './pages/ExamRoom';
import ExamResults from './pages/ExamResults';
import ProctoringReport from './pages/ProctoringReport';
import SystemPreCheck from './pages/SystemPreCheck';

// Role Guard Component
import SkeletonLoader from './components/SkeletonLoader';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const { user, loading } = useAppAuth();

  if (loading) return <SkeletonLoader />;

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) {
    // Redirect to their own dashboard if they try to access another one
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} {...({ key: location.pathname } as any)}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><AuthPage initialIsLogin={true} /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><AuthPage initialIsLogin={false} /></PageTransition>} />

        {/* Protected Dashboards */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRole="admin">
            <PageTransition><AdminDashboard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/instructor/*" element={
          <ProtectedRoute allowedRole="instructor">
            <PageTransition><InstructorDashboard /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/student/*" element={
          <ProtectedRoute allowedRole="student">
            <PageTransition><StudentDashboard /></PageTransition>
          </ProtectedRoute>
        } />

        {/* Shared/Feature Routes with basic auth check */}
        <Route path="/instructor/report/:id" element={
          <ProtectedRoute allowedRole="instructor">
            <PageTransition><ProctoringReport /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/pre-check" element={
          <ProtectedRoute allowedRole="student">
            <PageTransition><SystemPreCheck /></PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/exam/:id" element={<PageTransition><ExamRoom /></PageTransition>} />
        <Route path="/results/:id" element={<PageTransition><ExamResults /></PageTransition>} />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      <Toaster 
        theme="dark" 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 25, 0.4)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: '#FAFAFA',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
          },
          className: 'glass-toast',
        }}
      />
      <ParticleBackground />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}


