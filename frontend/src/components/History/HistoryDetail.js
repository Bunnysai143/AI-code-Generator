import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { historyAPI } from '../../services/api';
import Loading from '../Common/Loading';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGeneration();
  }, [id]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generation.generated_code);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
    <div>
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
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
        
        <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
          Prompt:
        </h2>
        <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>{generation.prompt}</p>
      </div>

      <div className="code-output" style={{ marginBottom: '1.5rem' }}>
        <div className="code-header">
          <span className="code-language">{generation.language}</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Code
              </>
            )}
          </button>
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
            {generation.generated_code}
          </SyntaxHighlighter>
        </div>
      </div>

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
