import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Organizations from './pages/Organizations';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Catalog from './pages/Catalog';
import UsersList from './pages/Users';
import CurriculumBuilder from './pages/Instructor/CurriculumBuilder';
import LessonPlayer from './pages/Student/LessonPlayer';
import Rewards from './pages/Student/Rewards';
import './App.css';

// Guard for protected pages (requires JWT token)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Redirect root to orgs page or login
function RootRedirect() {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/orgs" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Organization Switcher (Protected) */}
        <Route 
          path="/orgs" 
          element={
            <ProtectedRoute>
              <Organizations />
            </ProtectedRoute>
          } 
        />

        {/* Workspace Sub-Pages (Protected Layout) */}
        <Route 
          path="/org/:slug" 
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseUuid/curriculum" element={<CurriculumBuilder />} />
          <Route path="courses/:courseUuid/learn" element={<LessonPlayer />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="users" element={<UsersList />} />
          <Route path="rewards" element={<Rewards />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
