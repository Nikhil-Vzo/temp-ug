import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Building2, UserPlus } from 'lucide-react';
import { api } from '../services/api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientReady, setGoogleClientReady] = useState(false);
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.googleLogin(response.credential);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/orgs');
    } catch (err) {
      setError(err.message || 'Google Sign-Up failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let checkInterval;
    let isMounted = true;

    const initGoogleAuth = async () => {
      try {
        const config = await api.getConfig();
        if (!isMounted) return;

        const clientId = config?.data?.googleClientId;
        
        if (clientId && clientId !== 'mock') {
          const initializeGSI = () => {
            if (typeof window !== 'undefined' && window.google?.accounts?.id) {
              const buttonEl = document.getElementById('google-signup-button');
              if (!buttonEl) return;

              try {
                window.google.accounts.id.initialize({
                  client_id: clientId,
                  callback: handleGoogleCredentialResponse,
                });
                window.google.accounts.id.renderButton(
                  buttonEl,
                  { theme: 'outline', size: 'large', width: '340' }
                );
                if (isMounted) {
                  setGoogleClientReady(true);
                }
                if (checkInterval) {
                  clearInterval(checkInterval);
                  checkInterval = null;
                }
              } catch (err) {
                console.warn('Google GSI button rendering failed:', err);
              }
            }
          };

          // Try immediately if already loaded, otherwise poll
          if (typeof window !== 'undefined' && window.google?.accounts?.id) {
            initializeGSI();
          } else {
            checkInterval = setInterval(initializeGSI, 500);
          }
        }
      } catch (err) {
        console.warn('Failed to load Google Auth configuration:', err);
      }
    };

    initGoogleAuth();
    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.register(email, password, orgName);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/orgs');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={36} />
          </div>
          <h2>Join CampusOS</h2>
          <p>Create your developer or student account today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@campusos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="orgName">Create Organization (Optional)</label>
            <div className="input-with-icon">
              <Building2 size={18} className="input-icon" />
              <input
                id="orgName"
                type="text"
                placeholder="Acme Academy"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <p className="help-text">Leave blank to join existing workspaces later</p>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-separator">
          <span>or</span>
        </div>

        <div className="google-auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div id="google-signup-button" style={{ display: googleClientReady ? 'block' : 'none', margin: '0 auto' }}></div>
        </div>

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          Already have an account? <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}
