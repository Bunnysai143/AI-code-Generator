import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { historyAPI } from '../../services/api';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import Loading from '../Common/Loading';
import CodeSandbox from '../Sandbox/CodeSandbox';
import ConversationalRefinement from '../Refinement/ConversationalRefinement';
import GistIntegration from '../Gist/GistIntegration';

// Helper function to parse markdown and render as JSX
const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  
  const parseInlineMarkdown = (line) => {
    const parts = [];
    let remaining = line;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      
      let firstMatch = null;
      let matchType = null;
      
      if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index)) {
        firstMatch = boldMatch;
        matchType = 'bold';
      } else if (codeMatch) {
        firstMatch = codeMatch;
        matchType = 'code';
      }
      
      if (firstMatch) {
        if (firstMatch.index > 0) {
          parts.push(remaining.substring(0, firstMatch.index));
        }
        if (matchType === 'bold') {
          parts.push(<strong key={key++} style={{ fontWeight: 600, color: '#1e293b' }}>{firstMatch[1] || firstMatch[2]}</strong>);
        } else {
          parts.push(<code key={key++} style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875em', color: '#e11d48' }}>{firstMatch[1]}</code>);
        }
        remaining = remaining.substring(firstMatch.index + firstMatch[0].length);
      } else {
        parts.push(remaining);
        remaining = '';
      }
    }
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  };
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      flushList();
      return;
    }
    
    if (trimmedLine.startsWith('- **') && trimmedLine.includes(':**')) {
      flushList();
      const headingMatch = trimmedLine.match(/^-\s*\*\*(.+?):\*\*\s*(.*)/);
      if (headingMatch) {
        elements.push(
          <div key={elements.length} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
              {headingMatch[1]}:
            </h4>
            {headingMatch[2] && <p style={{ margin: 0, color: '#475569' }}>{parseInlineMarkdown(headingMatch[2])}</p>}
          </div>
        );
        return;
      }
    }
    
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const content = trimmedLine.substring(2);
      listItems.push(
        <li key={listItems.length} style={{ marginBottom: '0.375rem', color: '#475569', lineHeight: 1.6 }}>
          {parseInlineMarkdown(content)}
        </li>
      );
      return;
    }
    
    if (/^\d+\.\s/.test(trimmedLine)) {
      flushList();
      const content = trimmedLine.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={elements.length} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <p style={{ margin: 0, color: '#374151', fontWeight: 500 }}>{parseInlineMarkdown(content)}</p>
        </div>
      );
      return;
    }
    
    flushList();
    elements.push(
      <p key={elements.length} style={{ margin: '0.5rem 0', color: '#475569', lineHeight: 1.7 }}>
        {parseInlineMarkdown(trimmedLine)}
      </p>
    );
  });
  
  flushList();
  return elements;
};

const HistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generation, setGeneration] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showGist, setShowGist] = useState(false);
  
  const { isDark } = useTheme();
  const { addFavorite, removeFavorite, isFavorite, getFavoriteByGenerationId } = useFavorites();

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        const response = await historyAPI.getGeneration(id);
        setGeneration(response.data.generation);
      } catch (err) {
        setError('Failed to load generation details');
      } finally {
        setLoading(false);
      }
    };
    fetchGeneration();
  }, [id]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (generation) {
      setCurrentCode(generation.generated_code);
    }
  }, [generation]);

  const handleCodeUpdate = (newCode) => {
    setCurrentCode(newCode);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite(id)) {
        const favorite = getFavoriteByGenerationId(id);
        if (favorite) {
          await removeFavorite(favorite._id || favorite.favorite_id);
        }
      } else {
        await addFavorite(id, generation.prompt?.substring(0, 100));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const currentIsFavorite = isFavorite(id);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this generation?')) {
      return;
    }

    try {
      await historyAPI.deleteGeneration(id);
      navigate('/history');
    } catch (err) {
      alert('Failed to delete generation');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Loading message="Loading generation details..." />;
  }

  if (error || !generation) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'Generation not found'}</div>
        <Link to="/history" className="btn btn-secondary">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark-mode' : ''}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/history" style={{ color: '#4f46e5', textDecoration: 'none' }}>
          ← Back to History
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <span className="history-language" style={{ marginRight: '1rem' }}>
              {generation.language?.toUpperCase()}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {formatDate(generation.created_at)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${currentIsFavorite ? 'btn-warning' : 'btn-secondary'}`}
              onClick={handleFavoriteToggle}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={currentIsFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              {currentIsFavorite ? 'Saved' : 'Save'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
        
        <h2 style={{ fontSize: '1rem', fontWeight: 500, color: isDark ? '#e2e8f0' : '#374151', marginBottom: '0.5rem' }}>
          Prompt:
        </h2>
        <p style={{ color: isDark ? '#94a3b8' : '#4b5563', whiteSpace: 'pre-wrap' }}>{generation.prompt}</p>
      </div>

      {/* Action Toolbar */}
      <div className="action-toolbar" style={{ marginBottom: '1rem' }}>
        <div className="toolbar-group">
          <button 
            className={`toolbar-btn ${showSandbox ? 'active' : ''}`}
            onClick={() => setShowSandbox(!showSandbox)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Run
          </button>
          <button 
            className={`toolbar-btn ${showRefinement ? 'active' : ''}`}
            onClick={() => setShowRefinement(!showRefinement)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Refine
          </button>
          <button 
            className={`toolbar-btn ${showGist ? 'active' : ''}`}
            onClick={() => setShowGist(!showGist)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            Gist
          </button>
        </div>
        <button className="toolbar-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div className="code-output" style={{ marginBottom: '1.5rem' }}>
        <div className="code-header">
          <span className="code-language">{generation.language}</span>
        </div>
        <div className="code-content">
          <SyntaxHighlighter
            language={generation.language === 'cpp' ? 'cpp' : generation.language}
            style={oneDark}
            customStyle={{
              background: 'transparent',
              padding: 0,
              margin: 0,
              fontSize: '0.875rem',
            }}
          >
            {currentCode}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Sandbox Panel */}
      {showSandbox && (
        <div className="sandbox-panel" style={{ marginBottom: '1.5rem' }}>
          <CodeSandbox
            initialCode={currentCode}
            language={generation.language}
            onCodeChange={setCurrentCode}
          />
        </div>
      )}

      {/* Refinement Panel */}
      {showRefinement && (
        <div className="refinement-panel" style={{ marginBottom: '1.5rem' }}>
          <ConversationalRefinement
            generationId={id}
            initialCode={currentCode}
            language={generation.language}
            onCodeUpdate={handleCodeUpdate}
            onClose={() => setShowRefinement(false)}
          />
        </div>
      )}

      {/* Gist Panel */}
      {showGist && (
        <div className="gist-panel" style={{ marginBottom: '1.5rem' }}>
          <GistIntegration
            code={currentCode}
            language={generation.language}
            description={generation.prompt}
            onClose={() => setShowGist(false)}
          />
        </div>
      )}

      {generation.explanation && (
        <div className="explanation-section">
          <h3 className="explanation-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Explanation
          </h3>
          <div className="explanation-content">{renderMarkdown(generation.explanation)}</div>
        </div>
      )}
    </div>
  );
};

export default HistoryDetail;
