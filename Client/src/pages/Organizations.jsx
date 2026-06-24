import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, LogOut, ShieldAlert, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const [orgsRes, meRes] = await Promise.all([
        api.getMyOrgs(),
        api.getMe(),
      ]);
      setOrgs(orgsRes.data.organizations || []);
      setCurrentUser(meRes.data.user);
    } catch (err) {
      setError('Failed to load data. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  const isPlatformAdmin = currentUser?.email && (
    currentUser.email.toLowerCase() === 'admin@gmail.com' ||
    currentUser.email.toLowerCase().startsWith('admin@') ||
    currentUser.email.toLowerCase().includes('admin')
  );

  // A user can create an org only if they have NO existing memberships at all or are platform admins
  const canCreateOrg = currentUser && (currentUser.memberships?.length === 0 || isPlatformAdmin);

  // A user already owns an org if any of their memberships has role_id.name === 'admin', unless they are a platform admin
  const alreadyOwnsOrg = !isPlatformAdmin && currentUser?.memberships?.some(
    (m) => m.role_id?.name === 'admin'
  );

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!name || !slug) return;
    setCreating(true);
    setError('');

    try {
      await api.createOrg(name, slug);
      setName('');
      setSlug('');
      await initialize();
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectOrg = (org) => {
    localStorage.setItem('activeOrg', JSON.stringify(org));
    navigate(`/org/${org.slug}/dashboard`);
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

  return (
    <div className="orgs-page-container">
      <header className="orgs-header">
        <h1>CampusOS</h1>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      <div className="orgs-layout">
        <section className="orgs-list-section">
          <h2>Select your Organization</h2>
          <p className="section-description">Choose a workspace to continue developing or studying</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="orgs-grid">
            {orgs.length === 0 ? (
              <div className="empty-state">
                <Building2 size={48} />
                <h3>No organizations found</h3>
                <p>
                  {canCreateOrg
                    ? "Get started by creating a new workspace on the right."
                    : "Contact your organization administrator to be added to a workspace."}
                </p>
              </div>
            ) : (
              orgs.map((org) => (
                <div key={org._id || org.slug} className="org-card" onClick={() => handleSelectOrg(org)}>
                  <div className="org-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="org-details">
                    <h3>{org.name}</h3>
                    <span className="org-slug">/{org.slug}</span>
                  </div>
                  <ArrowRight size={20} className="org-arrow" />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="orgs-create-section">
          {canCreateOrg ? (
            // Brand new user — no memberships at all — can create their first org
            <div className="create-card">
              <h2>Create New Organization</h2>
              <p>Start a new learning workspace and collaborate with your team</p>

              <form onSubmit={handleCreateOrg}>
                <div className="form-group">
                  <label htmlFor="orgName">Organization Name</label>
                  <input
                    id="orgName"
                    type="text"
                    placeholder="e.g. Pioneer University"
                    value={name}
                    onChange={handleNameChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orgSlug">Workspace URL Slug</label>
                  <input
                    id="orgSlug"
                    type="text"
                    placeholder="pioneer-university"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={creating}>
                  <Plus size={18} /> {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </form>
            </div>
          ) : alreadyOwnsOrg ? (
            // Already owns an org — 1 per account rule
            <div className="create-card create-card--locked">
              <div className="locked-icon"><Lock size={36} /></div>
              <h2>Organization Limit Reached</h2>
              <p>Each account is limited to <strong>one organization</strong>. You are already the administrator of an existing workspace.</p>
              <p className="muted">Select your workspace from the list on the left to continue.</p>
            </div>
          ) : (
            // Has memberships as student/instructor — cannot create
            <div className="create-card create-card--locked">
              <div className="locked-icon"><ShieldAlert size={36} /></div>
              <h2>Access Restricted</h2>
              <p>Only new accounts with no existing membership can create an organization.</p>
              <p className="muted">As a member of an existing workspace, you can only join organizations you're invited to. Contact your admin if you need a workspace created.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

