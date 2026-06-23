import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, RefreshCw, LogOut, GraduationCap, ChevronRight, User, Award } from 'lucide-react';
import { api } from '../services/api';

export default function WorkspaceLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeOrg, setActiveOrg] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    initializeWorkspace();
  }, [slug]);

  const initializeWorkspace = async () => {
    try {
      setLoading(true);
      // Fetch latest profile session from backend
      const res = await api.getMe();
      const user = res.data.user;
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      // Resolve active organization
      let org = JSON.parse(localStorage.getItem('activeOrg') || 'null');
      if (!org || org.slug !== slug) {
        // Fetch org by slug
        const orgRes = await api.getOrgBySlug(slug);
        org = orgRes.data.organization;
        localStorage.setItem('activeOrg', JSON.stringify(org));
      }
      setActiveOrg(org);

      // Resolve user's role in this organization
      const membership = user.memberships.find(
        (m) => m.org_id && (m.org_id._id === org._id || m.org_id === org._id)
      );
      const userRole = membership?.role_id?.name || 'student';
      setRole(userRole);
    } catch (err) {
      console.error('Workspace initialization failed', err);
      navigate('/orgs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeOrg');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  const isStaff = ['admin', 'maintainer', 'instructor'].includes(role);
  const isAdminOrMaintainer = ['admin', 'maintainer'].includes(role);

  // Client-side Role-Based Route Guarding
  const path = location.pathname.toLowerCase();
  const isManageCoursesRoute = (path.includes('/courses') || path.includes('/curriculum')) && !path.includes('/learn');
  const isUserManagementRoute = path.includes('/users');

  if (isManageCoursesRoute && !isStaff) {
    return <Navigate to={`/org/${slug}/dashboard`} replace />;
  }

  if (isUserManagementRoute && !isAdminOrMaintainer) {
    return <Navigate to={`/org/${slug}/dashboard`} replace />;
  }

  return (
    <div className="workspace-container">
      {/* Sidebar */}
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <GraduationCap size={28} className="brand-icon" />
          <div className="brand-text">
            <h2>CampusOS</h2>
            <span className="badge badge-accent">{role.toUpperCase()}</span>
          </div>
        </div>

        {activeOrg && (
          <div className="active-org-card">
            <span className="org-label">Current Workspace</span>
            <div className="org-info">
              <h3>{activeOrg.name}</h3>
              <Link to="/orgs" className="change-org-btn" title="Switch organization">
                <RefreshCw size={14} />
              </Link>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <Link
            to={`/org/${slug}/dashboard`}
            className={`nav-item ${location.pathname.endsWith('/dashboard') ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {isStaff ? (
            <Link
              to={`/org/${slug}/courses`}
              className={`nav-item ${location.pathname.includes('/courses') ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Manage Courses</span>
            </Link>
          ) : (
            <Link
              to={`/org/${slug}/catalog`}
              className={`nav-item ${location.pathname.includes('/catalog') ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Course Catalog</span>
            </Link>
          )}

          {isAdminOrMaintainer && (
            <Link
              to={`/org/${slug}/users`}
              className={`nav-item ${location.pathname.includes('/users') ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </Link>
          )}

          <Link
            to={`/org/${slug}/rewards`}
            className={`nav-item ${location.pathname.includes('/rewards') ? 'active' : ''}`}
          >
            <Award size={18} />
            <span>Rewards & Leaderboard</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          {currentUser && (
            <div className="user-profile-summary">
              <div className="user-avatar">
                <User size={18} />
              </div>
              <div className="user-meta">
                <p className="user-email" title={currentUser.email}>{currentUser.email}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-outline btn-block sidebar-logout-btn">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="workspace-content">
        <div className="content-inner">
          <Outlet context={{ activeOrg, currentUser, role, refreshWorkspace: initializeWorkspace }} />
        </div>
      </main>
    </div>
  );
}
