import React, { useState, useRef, useEffect } from 'react';
import { codeAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ConversationalRefinement = ({ 
  generationId, 
  initialCode, 
  language,
  onCodeUpdate,
  onClose 
}) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'How would you like me to modify or improve this code? You can ask me to:\n- Add new features\n- Fix bugs or issues\n- Optimize performance\n- Add error handling\n- Add comments or documentation\n- Refactor for better readability'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState(initialCode);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { isDark } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await codeAPI.refine(generationId, userMessage, conversationHistory);
      
      const { code, explanation, changes } = response.data;
      
      // Build assistant response
      let assistantContent = '';
      
      if (changes && changes.length > 0) {
        assistantContent += '**Changes made:**\n';
        changes.forEach((change, i) => {
          assistantContent += `${i + 1}. ${change}\n`;
        });
        assistantContent += '\n';
      }
      
      if (explanation) {
        assistantContent += explanation;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantContent || 'I\'ve updated the code based on your request.',
        hasCodeUpdate: true
      }]);

      // Update the code
      setCurrentCode(code);
      if (onCodeUpdate) {
        onCodeUpdate(code, explanation);
      }

    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.response?.data?.error || 'Failed to refine code. Please try again.'}`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown parsing for bold and lists
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold text
      let formattedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      
      // Check if it's a list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        formattedLine = `<li>${formattedLine.replace(/^[\s]*[-*]\s*/, '')}</li>`;
      } else if (/^\d+\.\s/.test(line.trim())) {
        formattedLine = `<li>${formattedLine.replace(/^\d+\.\s*/, '')}</li>`;
      }
      
      return <span key={idx} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const suggestions = [
    'Add error handling',
    'Add comments',
    'Optimize performance',
    'Add input validation',
    'Make it more readable'
  ];

  return (
    <div className={`refinement-container ${isDark ? 'dark' : ''}`}>
      <div className="refinement-header">
        <div className="refinement-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Refine Code
        </div>
        {onClose && (
          <button className="refinement-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      <div className="refinement-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`refinement-message ${message.role} ${message.isError ? 'error' : ''} ${message.hasCodeUpdate ? 'has-update' : ''}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              )}
            </div>
            <div className="message-content">
              {formatMessage(message.content)}
              {message.hasCodeUpdate && (
                <div className="code-updated-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Code updated
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="refinement-message assistant loading">
            <div className="message-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="refinement-suggestions">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => setInput(suggestion)}
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className="refinement-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="refinement-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe how you want to modify the code..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="btn btn-primary refinement-send"
          disabled={!input.trim() || isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ConversationalRefinement;
