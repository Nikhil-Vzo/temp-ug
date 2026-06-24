import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Users, BookOpen, ShieldCheck, Settings, TrendingUp,
  PlusCircle, UserPlus, LayoutGrid, ChevronRight, Building2,
  Zap, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const { activeOrg, currentUser, role } = useOutletContext();
  const slug = activeOrg?.slug;

  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeOrg) return;
    loadStats();
  }, [activeOrg]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [membersRes, coursesRes] = await Promise.all([
        api.getOrgMembers(activeOrg.organization_uuid || activeOrg._id),
        api.getCoursesByOrg(slug),
      ]);
      setMembers(membersRes?.data?.members || []);
      setCourses(coursesRes?.data?.courses || []);
    } catch (err) {
      setError('Could not load all stats. Some data may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const studentCount = members.filter(m => m.role === 'student').length;
  const instructorCount = members.filter(m => m.role === 'instructor').length;

  const roleColor = role === 'admin' ? 'var(--danger, #ef4444)' : 'var(--accent)';
  const roleLabel = role === 'admin' ? 'Administrator' : 'Maintainer';

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="welcome-banner admin-banner">
        <div>
          <div className="role-pill" style={{ background: roleColor }}>
            <ShieldCheck size={14} /> {roleLabel}
          </div>
          <h1>Admin Control Center</h1>
          <p>
            Manage <strong>{activeOrg?.name}</strong> — members, courses, and workspace settings.
          </p>
        </div>
        <div className="banner-icon-wrap">
          <Building2 size={48} strokeWidth={1.2} />
        </div>
      </div>

      {error && (
        <div className="alert-inline">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-icon-wrap">
            <Users size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : members.length}</span>
            <span className="stat-label">Total Members</span>
            {!loading && (
              <span className="stat-sub">
                {adminCount} admin · {instructorCount} instructor · {studentCount} student
              </span>
            )}
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-icon-wrap">
            <BookOpen size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : courses.length}</span>
            <span className="stat-label">Total Courses</span>
            {!loading && (
              <span className="stat-sub">
                {publishedCourses} published · {draftCourses} draft
              </span>
            )}
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-icon-wrap">
            <TrendingUp size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-number">{activeOrg?.explore ? 'Public' : 'Private'}</span>
            <span className="stat-label">Workspace Visibility</span>
            <span className="stat-sub">
              {activeOrg?.explore ? 'Anyone can discover this org' : 'Invite-only access'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-heading">Quick Actions</h2>
      <div className="actions-grid">
        <Link to={`/org/${slug}/users`} className="action-card action-card--indigo">
          <div className="action-icon"><UserPlus size={22} /></div>
          <div className="action-text">
            <strong>Manage Members</strong>
            <span>Add, remove, or change member roles</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/courses`} className="action-card action-card--teal">
          <div className="action-icon"><PlusCircle size={22} /></div>
          <div className="action-text">
            <strong>Manage Courses</strong>
            <span>Create, publish, or archive courses</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/rewards`} className="action-card action-card--amber">
          <div className="action-icon"><Zap size={22} /></div>
          <div className="action-text">
            <strong>Rewards & Leaderboard</strong>
            <span>View gamification and point history</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>
      </div>

      {/* Org Info */}
      <h2 className="section-heading">Organization Details</h2>
      <div className="info-card">
        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>Organization Name</strong></td>
              <td>{activeOrg?.name}</td>
            </tr>
            <tr>
              <td><strong>URL Slug</strong></td>
              <td><code>/{activeOrg?.slug}</code></td>
            </tr>
            <tr>
              <td><strong>Your Role</strong></td>
              <td><span className="badge badge-accent">{role.toUpperCase()}</span></td>
            </tr>
            <tr>
              <td><strong>Visibility</strong></td>
              <td>
                <span className={`badge ${activeOrg?.explore ? 'badge-success' : 'badge-neutral'}`}>
                  {activeOrg?.explore ? 'EXPLORABLE' : 'PRIVATE'}
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>Logged in as</strong></td>
              <td>{currentUser?.email}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
