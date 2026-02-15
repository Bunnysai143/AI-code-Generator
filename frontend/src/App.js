import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import PrivateRoute from './components/Common/PrivateRoute';
import Navbar from './components/Common/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Generator from './components/Generator/Generator';
import History from './components/History/History';
import HistoryDetail from './components/History/HistoryDetail';
import Favorites from './components/Favorites/Favorites';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Router>
            <div className="app">
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <>
                        <Navbar />
                        <main className="main-content">
                          <Generator />
                        </main>
                      </>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute>
                      <>
                        <Navbar />
                        <main className="main-content">
                          <History />
                        </main>
                      </>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history/:id"
                  element={
                    <PrivateRoute>
                      <>
                        <Navbar />
                        <main className="main-content">
                          <HistoryDetail />
                        </main>
                      </>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <PrivateRoute>
                      <>
                        <Navbar />
                        <main className="main-content">
                          <Favorites />
                        </main>
                      </>
                    </PrivateRoute>
                  }
                />
                
                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
