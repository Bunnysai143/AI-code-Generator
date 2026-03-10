import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { codeAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import CodeEditor from '../Editor/CodeEditor';
import CodeSandbox from '../Sandbox/CodeSandbox';
import ConversationalRefinement from '../Refinement/ConversationalRefinement';
import GistIntegration from '../Gist/GistIntegration';

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

// Helper function to parse markdown and render as JSX
const renderMarkdown = (text, isDark) => {
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
          parts.push(<strong key={key++} style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>{firstMatch[1] || firstMatch[2]}</strong>);
        } else {
          parts.push(<code key={key++} style={{ background: isDark ? '#374151' : '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875em', color: isDark ? '#f472b6' : '#e11d48' }}>{firstMatch[1]}</code>);
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
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.25rem' }}>
              {headingMatch[1]}:
            </h4>
            {headingMatch[2] && <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#475569' }}>{parseInlineMarkdown(headingMatch[2])}</p>}
          </div>
        );
        return;
      }
    }
    
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const content = trimmedLine.substring(2);
      listItems.push(
        <li key={listItems.length} style={{ marginBottom: '0.375rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.6 }}>
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
          <p style={{ margin: 0, color: isDark ? '#d1d5db' : '#374151', fontWeight: 500 }}>{parseInlineMarkdown(content)}</p>
        </div>
      );
      return;
    }
    
    flushList();
    elements.push(
      <p key={elements.length} style={{ margin: '0.5rem 0', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.7 }}>
        {parseInlineMarkdown(trimmedLine)}
      </p>
    );
  });
  
  flushList();
  return elements;
};

const Generator = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [generatedCode, setGeneratedCode] = useState('');
  const [editableCode, setEditableCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  
  // Feature panels
  const [showEditor, setShowEditor] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showGist, setShowGist] = useState(false);
  
  const { isDark } = useTheme();
  const { addFavorite, removeFavorite, isFavorite, getFavoriteByGenerationId } = useFavorites();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    setEditableCode(generatedCode);
  }, [generatedCode]);

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
    setEditableCode('');
    setExplanation('');
    setGenerationId(null);
    setShowEditor(false);
    setShowSandbox(false);
    setShowRefinement(false);
    setShowGist(false);

    try {
      const response = await codeAPI.generate(prompt, language);
      setGeneratedCode(response.data.code);
      setEditableCode(response.data.code);
      setExplanation(response.data.explanation);
      setGenerationId(response.data.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableCode);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!generationId) return;
    
    try {
      if (isFavorite(generationId)) {
        const favorite = getFavoriteByGenerationId(generationId);
        if (favorite) {
          await removeFavorite(favorite._id || favorite.favorite_id);
        }
      } else {
        await addFavorite(generationId, prompt.substring(0, 100));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleCodeUpdate = (newCode, explanation) => {
    setEditableCode(newCode);
    setGeneratedCode(newCode);
  };

  const getCharCountClass = () => {
    if (prompt.length > MAX_PROMPT_LENGTH) return 'char-count error';
    if (prompt.length > MAX_PROMPT_LENGTH * 0.9) return 'char-count warning';
    return 'char-count';
  };

  const currentIsFavorite = generationId && isFavorite(generationId);

  return (
    <div className={isDark ? 'dark-mode' : ''}>
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
                  maxLength={MAX_PROMPT_LENGTH + 100}
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
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Generate Code
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Example prompts */}
          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>
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
                  className="btn btn-secondary example-btn"
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
                <p style={{ marginTop: '1rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Generating code with AI...
                </p>
              </div>
            </div>
          )}

          {generatedCode && !loading && (
            <>
              {/* Action Toolbar */}
              <div className="action-toolbar">
                <div className="toolbar-group">
                  <button 
                    className={`toolbar-btn ${showEditor ? 'active' : ''}`}
                    onClick={() => setShowEditor(!showEditor)}
                    title="Edit Code"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button 
                    className={`toolbar-btn ${showSandbox ? 'active' : ''}`}
                    onClick={() => setShowSandbox(!showSandbox)}
                    title="Run Code"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Run
                  </button>
                  <button 
                    className={`toolbar-btn ${showRefinement ? 'active' : ''}`}
                    onClick={() => setShowRefinement(!showRefinement)}
                    title="Refine Code"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Refine
                  </button>
                  <button 
                    className={`toolbar-btn ${showGist ? 'active' : ''}`}
                    onClick={() => setShowGist(!showGist)}
                    title="Create Gist"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                    Gist
                  </button>
                </div>
                <div className="toolbar-group">
                  <button 
                    className={`toolbar-btn favorite-btn ${currentIsFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteToggle}
                    title={currentIsFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={currentIsFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {currentIsFavorite ? 'Saved' : 'Save'}
                  </button>
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
              </div>

              {/* Code Display or Editor */}
              {showEditor ? (
                <div className="editor-panel">
                  <div className="panel-header">
                    <span>Code Editor</span>
                    <button className="panel-close" onClick={() => setShowEditor(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <CodeEditor
                    code={editableCode}
                    onChange={setEditableCode}
                    language={language}
                    height="400px"
                    showMinimap={true}
                  />
                </div>
              ) : (
                <div className="code-output">
                  <div className="code-header">
                    <span className="code-language">
                      {LANGUAGES.find((l) => l.id === language)?.name || language}
                    </span>
                  </div>
                  <div className="code-content">
                    <SyntaxHighlighter
                      language={language === 'cpp' ? 'cpp' : language === 'csharp' ? 'csharp' : language}
                      style={isDark ? oneDark : oneDark}
                      customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '0.875rem',
                      }}
                    >
                      {editableCode}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}

              {/* Code Sandbox Panel */}
              {showSandbox && (
                <div className="sandbox-panel">
                  <CodeSandbox
                    initialCode={editableCode}
                    language={language}
                    onCodeChange={setEditableCode}
                  />
                </div>
              )}

              {/* Conversational Refinement Panel */}
              {showRefinement && (
                <div className="refinement-panel">
                  <ConversationalRefinement
                    generationId={generationId}
                    initialCode={editableCode}
                    language={language}
                    onCodeUpdate={handleCodeUpdate}
                    onClose={() => setShowRefinement(false)}
                  />
                </div>
              )}

              {/* Gist Integration Panel */}
              {showGist && (
                <div className="gist-panel">
                  <GistIntegration
                    code={editableCode}
                    language={language}
                    description={prompt}
                    onClose={() => setShowGist(false)}
                  />
                </div>
              )}

              {/* Explanation Section */}
              {explanation && (
                <div className="explanation-section">
                  <h3 className="explanation-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Explanation
                  </h3>
                  <div className="explanation-content">{renderMarkdown(explanation, isDark)}</div>
                </div>
              )}
            </>
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
