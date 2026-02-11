import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { codeAPI } from '../../services/api';

// Helper function to parse markdown and render as JSX
const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  
  const parseInlineMarkdown = (line) => {
    // Parse bold text **text** or __text__
    const parts = [];
    let remaining = line;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      
      // Find the earliest match
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
    
    // Empty line
    if (!trimmedLine) {
      flushList();
      return;
    }
    
    // Heading detection (lines starting with - followed by **text:**)
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
    
    // Sub-heading or list items starting with *
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const content = trimmedLine.substring(2);
      listItems.push(
        <li key={listItems.length} style={{ marginBottom: '0.375rem', color: '#475569', lineHeight: 1.6 }}>
          {parseInlineMarkdown(content)}
        </li>
      );
      return;
    }
    
    // Numbered list items
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
    
    // Regular paragraph
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

const LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'csharp', name: 'C#' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'go', name: 'Go' },
  { id: 'php', name: 'PHP' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'rust', name: 'Rust' },
];

const MAX_PROMPT_LENGTH = 2000;

const Generator = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!prompt.trim()) {
      setError('Please enter a description of the code you want to generate.');
      return;
    }

    if (prompt.length < 10) {
      setError('Please provide more details (at least 10 characters).');
      return;
    }

    setLoading(true);
    setGeneratedCode('');
    setExplanation('');

    try {
      const response = await codeAPI.generate(prompt, language);
      setGeneratedCode(response.data.code);
      setExplanation(response.data.explanation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getCharCountClass = () => {
    if (prompt.length > MAX_PROMPT_LENGTH) return 'char-count error';
    if (prompt.length > MAX_PROMPT_LENGTH * 0.9) return 'char-count warning';
    return 'char-count';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Generate Code</h1>
        <p className="page-subtitle">
          Describe what you want to build and let AI generate the code with explanations
        </p>
      </div>

      <div className="generator-container">
        {/* Input Section */}
        <div className="input-section">
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="language">
                  Programming Language
                </label>
                <select
                  id="language"
                  className="form-input form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prompt">
                  Describe what you want to build
                </label>
                <textarea
                  id="prompt"
                  className="form-input form-textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a function that takes a list of numbers and returns the sum of all even numbers"
                  rows={6}
                  maxLength={MAX_PROMPT_LENGTH}
                />
                <div className={getCharCountClass()}>
                  {prompt.length} / {MAX_PROMPT_LENGTH}
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading || prompt.length > MAX_PROMPT_LENGTH}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, marginRight: 8 }}></span>
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </button>
            </form>
          </div>

          {/* Example prompts */}
          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#64748b' }}>
              Example Prompts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Create a function to check if a string is a palindrome',
                'Write a binary search algorithm',
                'Create a class for a linked list with insert and delete methods',
                'Write a function to merge two sorted arrays',
              ].map((example, index) => (
                <button
                  key={index}
                  className="btn btn-secondary"
                  style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="output-section">
          {loading && (
            <div className="card">
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: '#64748b' }}>
                  Generating code with AI...
                </p>
              </div>
            </div>
          )}

          {generatedCode && !loading && (
            <div className="code-output">
              <div className="code-header">
                <span className="code-language">
                  {LANGUAGES.find((l) => l.id === language)?.name || language}
                </span>
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
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="code-content">
                <SyntaxHighlighter
                  language={language === 'cpp' ? 'cpp' : language === 'csharp' ? 'csharp' : language}
                  style={oneDark}
                  customStyle={{
                    background: 'transparent',
                    padding: 0,
                    margin: 0,
                    fontSize: '0.875rem',
                  }}
                >
                  {generatedCode}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {explanation && !loading && (
            <div className="explanation-section">
              <h3 className="explanation-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Explanation
              </h3>
              <div className="explanation-content">{renderMarkdown(explanation)}</div>
            </div>
          )}

          {!generatedCode && !loading && (
            <div className="card">
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                <h3>Ready to Generate</h3>
                <p>Enter a description on the left and click "Generate Code" to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;
