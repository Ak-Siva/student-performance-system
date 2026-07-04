// src/App.js — Router + protected routes
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import AppShell from './components/Common/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import MarksPage from './pages/MarksPage';
import AttendancePage from './pages/AttendancePage';
import RecommendationsPage from './pages/RecommendationsPage';
import MyProfilePage from './pages/MyProfilePage';

function PrivateRoute({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/my-profile" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
        <Route path="students" element={<PrivateRoute adminOnly><StudentsPage /></PrivateRoute>} />
        <Route path="students/:rollNo" element={<PrivateRoute><StudentProfilePage /></PrivateRoute>} />
        <Route path="marks" element={<PrivateRoute adminOnly><MarksPage /></PrivateRoute>} />
        <Route path="attendance" element={<PrivateRoute adminOnly><AttendancePage /></PrivateRoute>} />
        <Route path="recommendations" element={<PrivateRoute adminOnly><RecommendationsPage /></PrivateRoute>} />
        <Route path="my-profile" element={<PrivateRoute><MyProfilePage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
