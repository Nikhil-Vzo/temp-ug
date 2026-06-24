import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  BookOpen, GraduationCap, PlusCircle, ChevronRight,
  BarChart2, Award, Edit3, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '../../services/api';

export default function InstructorDashboard() {
  const { activeOrg, currentUser } = useOutletContext();
  const slug = activeOrg?.slug;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeOrg) return;
    loadData();
  }, [activeOrg]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCoursesByOrg(slug);
      setCourses(res?.data?.courses || []);
    } catch {
      setError('Could not load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const published = courses.filter(c => c.status === 'published');
  const drafts = courses.filter(c => c.status === 'draft');
  const archived = courses.filter(c => c.status === 'archived');

  const StatusBadge = ({ status }) => {
    const map = {
      published: { icon: <CheckCircle2 size={13} />, label: 'Published', cls: 'badge-success' },
      draft:     { icon: <Clock size={13} />, label: 'Draft', cls: 'badge-neutral' },
      archived:  { icon: <Archive size={13} />, label: 'Archived', cls: 'badge-warn' },
    };
    const info = map[status] || { icon: null, label: status, cls: 'badge-neutral' };
    return (
      <span className={`badge ${info.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
        {info.icon} {info.label}
      </span>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="welcome-banner instructor-banner">
        <div>
          <div className="role-pill" style={{ background: 'var(--accent)' }}>
            <GraduationCap size={14} /> Instructor
          </div>
          <h1>Instructor Studio</h1>
          <p>
            Build and manage courses for <strong>{activeOrg?.name}</strong>. Your content shapes learners.
          </p>
        </div>
        <div className="banner-icon-wrap">
          <Edit3 size={48} strokeWidth={1.2} />
        </div>
      </div>

      {error && (
        <div className="alert-inline">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--green">
          <div className="stat-icon-wrap"><CheckCircle2 size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : published.length}</span>
            <span className="stat-label">Published Courses</span>
            <span className="stat-sub">Live and visible to students</span>
          </div>
        </div>

        <div className="stat-card stat-card--blue">
          <div className="stat-icon-wrap"><Clock size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : drafts.length}</span>
            <span className="stat-label">In Progress</span>
            <span className="stat-sub">Drafts awaiting completion</span>
          </div>
        </div>

        <div className="stat-card stat-card--purple">
          <div className="stat-icon-wrap"><BarChart2 size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : courses.length}</span>
            <span className="stat-label">Total Courses</span>
            <span className="stat-sub">{archived.length} archived</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-heading">Quick Actions</h2>
      <div className="actions-grid">
        <Link to={`/org/${slug}/courses`} className="action-card action-card--teal">
          <div className="action-icon"><PlusCircle size={22} /></div>
          <div className="action-text">
            <strong>Create a Course</strong>
            <span>Start building a new learning experience</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/courses`} className="action-card action-card--indigo">
          <div className="action-icon"><BookOpen size={22} /></div>
          <div className="action-text">
            <strong>My Courses</strong>
            <span>Edit curriculum, manage lessons</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/rewards`} className="action-card action-card--amber">
          <div className="action-icon"><Award size={22} /></div>
          <div className="action-text">
            <strong>Leaderboard</strong>
            <span>See how students are performing</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>
      </div>

      {/* Course List */}
      <h2 className="section-heading">Your Courses</h2>
      {loading ? (
        <div className="loading-mini"><div className="spinner-sm"></div> Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state-inline">
          <BookOpen size={32} />
          <p>You haven't created any courses yet.</p>
          <Link to={`/org/${slug}/courses`} className="btn btn-primary btn-sm">Create your first course</Link>
        </div>
      ) : (
        <div className="course-list-dashboard">
          {courses.slice(0, 5).map(course => (
            <Link
              key={course.course_uuid || course._id}
              to={`/org/${slug}/courses/${course.course_uuid}/curriculum`}
              className="course-list-item"
            >
              <div className="course-list-left">
                <strong>{course.title}</strong>
                <span className="course-desc">{course.description || 'No description'}</span>
              </div>
              <div className="course-list-right">
                <span className={`badge ${course.status === 'published' ? 'badge-success' : course.status === 'draft' ? 'badge-neutral' : 'badge-warn'}`}>
                  {course.status?.toUpperCase() || 'DRAFT'}
                </span>
                <ChevronRight size={16} className="action-arrow" />
              </div>
            </Link>
          ))}
          {courses.length > 5 && (
            <Link to={`/org/${slug}/courses`} className="view-all-link">
              View all {courses.length} courses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
