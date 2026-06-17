import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, LogOut } from 'lucide-react';
import { api } from '../services/api';

export default function Organizations() {
  const [orgs, setOrgs] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await api.getMyOrgs();
      setOrgs(res.data.organizations || []);
    } catch (err) {
      setError('Failed to load organizations. Please log in again.');
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate slug
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
      const res = await api.createOrg(name, slug);
      setName('');
      setSlug('');
      // Refresh organizations
      await fetchOrgs();
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectOrg = (org) => {
    // Store current organization details in localStorage
    localStorage.setItem('activeOrg', JSON.stringify(org));
    navigate(`/org/${org.slug}/dashboard`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeOrg');
    navigate('/login');
  };

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
                <p>Get started by creating a new workspace on the right.</p>
              </div>
            ) : (
              orgs.map((org) => (
                <div key={org._id} className="org-card" onClick={() => handleSelectOrg(org)}>
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
        </section>
      </div>
    </div>
  );
}
