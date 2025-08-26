import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BookCatalog from './components/BookCatalog';
import BorrowManagement from './components/BorrowManagement';
import ReservationManagement from './components/ReservationManagement';
import ProfileManagement from './components/ProfileManagement';
import UserManagement from './components/UserManagement';
import SanctionManagement from './components/SanctionManagement';
import Statistics from './components/Statistics';
import Administration from './components/Administration';
import NotificationManagement from './components/NotificationManagement';
import './App.css';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Composant pour rediriger les utilisateurs connectés
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Composant principal de l'application
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Routes principales */}
          <Route path="catalog" element={<BookCatalog />} />
          <Route path="borrows" element={<BorrowManagement />} />
          <Route path="reservations" element={<ReservationManagement />} />
          
          {/* Routes pour tous les utilisateurs connectés */}
          <Route path="search" element={<BookCatalog />} />
          <Route path="profile" element={<ProfileManagement />} />
          <Route path="notifications" element={<NotificationManagement>Notifications</NotificationManagement>} />
          
          {/* Routes pour les emprunteurs */}
          <Route path="my-borrows" element={<BorrowManagement />} />
          <Route path="my-reservations" element={<ReservationManagement />} />
          <Route path="my-sanctions" element={<SanctionManagement />} />
          
          {/* Routes pour les bibliothécaires et administrateurs */}
          <Route path="admin">
            <Route path="books" element={<BookCatalog />} />
            <Route path="borrows" element={<BorrowManagement />} />
            <Route path="reservations" element={<ReservationManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="sanctions" element={<SanctionManagement />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Administration />} />
          </Route>
        </Route>

        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
