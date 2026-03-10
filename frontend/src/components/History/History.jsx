import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { historyAPI } from '../../services/api';
import Loading from '../Common/Loading';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await historyAPI.getHistory(50, 0);
      setHistory(response.data.history);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this generation?')) {
      return;
    }

    try {
      await historyAPI.deleteGeneration(id);
      setHistory(history.filter((item) => item.generation_id !== id));
    } catch (err) {
      alert('Failed to delete generation');
    }
  };

  if (loading) {
    return <Loading message="Loading history..." />;
  }

  return (
    <div className="history-container">
      <div className="page-header">
        <h1 className="page-title">Generation History</h1>
        <p className="page-subtitle">View your previous code generations</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {history.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3>No History Yet</h3>
            <p>Generate some code and it will appear here</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Generate Code
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {history.map((item) => (
            <Link
              key={item._id}
              to={`/history/${item.generation_id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="history-item">
                <div className="history-header">
                  <span className="history-language">
                    {item.metadata?.language?.toUpperCase() || 'CODE'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="history-date">{formatDate(item.timestamp)}</span>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => handleDelete(e, item.generation_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="history-prompt">
                  {item.metadata?.prompt_preview || item.generation?.prompt?.slice(0, 100) || 'No preview available'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
