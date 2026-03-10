import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { favoritesAPI } from '../services/api';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const fetchingRef = useRef(false);

  const fetchFavorites = useCallback(async (force = false) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    
    // Prevent duplicate fetches
    if (fetchingRef.current && !force) {
      return;
    }
    
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data.favorites || []);
      setInitialized(true);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !initialized) {
      fetchFavorites();
    } else if (!token) {
      setLoading(false);
    }
  }, [fetchFavorites, initialized]);

  const addFavorite = async (generationId, title) => {
    try {
      const response = await favoritesAPI.addFavorite(generationId, title);
      setFavorites(prev => [response.data.favorite, ...prev]);
      return response.data.favorite;
    } catch (error) {
      throw error;
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await favoritesAPI.removeFavorite(favoriteId);
      setFavorites(prev => prev.filter(f => f._id !== favoriteId && f.favorite_id !== favoriteId));
    } catch (error) {
      throw error;
    }
  };

  const isFavorite = (generationId) => {
    return favorites.some(f => f.generation_id === generationId);
  };

  const getFavoriteByGenerationId = (generationId) => {
    return favorites.find(f => f.generation_id === generationId);
  };

  const value = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoriteByGenerationId,
    refreshFavorites: fetchFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
