import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';

const CodeEditor = ({ 
  code, 
  onChange, 
  language = 'javascript',
  readOnly = false,
  height = '400px',
  showMinimap = true
}) => {
  const editorRef = useRef(null);
  const { isDark } = useTheme();

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: showMinimap },
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      renderLineHighlight: 'all',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      }
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Trigger save action (can be customized)
      console.log('Save triggered');
    });
  };

  const getLanguageId = (lang) => {
    const languageMap = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'ruby': 'ruby',
      'go': 'go',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'rust': 'rust',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'sql': 'sql',
      'shell': 'shell',
      'bash': 'shell'
    };
    return languageMap[lang?.toLowerCase()] || 'plaintext';
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly: readOnly
      });
    }
  }, [readOnly]);

  return (
    <div className="code-editor-container">
      <Editor
        height={height}
        language={getLanguageId(language)}
        value={code}
        onChange={onChange}
        theme={isDark ? 'vs-dark' : 'light'}
        onMount={handleEditorDidMount}
        options={{
          readOnly: readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        loading={
          <div className="editor-loading">
            <div className="spinner"></div>
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
