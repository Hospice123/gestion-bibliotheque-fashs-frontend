import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Utiliser les données stockées localement d'abord
          setUser(JSON.parse(storedUser));
          
          // Vérifier la validité du token en arrière-plan
          const response = await apiService.getProfile();
          if (response.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.error('Token invalide ou expiré:', error);
          apiService.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success) {
        const { user: userData } = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error.message);
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
    }
  };

  // Fonctions de gestion des rôles et informations utilisateur
  const hasRole = (role) => {
    if (!user) return false;
    
    // Normalisation des rôles pour gérer les variations
    const userRole = user.role?.toLowerCase();
    const targetRole = role?.toLowerCase();
    
    // Mapping des rôles pour compatibilité
    const roleMapping = {
      'admin': ['admin', 'administrateur'],
      'administrateur': ['admin', 'administrateur'],
      'bibliothecaire': ['bibliothecaire', 'librarian'],
      'emprunteur': ['emprunteur', 'etudiant', 'student', 'user'],
      'etudiant': ['emprunteur', 'etudiant', 'student', 'user']
    };
    
    const allowedRoles = roleMapping[targetRole] || [targetRole];
    return allowedRoles.includes(userRole);
  };

  const hasAnyRole = (roles) => {
    if (!user || !Array.isArray(roles)) return false;
    return roles.some(role => hasRole(role));
  };

  const getBorrowingInfo = () => {
    if (!user) return null;
    
    // Vérifier si l'utilisateur peut emprunter des livres
    if (hasRole('emprunteur') || hasRole('etudiant')) {
      return { 
        current: user.emprunts_actifs || user.current_loans || 0, 
        limit: user.limite_emprunts || user.loan_limit || 5, 
        unpaidFines: user.amendes_impayees || user.unpaid_fines || 0,
        canBorrow: (user.emprunts_actifs || 0) < (user.limite_emprunts || 5) && (user.amendes_impayees || 0) === 0
      };
    }
    return null;
  };

  // Fonction pour obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = () => {
    if (!user) return '';
    
    // Essayer différentes combinaisons de nom
    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.name) {
      return user.name;
    }
    if (user.nom) {
      return user.nom;
    }
    if (user.prenom) {
      return user.prenom;
    }
    
    // Fallback sur l'email
    return user.email || 'Utilisateur';
  };

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    if (displayName === 'Utilisateur') {
      return 'U';
    }
    
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName[0]?.toUpperCase() || 'U';
  };

  // Fonction pour obtenir le libellé du rôle
  const getRoleLabel = () => {
    if (!user?.role) return 'Utilisateur';
    
    const roleLabels = {
      'admin': 'Administrateur',
      'administrateur': 'Administrateur',
      'bibliothecaire': 'Bibliothécaire',
      'emprunteur': 'Emprunteur',
      'etudiant': 'Étudiant'
    };
    
    return roleLabels[user.role.toLowerCase()] || user.role;
  };

  // Fonction pour vérifier si l'utilisateur peut accéder à une fonctionnalité
  const canAccess = (feature) => {
    if (!user) return false;
    
    const permissions = {
      'dashboard': ['admin', 'administrateur', 'bibliothecaire', 'emprunteur', 'etudiant'],
      'books': ['admin', 'administrateur', 'bibliothecaire', 'emprunteur', 'etudiant'],
      'loans': ['admin', 'administrateur', 'bibliothecaire', 'emprunteur', 'etudiant'],
      'reservations': ['admin', 'administrateur', 'bibliothecaire', 'emprunteur', 'etudiant'],
      'users': ['admin', 'administrateur', 'bibliothecaire'],
      'statistics': ['admin', 'administrateur', 'bibliothecaire'],
      'settings': ['admin', 'administrateur'],
      'sanctions': ['admin', 'administrateur', 'bibliothecaire'],
      'manage_books': ['admin', 'administrateur', 'bibliothecaire'],
      'manage_users': ['admin', 'administrateur'],
      'manage_loans': ['admin', 'administrateur', 'bibliothecaire']
    };
    
    const allowedRoles = permissions[feature] || [];
    return hasAnyRole(allowedRoles);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    hasAnyRole,
    getBorrowingInfo,
    getUserDisplayName,
    getUserInitials,
    getRoleLabel,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};