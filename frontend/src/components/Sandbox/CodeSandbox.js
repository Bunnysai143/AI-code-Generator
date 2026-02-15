import React, { useState, useEffect, useCallback } from 'react';
import { executeAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'typescript'];

const CodeSandbox = ({ initialCode = '', language = 'python', onCodeChange }) => {
  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const isSupported = SUPPORTED_LANGUAGES.includes(language.toLowerCase());

  const runCode = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code to run');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setError('');
    setExecutionTime(null);

    const startTime = performance.now();

    try {
      const response = await executeAPI.execute(code, language, input);
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));

      if (response.data.success) {
        setOutput(response.data.output || '(No output)');
        if (response.data.error) {
          setError(response.data.error);
        }
      } else {
        setError(response.data.error || 'Execution failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute code. Server may be unavailable.');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, input]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
    setExecutionTime(null);
  };

  if (!isSupported) {
    return (
      <div className={`sandbox-container ${isDark ? 'dark' : ''}`}>
        <div className="sandbox-unsupported">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Execution Not Available</h3>
          <p>Code execution is currently supported for Python, JavaScript, and TypeScript only.</p>
          <p className="sandbox-language-tag">{language.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sandbox-container ${isDark ? 'dark' : ''}`}>
      <div className="sandbox-header">
        <div className="sandbox-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Code Sandbox
          <span className="sandbox-language-badge">{language.toUpperCase()}</span>
        </div>
        <div className="sandbox-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={clearOutput}
            disabled={isRunning}
          >
            Clear
          </button>
          <button 
            className="btn btn-primary btn-sm sandbox-run-btn"
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <span className="spinner-sm"></span>
                Running...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      <div className="sandbox-input-section">
        <label className="sandbox-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          Standard Input (stdin)
        </label>
        <textarea
          className="sandbox-stdin"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input for your program (optional)"
          rows={2}
        />
      </div>

      <div className="sandbox-output-section">
        <div className="sandbox-output-header">
          <span className="sandbox-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            Output
          </span>
          {executionTime && (
            <span className="sandbox-execution-time">
              Executed in {executionTime}ms
            </span>
          )}
        </div>
        
        <div className={`sandbox-output ${error ? 'has-error' : ''}`}>
          {isRunning ? (
            <div className="sandbox-running">
              <div className="spinner"></div>
              <span>Executing code...</span>
            </div>
          ) : (
            <>
              {output && (
                <pre className="sandbox-output-text">{output}</pre>
              )}
              {error && (
                <pre className="sandbox-error-text">{error}</pre>
              )}
              {!output && !error && (
                <div className="sandbox-empty">
                  <span>Run your code to see the output here</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSandbox;
