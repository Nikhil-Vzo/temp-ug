import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminDashboard from './admin/AdminDashboard';
import InstructorDashboard from './Instructor/InstructorDashboard';
import StudentDashboard from './Student/StudentDashboard';

/**
 * Dashboard — role-aware router.
 * Renders the appropriate dashboard based on the current user's role
 * in the active organization (resolved by WorkspaceLayout).
 *
 *   admin / maintainer  →  AdminDashboard
 *   instructor          →  InstructorDashboard
 *   student (default)   →  StudentDashboard
 */
export default function Dashboard() {
  const { role } = useOutletContext();

  if (role === 'admin' || role === 'maintainer') {
    return <AdminDashboard />;
  }

  if (role === 'instructor') {
    return <InstructorDashboard />;
  }

  // Default — student or any unknown role
  return <StudentDashboard />;
}
