import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Home from './pages/Home';
import MapScreen from './pages/MapScreen';
import MonumentProfile from './pages/MonumentProfile';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navigation from './components/Navigation';

// Protected Route Wrapper
const ProtectedRoute = ({ children, hideNav = false }: { children: React.ReactNode, hideNav?: boolean }) => {
  const { user, isGuest, loading } = useAuth();

  React.useEffect(() => {
    // A simplified system theme and user theme handler
    // If we had a robust settings provider, this would be there
    // Since AuthContext holds user data partially, we might need a separate listener or just read from local storage / body class
    // We'll trust setting theme applies `.dark` correctly if we had a ThemeProvider.
    // For now, let's keep it simple: if dark mode isn't fully implemented in classes, we simulate it or prepare the wrapper
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-white">
        <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      {!hideNav && <Navigation />}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="font-sans text-nile-blue antialiased" dir="rtl">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              
              <Route path="/map" element={
                <ProtectedRoute>
                  <MapScreen />
                </ProtectedRoute>
              } />
              
              <Route path="/monument/:id" element={
                <ProtectedRoute>
                  <MonumentProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute hideNav={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
