import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesAPI, historyAPI } from '../../services/api';
import { useFavorites } from '../../context/FavoritesContext';
import Loading from '../Common/Loading';

const Favorites = () => {
  const { favorites, loading, removeFavorite, refreshFavorites } = useFavorites();
  const [expandedItem, setExpandedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  // Refresh favorites when component mounts
  useEffect(() => {
    refreshFavorites(true);
  }, [refreshFavorites]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRemoveFavorite = async (e, favoriteId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Remove this from favorites?')) {
      return;
    }

    try {
      await removeFavorite(favoriteId);
    } catch (err) {
      setError('Failed to remove favorite');
    }
  };

  const handleExpand = async (favorite) => {
    if (expandedItem === favorite._id || expandedItem === favorite.favorite_id) {
      setExpandedItem(null);
      return;
    }

    const favId = favorite._id || favorite.favorite_id;
    setExpandedItem(favId);

    if (!itemDetails[favorite.generation_id]) {
      try {
        const response = await historyAPI.getGeneration(favorite.generation_id);
        setItemDetails(prev => ({
          ...prev,
          [favorite.generation_id]: response.data.generation
        }));
      } catch (err) {
        console.error('Failed to fetch details:', err);
      }
    }
  };

  const handleEditTitle = (e, favorite) => {
    e.stopPropagation();
    setEditingTitle(favorite._id || favorite.favorite_id);
    setNewTitle(favorite.title || '');
  };

  const handleSaveTitle = async (e, favorite) => {
    e.stopPropagation();
    try {
      await favoritesAPI.updateFavorite(favorite._id || favorite.favorite_id, { title: newTitle });
      await refreshFavorites();
      setEditingTitle(null);
    } catch (err) {
      setError('Failed to update title');
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingTitle(null);
    setNewTitle('');
  };

  if (loading) {
    return <Loading message="Loading favorites..." />;
  }

  return (
    <div className="favorites-container">
      <div className="page-header">
        <h1 className="page-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Favorites
        </h1>
        <p className="page-subtitle">Your saved code snippets for quick access</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {favorites.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <h3>No Favorites Yet</h3>
            <p>Star your favorite code generations to save them here</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Generate Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="favorites-list">
          {favorites.map((favorite) => {
            const favId = favorite._id || favorite.favorite_id;
            const isExpanded = expandedItem === favId;
            const isEditing = editingTitle === favId;
            const details = itemDetails[favorite.generation_id];

            return (
              <div 
                key={favId} 
                className={`favorite-item ${isExpanded ? 'expanded' : ''}`}
                onClick={() => handleExpand(favorite)}
              >
                <div className="favorite-header">
                  <div className="favorite-info">
                    <span className="favorite-language">
                      {favorite.language?.toUpperCase() || 'CODE'}
                    </span>
                    {isEditing ? (
                      <div className="favorite-title-edit" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="form-input"
                          autoFocus
                        />
                        <button className="btn btn-primary btn-sm" onClick={(e) => handleSaveTitle(e, favorite)}>
                          Save
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="favorite-title">
                        {favorite.title || favorite.prompt_preview || 'Untitled'}
                      </h3>
                    )}
                  </div>
                  <div className="favorite-actions">
                    <span className="favorite-date">{formatDate(favorite.created_at)}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleEditTitle(e, favorite)}
                      title="Edit title"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <Link
                      to={`/history/${favorite.generation_id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleRemoveFavorite(e, favId)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {isExpanded && details && (
                  <div className="favorite-details">
                    <div className="favorite-prompt">
                      <strong>Prompt:</strong> {details.prompt}
                    </div>
                    <pre className="favorite-code-preview">
                      {details.generated_code?.slice(0, 500)}
                      {details.generated_code?.length > 500 ? '...' : ''}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
