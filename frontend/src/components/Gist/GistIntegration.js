import React, { useState, useEffect } from 'react';
import { gistAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGE_EXTENSIONS = {
  'python': '.py',
  'javascript': '.js',
  'typescript': '.ts',
  'java': '.java',
  'cpp': '.cpp',
  'c': '.c',
  'csharp': '.cs',
  'ruby': '.rb',
  'go': '.go',
  'php': '.php',
  'swift': '.swift',
  'kotlin': '.kt',
  'rust': '.rs'
};

const GistIntegration = ({ code, language, description = '', onSuccess, onClose }) => {
  const [gistDescription, setGistDescription] = useState(description);
  const [filename, setFilename] = useState(`code${LANGUAGE_EXTENSIONS[language] || '.txt'}`);
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdGist, setCreatedGist] = useState(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { isDark } = useTheme();

  // Check if we need to show connection form based on error
  useEffect(() => {
    if (error && (error.includes('GitHub not connected') || error.includes('connect your GitHub'))) {
      setShowConnectForm(true);
    }
  }, [error]);

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) {
      setError('Please enter your GitHub Personal Access Token');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      await gistAPI.connectGithub(githubToken);
      setShowConnectForm(false);
      setGithubToken('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect GitHub. Please check your token.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateGist = async () => {
    if (!code.trim()) {
      setError('No code to create gist from');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await gistAPI.createGist(code, language, gistDescription, isPublic);
      setCreatedGist(response.data.gist);
      if (onSuccess) {
        onSuccess(response.data.gist);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create gist.';
      setError(errorMsg);
      // Check if it's a connection error
      if (errorMsg.includes('GitHub not connected') || errorMsg.includes('connect your GitHub')) {
        setShowConnectForm(true);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (createdGist?.html_url) {
      await navigator.clipboard.writeText(createdGist.html_url);
    }
  };

  // Success state after creating gist
  if (createdGist) {
    return (
      <div className={`gist-container ${isDark ? 'dark' : ''}`}>
        <div className="gist-header">
          <div className="gist-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Gist Created Successfully!
          </div>
          {onClose && (
            <button className="gist-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="gist-success">
          <div className="gist-info">
            <label>Gist URL:</label>
            <div className="gist-url-container">
              <input 
                type="text" 
                value={createdGist.html_url} 
                readOnly 
                className="gist-url-input"
              />
              <button className="btn btn-secondary" onClick={handleCopyUrl}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </button>
            </div>
          </div>

          <div className="gist-actions">
            <a 
              href={createdGist.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              View on GitHub
            </a>
            {onClose && (
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GitHub Connection Form
  if (showConnectForm) {
    return (
      <div className={`gist-container ${isDark ? 'dark' : ''}`}>
        <div className="gist-header">
          <div className="gist-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            Connect GitHub Account
          </div>
          {onClose && (
            <button className="gist-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="github-connect-form">
          <div className="connect-info">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <h3>Connect Your GitHub Account</h3>
            <p>To create gists, you need to connect your GitHub account using a Personal Access Token.</p>
          </div>

          <div className="connect-instructions">
            <h4>How to get a Personal Access Token:</h4>
            <ol>
              <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Settings → Tokens</a></li>
              <li>Click "Generate new token (classic)"</li>
              <li>Give it a name (e.g., "AI Code Generator")</li>
              <li>Select the <strong>"gist"</strong> scope</li>
              <li>Click "Generate token" and copy it</li>
            </ol>
          </div>

          <div className="form-group">
            <label className="form-label">GitHub Personal Access Token</label>
            <input
              type="password"
              className="form-input"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              autoComplete="off"
            />
            <p className="token-hint">Your token is stored securely and only used for creating gists.</p>
          </div>

          {error && !error.includes('GitHub not connected') && (
            <div className="alert alert-error">{error}</div>
          )}

          <div className="gist-form-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowConnectForm(false)}
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleConnectGithub}
              disabled={isConnecting || !githubToken.trim()}
            >
              {isConnecting ? (
                <>
                  <span className="spinner-sm"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  Connect GitHub
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Gist Creation Form
  return (
    <div className={`gist-container ${isDark ? 'dark' : ''}`}>
      <div className="gist-header">
        <div className="gist-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          Create GitHub Gist
        </div>
        {onClose && (
          <button className="gist-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="gist-form">
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <input
            type="text"
            className="form-input"
            value={gistDescription}
            onChange={(e) => setGistDescription(e.target.value)}
            placeholder="What does this code do?"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Filename</label>
          <input
            type="text"
            className="form-input"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="code.py"
          />
        </div>

        <div className="gist-visibility">
          <label className="gist-checkbox-label">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="checkmark"></span>
            Make this gist public
          </label>
          <p className="gist-visibility-hint">
            {isPublic 
              ? 'Anyone can find and view this gist' 
              : 'Only people with the link can view this gist'}
          </p>
        </div>

        <div className="gist-preview">
          <label className="form-label">Code Preview</label>
          <pre className="gist-code-preview">
            {code.slice(0, 300)}{code.length > 300 ? '...' : ''}
          </pre>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            {(error.includes('GitHub not connected') || error.includes('connect your GitHub')) && (
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setShowConnectForm(true)}
                style={{ marginLeft: '1rem' }}
              >
                Connect Now
              </button>
            )}
          </div>
        )}

        <div className="gist-form-actions">
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose} disabled={isCreating}>
              Cancel
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={handleCreateGist}
            disabled={isCreating || !code.trim()}
          >
            {isCreating ? (
              <>
                <span className="spinner-sm"></span>
                Creating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                Create Gist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GistIntegration;
