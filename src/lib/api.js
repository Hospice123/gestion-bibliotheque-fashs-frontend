import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:8000/api';

// Configuration de l'instance Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000, // 10 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur de requête pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Gestion des erreurs de réseau
    if (!error.response) {
      console.error('Erreur de réseau:', error.message);
      throw new Error('Erreur de connexion au serveur');
    }
    
    // Retourner l'erreur avec un message approprié
    const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
    throw new Error(errorMessage);
  }
);

class ApiService {
  // === GESTION DU TOKEN ===
  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // === AUTHENTIFICATION ===
  async login({ email, password }) {
    console.log('Données envoyées à l\'API de connexion:', { email, password });

    const response = await apiClient.post('/auth/login', { email, password });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      this.removeToken();
    }
  }

  async getProfile() {
    return apiClient.get('/auth/me');
  }

  async updateProfile(data) {
    return apiClient.put('/auth/profile', data);
  }

  async changePassword(data) {
    return apiClient.put('/auth/password', data);
  }

  async checkToken() {
    return apiClient.get('/auth/check-token');
  }

  // === DASHBOARD ===
  async getDashboard() {
    return apiClient.get('/dashboard');
  }

  async getStatistics(params = {}) {
    return apiClient.get('/dashboard/statistics', { params });
  }

  // === LIVRES ===
  async getLivres(params = {}) {
    return apiClient.get('/livres', { params });
  }

  async getLivre(id) {
    return apiClient.get(`/livres/${id}`);
  }

  async searchLivres(query, filters = {}) {
    const params = { q: query, ...filters };
    return apiClient.get('/livres/search', { params });
  }

  async getLivresPopulaires() {
    return apiClient.get('/livres/populaires');
  }

  async getNouveautes() {
    return apiClient.get('/livres/nouveautes');
  }

  async getCategories() {
    return apiClient.get('/livres/categories');
  }

  async createLivre(data) {
    return apiClient.post('/livres', data);
  }

  async updateLivre(id, data) {
    return apiClient.put(`/livres/${id}`, data);
  }

  async deleteLivre(id) {
    return apiClient.delete(`/livres/${id}`);
  }

  // === EMPRUNTS ===
  async getEmprunts(params = {}) {
    return apiClient.get('/emprunts', { params });
  }

  async getEmprunt(id) {
    return apiClient.get(`/emprunts/${id}`);
  }

  async createEmprunt(data) {
    return apiClient.post('/emprunts', data);
  }

  async prolongerEmprunt(id, jours = 7) {
    return apiClient.put(`/emprunts/${id}/prolonger`, { jours });
  }

  async retournerLivre(id, notes = '') {
    return apiClient.put(`/emprunts/${id}/retourner`, { notes });
  }

  async marquerPerdu(id, notes = '') {
    return apiClient.put(`/emprunts/${id}/marquer-perdu`, { notes });
  }

  
  async getHistoriqueEmprunts(queryParams) {
    return apiClient.get('/emprunts/historique', { params: queryParams });
  }

  async getStatistiquesEmprunts() {
    return apiClient.get('/emprunts/statistiques');
  }

  // === RÉSERVATIONS ===
  async getReservations(params = {}) {
    return apiClient.get('/reservations', { params });
  }

  async getReservation(id) {
    return apiClient.get(`/reservations/${id}`);
  }

  async createReservation(data) {
    return apiClient.post('/reservations', data);
  }

  async annulerReservation(id) {
    return apiClient.put(`/reservations/${id}/annuler`);
  }

  async confirmerReservation(id) {
    return apiClient.put(`/reservations/${id}/confirmer`);
  }

  async expirerReservation(id) {
    return apiClient.put(`/reservations/${id}/expirer`);
  }

  // === SANCTIONS ===
  async getSanctions(params = {}) {
    return apiClient.get('/sanctions', { params });
  }

  async getMySanctions(params = {}) {
    return apiClient.get('/sanctions/my', { params });
  }

  async getSanction(id) {
    return apiClient.get(`/sanctions/${id}`);
  }

  async createSanction(data) {
    return apiClient.post('/sanctions', data);
  }

  async paySanction(id) {
    return apiClient.put(`/sanctions/${id}/pay`);
  }

  async cancelSanction(id) {
    return apiClient.put(`/sanctions/${id}/cancel`);
  }

  async prolongerSanction(id, jours, raison = '') {
    return apiClient.put(`/sanctions/${id}/prolonger`, { jours, raison });
  }

  async getStatistiquesSanctions() {
    return apiClient.get('/sanctions/statistiques');
  }

  // === NOTIFICATIONS ===
  async getNotifications(params = {}) {
    return apiClient.get('/notifications', { params });
  }

  async getNotificationsNonLues() {
    return apiClient.get('/notifications/non-lues');
  }

  async getNotification(id) {
    return apiClient.get(`/notifications/${id}`);
  }

  async marquerNotificationLue(id) {
    return apiClient.put(`/notifications/${id}/marquer-lue`);
  }

  async marquerToutesNotificationsLues() {
    return apiClient.put('/notifications/marquer-toutes-lues');
  }

  async deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
  }
  async deleteReadNotifications() {
    return apiClient.delete("/notifications/read");
  }

  // === UTILISATEURS (pour bibliothécaires/admins) ===
  async getUsers(params = {}) {
    return apiClient.get('/users', { params });
  }

  async getUser(id) {
    return apiClient.get(`/users/${id}`);
  }

  async searchUsers(query) {
    return apiClient.get('/users/search', { params: { q: query } });
  }
  // === PARAMÈTRES ===
  async getSettings() {
    return apiClient.get('/settings');
  }

  async updateSettings(category, data) {
    return apiClient.put(`/settings/${category}`, data);
  }

  async backupDatabase() {
    return apiClient.post('/administrateur/backup');
  }

  async clearCache() {
    return apiClient.post('/administrateur/clear-cache');
  }

  // MÉTHODE MISE À JOUR : Créer un utilisateur sans champ role (rôle par défaut = emprunteur)
  async createUser(data) {
    try {
      const response = await apiClient.post('/users', data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Utilisateur créé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  async updateUser(id, data) {
    try {
      const response = await apiClient.put(`/users/${id}`, data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Utilisateur modifié avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  async deleteUser(id) {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return {
        success: true,
        message: response.message || 'Utilisateur supprimé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur'
      };
    }
  }

  // MÉTHODE MISE À JOUR : Basculer le statut d'un utilisateur (actif/inactif) en utilisant la colonne 'statut'
  async toggleUserStatus(id, newStatus) {
    try {
      // Envoyer le nouveau statut ('actif' ou 'inactif') au lieu d'un booléen
      const response = await apiClient.put(`/users/${id}/toggle-status`, { statut: newStatus });
      return {
        success: true,
        data: response.data,
        message: response.message || 'Statut modifié avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du changement de statut'
      };
    }
  }

  // MÉTHODE MISE À JOUR : Modifier le rôle d'un utilisateur (administrateurs uniquement)
  async updateUserRole(userId, roleData) {
    try {
      const response = await apiClient.patch(`/users/${userId}/role`, roleData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Rôle modifié avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la modification du rôle',
        errors: error.response?.data?.errors || {}
      };
    }
  }

  // MÉTHODE MISE À JOUR : Récupérer les rôles disponibles (administrateurs uniquement)
  async getRoles() {
    try {
      const response = await apiClient.get('/roles');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des rôles'
      };
    }
  }

  // MÉTHODE MISE À JOUR : Récupérer les statistiques des utilisateurs
  async getUsersStats() {
    try {
      const response = await apiClient.get('/users-stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des statistiques'
      };
    }
  }

  // MÉTHODE DÉPRÉCIÉE : Remplacée par updateUserRole
  async changerRoleUser(id, role) {
    console.warn('changerRoleUser est déprécié, utilisez updateUserRole à la place');
    return this.updateUserRole(id, { role });
  }

  

  // === UTILITAIRES ===
  async testConnection() {
    return apiClient.get('/test');
  }

  // === MÉTHODES DE CACHE (pour optimiser les performances) ===
  
  // Cache simple pour les données qui changent peu
  _cache = new Map();
  _cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCachedData(key, fetchFunction) {
    const cached = this._cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this._cacheTimeout) {
      return cached.data;
    }
    
    try {
      const data = await fetchFunction();
      this._cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // Si erreur et cache disponible, retourner le cache
      if (cached) {
        console.warn('Utilisation du cache en raison d\'une erreur:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  // Méthodes avec cache pour les données statiques
  async getCategoriesWithCache() {
    return this.getCachedData('categories', () => this.getCategories());
  }

  async getStatistiquesWithCache() {
    return this.getCachedData('statistiques', () => this.getStatistics());
  }

  // MÉTHODE MISE À JOUR : Récupérer les rôles avec cache
  async getRolesWithCache() {
    return this.getCachedData('roles', () => this.getRoles());
  }

  // Nettoyer le cache
  clearcache() {
    this._cache.clear();
  }

  // === MÉTHODES BATCH (pour optimiser les requêtes multiples) ===
  
  async batchRequest(requests) {
    try {
      const promises = requests.map(request => {
        const { method, url, data, params } = request;
        return apiClient.request({ method, url, data, params });
      });
      
      return await Promise.allSettled(promises);
    } catch (error) {
      console.error('Erreur lors de la requête batch:', error);
      throw error;
    }
  }

  // === MÉTHODES DE PAGINATION OPTIMISÉES ===
  
  async getPaginatedData(endpoint, page = 1, limit = 10, filters = {}) {
    const params = {
      page,
      limit,
      ...filters
    };
    
    return apiClient.get(endpoint, { params });
  }

  // Méthodes paginées spécifiques
  async getLivresPaginated(page = 1, limit = 10, filters = {}) {
    return this.getPaginatedData('/livres', page, limit, filters);
  }

  async getEmpruntsPaginated(page = 1, limit = 10, filters = {}) {
    return this.getPaginatedData('/emprunts', page, limit, filters);
  }

  async getReservationsPaginated(page = 1, limit = 10, filters = {}) {
    return this.getPaginatedData('/reservations', page, limit, filters);
  }

  async getUsersPaginated(page = 1, limit = 10, filters = {}) {
    return this.getPaginatedData('/users', page, limit, filters);
  }

  // === MÉTHODES DE VALIDATION CÔTÉ CLIENT ===
  
  // Validation des données utilisateur avant envoi
  validateUserData(userData, isUpdate = false) {
    const errors = {};
    
    // Validation des champs obligatoires
    if (!userData.nom || userData.nom.trim() === '') {
      errors.nom = 'Le nom est obligatoire';
    }
    
    if (!userData.prenom || userData.prenom.trim() === '') {
      errors.prenom = 'Le prénom est obligatoire';
    }
    
    if (!userData.email || userData.email.trim() === '') {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    // Validation du mot de passe pour la création
    if (!isUpdate && (!userData.password || userData.password.length < 8)) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    // Validation de la confirmation du mot de passe
    if (userData.password && userData.password !== userData.password_confirmation) {
      errors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    
    // Validation du statut
    if (userData.statut && !['actif', 'inactif'].includes(userData.statut)) {
      errors.statut = 'Le statut doit être "actif" ou "inactif"';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // === MÉTHODES D'AIDE POUR L'INTERFACE ===
  
  // Formater les données utilisateur pour l'affichage
  formatUserForDisplay(user) {
    return {
      ...user,
      fullName: `${user.prenom} ${user.nom}`,
      role: user.roles?.[0]?.name || 'emprunteur',
      // Compatibilité : utiliser 'statut' en priorité, puis 'actif'
      statusLabel: this.getUserStatusLabel(user),
      isActive: this.isUserActive(user),
      createdAtFormatted: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'
    };
  }

  // Obtenir le libellé du statut d'un utilisateur
  getUserStatusLabel(user) {
    if (user.statut !== undefined) {
      return user.statut === 'actif' ? 'Actif' : 'Inactif';
    }
    return user.actif ? 'Actif' : 'Inactif';
  }

  // Vérifier si un utilisateur est actif
  isUserActive(user) {
    if (user.statut !== undefined) {
      return user.statut === 'actif';
    }
    return user.actif === true;
  }

  // Obtenir le badge de rôle pour l'affichage
  getRoleBadgeConfig(role) {
    const roleConfig = {
      'administrateur': { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
      'bibliothecaire': { label: 'Bibliothécaire', className: 'bg-blue-100 text-blue-800' },
      'emprunteur': { label: 'Emprunteur', className: 'bg-green-100 text-green-800' }
    };

    return roleConfig[role] || roleConfig['emprunteur'];
  }

  // Obtenir le badge de statut pour l'affichage
  getStatusBadgeConfig(user) {
    const isActive = this.isUserActive(user);
    return {
      label: isActive ? 'Actif' : 'Inactif',
      className: isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    };
  }

  // Vérifier les permissions utilisateur
  checkUserPermissions(user, requiredRoles) {
    if (!user || !user.roles) return false;
    
    const userRoles = user.roles.map(role => role.name);
    return requiredRoles.some(role => userRoles.includes(role));
  }

  // === MÉTHODES DE CONVERSION POUR LA COMPATIBILITÉ ===
  
  // Convertir les données utilisateur pour la compatibilité avec l'ancien format
  convertUserForCompatibility(user) {
    return {
      ...user,
      // Ajouter l'attribut 'actif' basé sur 'statut' pour la compatibilité
      actif: user.statut === 'actif'
    };
  }

  // Convertir les données de formulaire pour l'envoi à l'API
  convertFormDataForApi(formData) {
    const apiData = { ...formData };
    
    // S'assurer que le statut est correctement formaté
    if (apiData.statut === undefined && apiData.actif !== undefined) {
      apiData.statut = apiData.actif ? 'actif' : 'inactif';
      delete apiData.actif;
    }
    
    return apiData;
  }
}

// Instance singleton
const apiService = new ApiService();

// Export de l'instance et du client Axios pour usage avancé
export default apiService;
export { apiClient };

