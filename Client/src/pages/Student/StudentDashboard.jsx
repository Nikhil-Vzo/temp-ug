import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  BookOpen, Award, Flame, Star, ChevronRight,
  PlayCircle, CheckCircle2, AlertCircle, TrendingUp, Zap
} from 'lucide-react';
import { api } from '../../services/api';

export default function StudentDashboard() {
  const { activeOrg, currentUser } = useOutletContext();
  const slug = activeOrg?.slug;

  const [enrollments, setEnrollments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeOrg) return;
    loadData();
  }, [activeOrg]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollRes, walletRes] = await Promise.allSettled([
        api.getMyEnrollments(),
        api.getWallet(),
      ]);

      if (enrollRes.status === 'fulfilled') {
        setEnrollments(enrollRes.value?.data?.enrollments || []);
      }
      if (walletRes.status === 'fulfilled') {
        setWallet(walletRes.value?.data?.wallet || null);
      }
    } catch {
      setError('Could not load your progress data.');
    } finally {
      setLoading(false);
    }
  };

  const completedCourses = enrollments.filter(e => e.status === 'completed').length;
  const inProgressCourses = enrollments.filter(e => e.status === 'in_progress' || e.completionPercentage > 0).length;
  const coins = wallet?.balance ?? 0;

  const firstName = currentUser?.email?.split('@')[0] || 'Learner';

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div className="welcome-banner student-banner">
        <div>
          <div className="role-pill" style={{ background: 'hsl(260, 70%, 55%)' }}>
            <Star size={14} /> Student
          </div>
          <h1>Welcome back, {firstName}! 👋</h1>
          <p>
            Keep learning in <strong>{activeOrg?.name}</strong>. Every lesson is a step forward.
          </p>
        </div>
        <div className="banner-icon-wrap">
          <BookOpen size={48} strokeWidth={1.2} />
        </div>
      </div>

      {error && (
        <div className="alert-inline">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--purple">
          <div className="stat-icon-wrap"><BookOpen size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : enrollments.length}</span>
            <span className="stat-label">Enrolled Courses</span>
            <span className="stat-sub">{inProgressCourses} in progress</span>
          </div>
        </div>

        <div className="stat-card stat-card--green">
          <div className="stat-icon-wrap"><CheckCircle2 size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : completedCourses}</span>
            <span className="stat-label">Completed</span>
            <span className="stat-sub">Great job finishing those!</span>
          </div>
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-icon-wrap"><Zap size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{loading ? '—' : coins}</span>
            <span className="stat-label">Skill Coins</span>
            <span className="stat-sub">Earn more by completing lessons</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-heading">Jump Back In</h2>
      <div className="actions-grid">
        <Link to={`/org/${slug}/catalog`} className="action-card action-card--indigo">
          <div className="action-icon"><BookOpen size={22} /></div>
          <div className="action-text">
            <strong>Course Catalog</strong>
            <span>Browse and enroll in new courses</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/rewards`} className="action-card action-card--amber">
          <div className="action-icon"><Award size={22} /></div>
          <div className="action-text">
            <strong>Rewards & Badges</strong>
            <span>Check your coins, badges and rank</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>

        <Link to={`/org/${slug}/rewards`} className="action-card action-card--rose">
          <div className="action-icon"><TrendingUp size={22} /></div>
          <div className="action-text">
            <strong>Leaderboard</strong>
            <span>See how you rank among peers</span>
          </div>
          <ChevronRight size={18} className="action-arrow" />
        </Link>
      </div>

      {/* Continue Learning */}
      <h2 className="section-heading">Continue Learning</h2>
      {loading ? (
        <div className="loading-mini"><div className="spinner-sm"></div> Loading your courses...</div>
      ) : enrollments.length === 0 ? (
        <div className="empty-state-inline">
          <BookOpen size={32} />
          <p>You haven't enrolled in any courses yet.</p>
          <Link to={`/org/${slug}/catalog`} className="btn btn-primary btn-sm">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="course-list-dashboard">
          {enrollments.slice(0, 5).map((enroll, idx) => {
            const course = enroll.course_id || enroll;
            const progress = enroll.completionPercentage ?? 0;
            const courseUuid = course?.course_uuid || course?.uuid;
            return (
              <Link
                key={courseUuid || idx}
                to={courseUuid ? `/org/${slug}/courses/${courseUuid}/learn` : `/org/${slug}/catalog`}
                className="course-list-item"
              >
                <div className="course-list-left">
                  <strong>{course?.title || 'Untitled Course'}</strong>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-label">{progress}% complete</span>
                  </div>
                </div>
                <div className="course-list-right">
                  <PlayCircle size={20} className="play-icon" />
                </div>
              </Link>
            );
          })}
          {enrollments.length > 5 && (
            <Link to={`/org/${slug}/catalog`} className="view-all-link">
              View all {enrollments.length} enrollments →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
