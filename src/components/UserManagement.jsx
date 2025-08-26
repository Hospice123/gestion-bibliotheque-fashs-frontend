import React, { useState, useEffect, _useCallback } from 'react';
import { User, Mail, Calendar, Shield, Edit, Trash2, Plus, Eye, UserCheck, Settings, Search as SearchIcon, Filter, Phone, Home, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { toast } from 'sonner';

// Composant pour le panneau d'erreur
const ErrorPanel = ({ errors, onClose }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-red-200 bg-red-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800 text-lg">Erreur</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded border border-red-200">
                {typeof error === 'string' ? error : error.message || 'Une erreur est survenue'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UserManagement = () => {
  const { hasAnyRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [_isEditing, setIsEditing] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    numero_etudiant: '',
    statut: 'actif'
  });

  const canManageUsers = hasAnyRole(['administrateur']);
  const canViewUsers = hasAnyRole(['administrateur', 'bibliothecaire']);
  const canManageRoles = hasAnyRole(['administrateur']);

  // Fonction pour gérer les erreurs
  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    let errorMessages = [];
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Gestion des erreurs de validation (format Laravel)
      if (errorData.errors && typeof errorData.errors === 'object') {
        Object.values(errorData.errors).forEach(fieldErrors => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors);
          } else {
            errorMessages.push(fieldErrors);
          }
        });
      }
      // Gestion des messages d'erreur simples
      else if (errorData.message) {
        errorMessages.push(errorData.message);
      }
      // Gestion des erreurs avec format personnalisé
      else if (errorData.error) {
        errorMessages.push(errorData.error);
      }
    }
    
    // Si aucune erreur spécifique n'est trouvée, utiliser le message par défaut
    if (errorMessages.length === 0) {
      errorMessages.push(error.message || defaultMessage);
    }
    
    setErrors(errorMessages);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  // Debounce pour la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 2000);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Charger les utilisateurs quand les dépendances changent
  useEffect(() => {
    if (canViewUsers) {
      loadUsers();
    }
  }, [currentPage, debouncedSearchTerm, selectedRole, selectedStatus, canViewUsers]);

  // Charger les rôles disponibles une seule fois
  useEffect(() => {
    if (canManageRoles) {
      loadAvailableRoles();
    }
  }, [canManageRoles]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      clearErrors();
      const params = {
        page: currentPage,
        per_page: 15
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.statut = selectedStatus; 

      const response = await apiService.getUsers(params);
      if (response.success) {
        setUsers(Array.isArray(response.data.data) ? response.data.data : []);
        setTotalPages(response.data.last_page || 1);
      } else {
        console.error('Erreur API:', response.message);
        setUsers([]);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
      handleApiError(error, 'Erreur réseau lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    try {
      const response = await apiService.getRoles();
      if (response.success) {
        setAvailableRoles(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      handleApiError(error, 'Erreur lors du chargement des rôles');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRoleFilter = (value) => {
    setSelectedRole(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    
    if (name === 'statut') {
      newValue = value; 
    } else if (type === 'checkbox') {
      newValue = checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      password_confirmation: '',
      telephone: '',
      adresse: '',
      date_naissance: '',
      numero_etudiant: '',
      statut: 'actif' 
    });
    setIsEditing(false);
  };

  const validatePasswords = () => {
    if (formData.password && formData.password !== formData.password_confirmation) {
      handleApiError({ response: { data: { message: 'Les mots de passe ne correspondent pas.' } } });
      return false;
    }
    
    if (formData.password && formData.password.length < 8) {
      handleApiError({ response: { data: { message: 'Le mot de passe doit contenir au moins 8 caractères.' } } });
      return false;
    }
    
    return true;
  };

  const validateRequiredFields = () => {
    const requiredFields = ['nom', 'prenom', 'email'];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      handleApiError({ response: { data: { message: `Champs obligatoires manquants: ${missingFields.join(', ')}` } } });
      return false;
    }

    return true;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    clearErrors();
    
    if (!validateRequiredFields()) {
      return;
    }
    
    if (!validatePasswords()) {
      return;
    }

    if (!formData.password) {
      handleApiError({ response: { data: { message: 'Le mot de passe est obligatoire pour un nouvel utilisateur.' } } });
      return;
    }

    try {
      const response = await apiService.createUser(formData);
      if (response.success) {
        toast.success('Utilisateur créé avec succès avec le rôle par défaut "emprunteur"');
        setShowAddDialog(false);
        resetForm();
        loadUsers();
      } else {
        handleApiError({ response: { data: response } }, 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      handleApiError(error, 'Erreur réseau lors de l\'ajout de l\'utilisateur');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    clearErrors();
    
    if (!validateRequiredFields()) {
      return;
    }
    
    if (formData.password && !validatePasswords()) {
      return;
    }

    try {
      const dataToUpdate = { ...formData };
      
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
        delete dataToUpdate.password_confirmation;
      }
      
      const response = await apiService.updateUser(selectedUser.id, dataToUpdate);
      if (response.success) {
        toast.success('Utilisateur modifié avec succès');
        setShowEditDialog(false);
        setSelectedUser(null);
        resetForm();
        loadUsers();
      } else {
        handleApiError({ response: { data: response } }, 'Erreur lors de la modification de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
      handleApiError(error, 'Erreur réseau lors de la modification de l\'utilisateur');
    }
  };

  const handleUpdateRole = async (newRole) => {
    setRoleLoading(true);
    clearErrors();
    try {
      const response = await apiService.updateUserRole(selectedUser.id, { role: newRole });
      if (response.success) {
        toast.success(`Rôle modifié avec succès : ${newRole}`);
        setShowRoleDialog(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la modification du rôle');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      handleApiError(error, 'Erreur réseau lors de la modification du rôle');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      clearErrors();
      setActionLoading(prev => ({ ...prev, [`delete_${userId}`]: true }));
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          toast.success('Utilisateur supprimé avec succès');
          loadUsers();
        } else {
          handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        handleApiError(error, 'Erreur réseau lors de la suppression');
      } finally {
        setActionLoading(prev => ({ ...prev, [`delete_${userId}`]: false }));
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: true }));
    try {
      const newStatus = currentStatus === 'actif' ? 'inactif' : 'actif';
      
      const response = await apiService.toggleUserStatus(userId, newStatus);
      if (response.success) {
        toast.success(`Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`);
        loadUsers();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      handleApiError(error, 'Erreur réseau lors du changement de statut');
    } finally {
      setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: false }));
    }
  };

  const openEditDialog = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsEditing(true);
    setFormData({
      nom: userToEdit.nom || '',
      prenom: userToEdit.prenom || '',
      email: userToEdit.email || '',
      password: '',
      password_confirmation: '',
      telephone: userToEdit.telephone || '',
      adresse: userToEdit.adresse || '',
      date_naissance: userToEdit.date_naissance || '',
      numero_etudiant: userToEdit.numero_etudiant || '',
      statut: userToEdit.statut || 'actif' 
    });
    setShowEditDialog(true);
  };

  const openDetailsDialog = (userToView) => {
    setSelectedUser(userToView);
    setShowDetailsDialog(true);
  };

  const openRoleDialog = (userToEdit) => {
    setSelectedUser(userToEdit);
    setShowRoleDialog(true);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'administrateur': { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
      'bibliothecaire': { label: 'Bibliothécaire', className: 'bg-blue-100 text-blue-800' },
      'emprunteur': { label: 'Emprunteur', className: 'bg-green-100 text-green-800' }
    };

    const config = roleConfig[role] || roleConfig['emprunteur'];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (statut) => {
    const isActive = statut === 'actif' || statut === true;
    
    return (
      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
        {isActive ? 'Actif' : 'Inactif'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getUserStatus = (user) => {
    if (user.statut !== undefined) {
      return user.statut;
    }
    return user.actif ? 'actif' : 'inactif';
  };

  const getUserRole = (user) => {
    // Gestion de différents formats de rôles
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0].nom || user.roles[0].name || 'emprunteur';
    }
    if (user.role) {
      return user.role;
    }
    return 'emprunteur';
  };

  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès non autorisé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panneau d'erreur */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Gérez les comptes utilisateurs de la bibliothèque</p>
          <p className="text-sm text-blue-600 mt-1">
            ℹ️ Les nouveaux utilisateurs sont automatiquement créés avec le rôle "Emprunteur"
          </p>
        </div>
        {canManageUsers && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau compte utilisateur. Le rôle "Emprunteur" sera automatiquement assigné.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className={!formData.nom ? 'border-red-300' : ''}
                    />
                    {!formData.nom && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      className={!formData.prenom ? 'border-red-300' : ''}
                    />
                    {!formData.prenom && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={!formData.email ? 'border-red-300' : ''}
                    />
                    {!formData.email && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={!formData.password ? 'border-red-300' : ''}
                    />
                    {!formData.password && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
                  </div>
                  <div>
                    <Label htmlFor="password_confirmation">Confirmer mot de passe *</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      className={!formData.password_confirmation ? 'border-red-300' : ''}
                    />
                    {!formData.password_confirmation && <p className="text-xs text-red-500 mt-1">Ce champ est obligatoire</p>}
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="date_naissance">Date de naissance</Label>
                    <Input id="date_naissance" name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="numero_etudiant">Numéro étudiant</Label>
                    <Input id="numero_etudiant" name="numero_etudiant" value={formData.numero_etudiant} onChange={handleChange} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter l'utilisateur</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtres et recherche - Améliorés pour la responsivité */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email, numéro étudiant..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 pr-3 py-2 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select onValueChange={handleRoleFilter} value={selectedRole}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="administrateur">Administrateur</SelectItem>
                  <SelectItem value="bibliothecaire">Bibliothécaire</SelectItem>
                  <SelectItem value="emprunteur">Emprunteur</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={handleStatusFilter} value={selectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Settings className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Liste des utilisateurs - Version responsive avec cartes */}
      {users.length === 0 ? (
        <div className="text-center py-10">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">Aucun utilisateur trouvé</p>
          <p className="text-gray-400">Essayez d'ajuster vos filtres ou d'ajouter un nouvel utilisateur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((userItem) => (
            <Card key={userItem.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{userItem.nom} {userItem.prenom}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {getRoleBadge(getUserRole(userItem))}
                    {getStatusBadge(getUserStatus(userItem))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{userItem.email}</span>
                </div>
                {userItem.telephone && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{userItem.telephone}</span>
                  </div>
                )}
                {userItem.date_naissance && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(userItem.date_naissance)}</span>
                  </div>
                )}
                {userItem.numero_etudiant && (
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">N° Étudiant: {userItem.numero_etudiant}</span>
                  </div>
                )}
                {userItem.adresse && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{userItem.adresse}</span>
                  </div>
                )}
              </CardContent>
              
              {/* Boutons d'action - Améliorés pour la responsivité */}
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDetailsDialog(userItem)}
                    className="flex-1 min-w-0"
                  >
                    <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Détails</span>
                  </Button>
                  
                  {canManageUsers && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(userItem)}
                      className="flex-1 min-w-0"
                    >
                      <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Modifier</span>
                    </Button>
                  )}
                  
                  {canManageRoles && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openRoleDialog(userItem)}
                      className="flex-1 min-w-0"
                    >
                      <Shield className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">Rôle</span>
                    </Button>
                  )}
                </div>
                
                {canManageUsers && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteUser(userItem.id)} 
                      className="flex-1 min-w-0 text-red-600 hover:text-red-700"
                      disabled={actionLoading[`delete_${userItem.id}`]}
                    >
                      {actionLoading[`delete_${userItem.id}`] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate">Supprimer</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleUserStatus(userItem.id, getUserStatus(userItem))}
                      className="flex-1 min-w-0"
                      disabled={actionLoading[`toggle_${userItem.id}`]}
                    >
                      {actionLoading[`toggle_${userItem.id}`] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                      ) : (
                        <UserCheck className="h-4 w-4 mr-1 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {getUserStatus(userItem) === 'actif' ? 'Désactiver' : 'Activer'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Précédent
          </Button>
          <span className="text-gray-700">Page {currentPage} sur {totalPages}</span>
          <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Suivant
          </Button>
        </div>
      )}

      {/* Dialogues */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l'utilisateur.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Laisser vide pour ne pas changer" />
              </div>
              <div>
                <Label htmlFor="password_confirmation">Confirmer nouveau mot de passe</Label>
                <Input id="password_confirmation" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" name="adresse" value={formData.adresse} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input id="date_naissance" name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="numero_etudiant">Numéro étudiant</Label>
                <Input id="numero_etudiant" name="numero_etudiant" value={formData.numero_etudiant} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select onValueChange={(value) => handleChange({ target: { name: 'statut', value } })} value={formData.statut}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Mettre à jour</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Détails de l'utilisateur
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Informations complètes sur {selectedUser?.nom} {selectedUser?.prenom}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-gray-900">Nom complet:</div>
                  <div className="text-gray-700">{selectedUser.nom} {selectedUser.prenom}</div>
                </div>

                <div>
                  <div className="font-semibold text-gray-900">Email:</div>
                  <div className="text-gray-700 break-all">{selectedUser.email}</div>
                </div>

                <div>
                  <div className="font-semibold text-gray-900">Rôle:</div>
                  <div>{getRoleBadge(getUserRole(selectedUser))}</div>
                </div>

                <div>
                  <div className="font-semibold text-gray-900">Statut:</div>
                  <div>{getStatusBadge(getUserStatus(selectedUser))}</div>
                </div>

                {selectedUser.telephone && (
                  <div>
                    <div className="font-semibold text-gray-900">Téléphone:</div>
                    <div className="text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedUser.telephone}
                    </div>
                  </div>
                )}
                
                {selectedUser.adresse && (
                  <div>
                    <div className="font-semibold text-gray-900">Adresse:</div>
                    <div className="text-gray-700 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {selectedUser.adresse}
                    </div>
                  </div>
                )}
                
                {selectedUser.date_naissance && (
                  <div>
                    <div className="font-semibold text-gray-900">Date de naissance:</div>
                    <div className="text-gray-700">{formatDate(selectedUser.date_naissance)}</div>
                  </div>
                )}
                
                {selectedUser.numero_etudiant && (
                  <div>
                    <div className="font-semibold text-gray-900">Numéro étudiant:</div>
                    <div className="text-gray-700">{selectedUser.numero_etudiant}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de gestion des rôles - Complètement refondu et fonctionnel */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Gestion des rôles utilisateur
            </DialogTitle>
            <DialogDescription>
              Modifiez le rôle de {selectedUser?.nom} {selectedUser?.prenom}.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* Informations utilisateur */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Utilisateur sélectionné</h4>
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedUser.nom} {selectedUser.prenom}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Rôle actuel */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold text-gray-900">Rôle actuel</Label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      {getRoleBadge(getUserRole(selectedUser))}
                    </div>
                  </div>
                </div>

                {/* Sélection du nouveau rôle */}
                <div>
                  <Label className="text-base font-semibold text-gray-900">Nouveau rôle</Label>
                  <div className="mt-2 space-y-2">
                    {availableRoles.length > 0 ? (
                      availableRoles.map((role) => (
                        <Button
                          key={role.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleUpdateRole(role.nom || role.name)}
                          disabled={roleLoading}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {getRoleBadge(role.nom || role.name)}
                        </Button>
                      ))
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleUpdateRole('administrateur')}
                          disabled={roleLoading}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {getRoleBadge('administrateur')}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleUpdateRole('bibliothecaire')}
                          disabled={roleLoading}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {getRoleBadge('bibliothecaire')}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleUpdateRole('emprunteur')}
                          disabled={roleLoading}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {getRoleBadge('emprunteur')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations sur les rôles */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h5 className="font-medium text-yellow-800 mb-2">Informations sur les rôles</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>Administrateur:</strong> Accès complet à toutes les fonctionnalités</li>
                    <li>• <strong>Bibliothécaire:</strong> Gestion des livres et des emprunts</li>
                    <li>• <strong>Emprunteur:</strong> Consultation et emprunt de livres uniquement</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={roleLoading}>
                Annuler
              </Button>
            </DialogClose>
            {roleLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Modification en cours...
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

