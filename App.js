import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';
import CareerResults from './pages/CareerResults';
import Roadmap from './pages/Roadmap';
import Dashboard from './pages/Dashboard';
import ResumeAnalysis from './pages/ResumeAnalysis';
import Community from './pages/Community';
import Layout from './components/Layout';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (!user.quiz_completed) return <Navigate to="/quiz" />;
    if (!user.selected_career) return <Navigate to="/career-results" />;
    return <Navigate to="/dashboard" />;
  }
  return children;
}

// Key = selected_career so React fully destroys + recreates Roadmap on career switch.
// Also keyed on location.key so navigating to /roadmap always triggers a fresh mount.
function RoadmapWrapper() {
  const { user } = useAuth();
  const location = useLocation();
  const career = user?.selected_career || 'default';
  // Combine career + navigation key so BOTH a career change AND a fresh navigate remount
  const mountKey = `${career}-${location.key}`;
  return <Roadmap key={mountKey} />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/quiz"           element={<PrivateRoute><Quiz /></PrivateRoute>} />
      <Route path="/career-results" element={<PrivateRoute><CareerResults /></PrivateRoute>} />
      <Route path="/dashboard"      element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/community"      element={<PrivateRoute><Layout><Community /></Layout></PrivateRoute>} />
      <Route path="/roadmap"        element={<PrivateRoute><Layout><RoadmapWrapper /></Layout></PrivateRoute>} />
      <Route path="/resume"         element={<PrivateRoute><Layout><ResumeAnalysis /></Layout></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
