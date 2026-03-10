import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gistAPI } from '../../services/api';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // GitHub connection state
  const [githubStatus, setGithubStatus] = useState({ connected: false, github_username: null });
  const [showGithubDropdown, setShowGithubDropdown] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [githubError, setGithubError] = useState('');
  const dropdownRef = useRef(null);

  const fetchGithubStatus = useCallback(async () => {
    try {
      const res = await gistAPI.getStatus();
      setGithubStatus(res.data);
    } catch {
      // silently ignore – user just hasn't connected
    }
  }, []);

  useEffect(() => {
    fetchGithubStatus();
  }, [fetchGithubStatus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowGithubDropdown(false);
        setShowTokenInput(false);
        setGithubError('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) {
      setGithubError('Please enter your GitHub token');
      return;
    }
    setIsConnecting(true);
    setGithubError('');
    try {
      await gistAPI.connectGithub(githubToken);
      setGithubToken('');
      setShowTokenInput(false);
      await fetchGithubStatus();
    } catch (err) {
      setGithubError(err.response?.data?.error || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGithub = async () => {
    setIsDisconnecting(true);
    try {
      await gistAPI.disconnectGithub();
      setGithubStatus({ connected: false, github_username: null });
      setShowGithubDropdown(false);
    } catch {
      setGithubError('Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        AI Code Generator
      </Link>

      <div className="navbar-links">
        <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
          Generate
        </Link>
        <Link to="/history" className={`navbar-link ${isActive('/history') ? 'active' : ''}`}>
          History
        </Link>
        <Link to="/favorites" className={`navbar-link ${isActive('/favorites') ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Favorites
        </Link>
      </div>

      <div className="navbar-user">
        {/* GitHub Connection Widget */}
        <div className="github-widget" ref={dropdownRef}>
          <button
            className={`github-widget-btn ${githubStatus.connected ? 'connected' : ''}`}
            onClick={() => setShowGithubDropdown(!showGithubDropdown)}
            title={githubStatus.connected ? `GitHub: ${githubStatus.github_username}` : 'Connect GitHub'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {githubStatus.connected && (
              <span className="github-status-dot"></span>
            )}
          </button>

          {showGithubDropdown && (
            <div className="github-dropdown">
              {githubStatus.connected ? (
                <>
                  <div className="github-dropdown-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span className="github-connected-label">GitHub Connected</span>
                  </div>
                  <div className="github-dropdown-user">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <a
                      href={`https://github.com/${githubStatus.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-username-link"
                    >
                      {githubStatus.github_username}
                    </a>
                  </div>
                  <div className="github-dropdown-divider"></div>
                  <button
                    className="github-dropdown-action disconnect"
                    onClick={handleDisconnectGithub}
                    disabled={isDisconnecting}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect GitHub'}
                  </button>
                </>
              ) : (
                <>
                  <div className="github-dropdown-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>GitHub Not Connected</span>
                  </div>
                  <p className="github-dropdown-hint">
                    Connect your GitHub account to create Gists from generated code.
                  </p>

                  {!showTokenInput ? (
                    <button
                      className="github-dropdown-action connect"
                      onClick={() => setShowTokenInput(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                      Connect GitHub
                    </button>
                  ) : (
                    <div className="github-token-form">
                      <input
                        type="password"
                        className="github-token-input"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        onKeyDown={(e) => e.key === 'Enter' && handleConnectGithub()}
                        autoFocus
                      />
                      <div className="github-token-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setShowTokenInput(false); setGithubError(''); setGithubToken(''); }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={handleConnectGithub}
                          disabled={isConnecting || !githubToken.trim()}
                        >
                          {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=gist&description=AI+Code+Generator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-token-help"
                      >
                        Get a token (select "gist" scope)
                      </a>
                    </div>
                  )}

                  {githubError && (
                    <div className="github-dropdown-error">{githubError}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />
        <span>{user?.name || user?.email}</span>
        <button onClick={handleLogout} className="btn btn-outline">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
