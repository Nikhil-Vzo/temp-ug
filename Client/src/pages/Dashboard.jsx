import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { BookOpen, Users, ShieldAlert, Award, Compass } from 'lucide-react';

export default function Dashboard() {
  const { activeOrg, currentUser, role } = useOutletContext();

  const isStaff = ['admin', 'maintainer', 'instructor'].includes(role);

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <div>
          <h1>Welcome to {activeOrg?.name} Workspace</h1>
          <p>You are logged in as <strong>{currentUser?.email}</strong> with role <strong>{role.toUpperCase()}</strong></p>
        </div>
        <div className="banner-badge">
          <Award size={36} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-details">
            <h3>Courses</h3>
            <p>Access syllabus and course resources</p>
            {isStaff ? (
              <Link to={`/org/${activeOrg?.slug}/courses`} className="stat-link">Manage Courses →</Link>
            ) : (
              <Link to={`/org/${activeOrg?.slug}/catalog`} className="stat-link">View Catalog →</Link>
            )}
          </div>
        </div>

        {['admin', 'maintainer'].includes(role) && (
          <div className="stat-card">
            <div className="stat-icon icon-purple">
              <Users size={24} />
            </div>
            <div className="stat-details">
              <h3>Members</h3>
              <p>Manage users and assign roles</p>
              <Link to={`/org/${activeOrg?.slug}/users`} className="stat-link">Manage Members →</Link>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon icon-green">
            <Compass size={24} />
          </div>
          <div className="stat-details">
            <h3>Explore</h3>
            <p>Switch between organizations or workspaces</p>
            <Link to="/orgs" className="stat-link">Change Workspace →</Link>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h2>Organization Details</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>Organization Name</strong></td>
              <td>{activeOrg?.name}</td>
            </tr>
            <tr>
              <td><strong>URL Slug</strong></td>
              <td>/{activeOrg?.slug}</td>
            </tr>
            <tr>
              <td><strong>Explore Setting</strong></td>
              <td>
                <span className={`badge ${activeOrg?.explore ? 'badge-success' : 'badge-neutral'}`}>
                  {activeOrg?.explore ? 'EXPLORABLE' : 'PRIVATE'}
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>Your Organization Role</strong></td>
              <td>
                <span className="badge badge-accent">{role.toUpperCase()}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
