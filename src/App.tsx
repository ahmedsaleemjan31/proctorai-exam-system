import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppAuth } from './lib/firebase';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamRoom from './pages/ExamRoom';
import ExamResults from './pages/ExamResults';
import ProctoringReport from './pages/ProctoringReport';

// Role Guard Component
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const { user, loading } = useAppAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) {
    // Redirect to their own dashboard if they try to access another one
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster theme="dark" position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          
          {/* Protected Dashboards */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/instructor/*" element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student/*" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* Shared/Feature Routes with basic auth check */}
          <Route path="/instructor/report/:id" element={
            <ProtectedRoute allowedRole="instructor">
              <ProctoringReport />
            </ProtectedRoute>
          } />

          <Route path="/exam/:id" element={<ExamRoom />} />
          <Route path="/results/:id" element={<ExamResults />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}


