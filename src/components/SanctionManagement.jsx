import React, { useState, useEffect, _useCallback } from 'react';
import { AlertTriangle, DollarSign, Calendar, User, CheckCircle, XCircle, Plus, Eye, Edit, Search, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';

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

const SanctionManagement = () => {
  const { user, hasAnyRole } = useAuth();
  const [sanctions, setSanctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState(null);
  const [errors, setErrors] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'amende',
    montant: '',
    raison: '',
    date_debut: '',
    date_fin: '',
    description: ''
  });

  const canManageSanctions = hasAnyRole(['administrateur', 'bibliothecaire']);
  const canViewSanctions = hasAnyRole(['administrateur', 'bibliothecaire']);
  const isStudent = user?.role === 'emprunteur';

  // Fonction pour gérer les erreurs
  const handleApiError = (error, defaultMessage = 'Une erreur est survenue') => {
    let errorMessages = [];
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.errors && typeof errorData.errors === 'object') {
        Object.values(errorData.errors).forEach(fieldErrors => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors);
          } else {
            errorMessages.push(fieldErrors);
          }
        });
      } else if (errorData.message) {
        errorMessages.push(errorData.message);
      } else if (errorData.error) {
        errorMessages.push(errorData.error);
      }
    }
    
    if (errorMessages.length === 0) {
      errorMessages.push(error.message || defaultMessage);
    }
    
    setErrors(errorMessages);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  // Debounce pour la recherche - SOLUTION AU PROBLÈME DE RECHARGEMENT
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 2000); // Délai de 2000ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Charger les sanctions seulement quand le terme de recherche debouncé change
  useEffect(() => {
    if (canViewSanctions || isStudent) {
      loadSanctions();
    }
  }, [currentPage, debouncedSearchTerm, selectedType, selectedStatus, canViewSanctions, isStudent]);

  // Charger les utilisateurs une seule fois
  useEffect(() => {
    if (canManageSanctions) {
      loadUsers();
    }
  }, [canManageSanctions]);

  const loadSanctions = async () => {
    try {
      setLoading(true);
      clearErrors();
      const params = {
        page: currentPage,
        per_page: 15
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedType) params.type = selectedType;
      if (selectedStatus) params.statut = selectedStatus;

      const response = isStudent 
        ? await apiService.getMySanctions(params)
        : await apiService.getSanctions(params);
        
      if (response.success) {
        setSanctions(Array.isArray(response.data.data) ? response.data.data : []);
        setTotalPages(response.data.last_page || 1);
      } else {
        console.error('Erreur API:', response.message);
        setSanctions([]);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des sanctions');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sanctions:', error);
      setSanctions([]);
      handleApiError(error, 'Erreur réseau lors du chargement des sanctions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers({ per_page: 100 });
      if (response.success) {
        setUsers(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      handleApiError(error, 'Erreur lors du chargement des utilisateurs');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleTypeFilter = (value) => {
    setSelectedType(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      type: 'amende',
      montant: '',
      raison: '',
      date_debut: '',
      date_fin: '',
      description: ''
    });
  };

  const handleAddSanction = async (e) => {
    e.preventDefault();
    clearErrors();
    try {
      const response = await apiService.createSanction(formData);
      if (response.success) {
        setShowAddDialog(false);
        resetForm();
        loadSanctions();
      } else {
        handleApiError({ response: { data: response } }, 'Erreur lors de la création de la sanction');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la sanction:', error);
      handleApiError(error, 'Erreur réseau lors de l\'ajout de la sanction');
    }
  };

  const handlePaySanction = async (sanctionId) => {
    if (window.confirm('Confirmer le paiement de cette sanction ?')) {
      clearErrors();
      setActionLoading(prev => ({ ...prev, [`pay_${sanctionId}`]: true }));
      try {
        const response = await apiService.paySanction(sanctionId);
        if (response.success) {
          loadSanctions();
        } else {
          handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du paiement');
        }
      } catch (error) {
        console.error('Erreur lors du paiement:', error);
        handleApiError(error, 'Erreur réseau lors du paiement');
      } finally {
        setActionLoading(prev => ({ ...prev, [`pay_${sanctionId}`]: false }));
      }
    }
  };

  const handleCancelSanction = async (sanctionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette sanction ?')) {
      clearErrors();
      setActionLoading(prev => ({ ...prev, [`cancel_${sanctionId}`]: true }));
      try {
        const response = await apiService.cancelSanction(sanctionId);
        if (response.success) {
          loadSanctions();
        } else {
          handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de l\'annulation');
        }
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        handleApiError(error, 'Erreur réseau lors de l\'annulation');
      } finally {
        setActionLoading(prev => ({ ...prev, [`cancel_${sanctionId}`]: false }));
      }
    }
  };

  const openDetailsDialog = (sanction) => {
    setSelectedSanction(sanction);
    setShowDetailsDialog(true);
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      'amende': { label: 'Amende', className: 'bg-red-100 text-red-800', icon: DollarSign },
      'suspension': { label: 'Suspension', className: 'bg-orange-100 text-orange-800', icon: XCircle },
      'avertissement': { label: 'Avertissement', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    };

    const config = typeConfig[type] || typeConfig['amende'];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'active': { label: 'Active', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'payee': { label: 'Payée', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'annulee': { label: 'Annulée', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      'expiree': { label: 'Expirée', className: 'bg-blue-100 text-blue-800', icon: Calendar }
    };

    const config = statusConfig[statut] || statusConfig['active'];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF" 
    }).format(amount);
  };

  if (!canViewSanctions && !isStudent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isStudent ? 'Mes Sanctions' : 'Gestion des Sanctions'}
          </h1>
          <p className="text-gray-600">
            {isStudent 
              ? 'Consultez vos sanctions et amendes'
              : 'Gérez les sanctions et amendes des utilisateurs'
            }
          </p>
        </div>
        {canManageSanctions && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Ajouter une sanction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle sanction</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle sanction pour un utilisateur.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSanction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user_id">Utilisateur *</Label>
                    <Select value={formData.user_id} onValueChange={(value) => handleFormChange('user_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((userItem) => (
                          <SelectItem key={userItem.id} value={userItem.id.toString()}>
                            {userItem.prenom} {userItem.nom} ({userItem.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amende">Amende</SelectItem>
                        <SelectItem value="suspension">Suspension</SelectItem>
                        <SelectItem value="avertissement">Avertissement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.type === 'amende' && (
                    <div>
                      <Label htmlFor="montant">Montant (FCFA) *</Label>
                      <Input
                        id="montant"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.montant}
                        onChange={(e) => handleFormChange('montant', e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="date_debut">Date de début *</Label>
                    <Input
                      id="date_debut"
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => handleFormChange('date_debut', e.target.value)}
                      required
                    />
                  </div>
                  {formData.type === 'suspension' && (
                    <div>
                      <Label htmlFor="date_fin">Date de fin</Label>
                      <Input
                        id="date_fin"
                        type="date"
                        value={formData.date_fin}
                        onChange={(e) => handleFormChange('date_fin', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="raison">Raison *</Label>
                  <Input
                    id="raison"
                    value={formData.raison}
                    onChange={(e) => handleFormChange('raison', e.target.value)}
                    placeholder="Ex: Retard de livre, Dégradation..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Détails supplémentaires..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button type="submit">Créer la sanction</Button>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder={isStudent ? "Rechercher dans vos sanctions..." : "Rechercher par utilisateur, raison..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 pr-3 py-2 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select onValueChange={handleTypeFilter} value={selectedType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="amende">Amende</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="avertissement">Avertissement</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={handleStatusFilter} value={selectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                  <SelectItem value="expiree">Expirée</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Liste des sanctions - Améliorée pour la responsivité */}
      {sanctions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isStudent ? 'Aucune sanction' : 'Aucune sanction trouvée'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedType || selectedStatus
                ? 'Aucune sanction ne correspond à vos critères de recherche.'
                : isStudent 
                  ? 'Vous n\'avez aucune sanction active.'
                  : 'Aucune sanction enregistrée pour le moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sanctions.map((sanction) => (
            <Card key={sanction.id} className={`${sanction.statut === 'active' ? 'border-red-200 bg-red-50/30' : ''} flex flex-col`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{sanction.raison}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {getTypeBadge(sanction.type)}
                    {getStatusBadge(sanction.statut)}
                  </div>
                </div>
                <CardDescription className="flex flex-col gap-2 mt-2">
                  {!isStudent && sanction.user && (
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{sanction.user.prenom} {sanction.user.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Créée le {formatDate(sanction.date_debut)}</span>
                  </div>
                  {sanction.type === 'amende' && sanction.montant && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-red-600">{formatCurrency(sanction.montant)}</span>
                    </div>
                  )}
                  {sanction.date_fin && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Expire le {formatDate(sanction.date_fin)}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                {sanction.description && (
                  <p className="text-sm text-gray-600 mb-4">{sanction.description}</p>
                )}
                
                {/* Boutons d'action - Améliorés pour la responsivité */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDetailsDialog(sanction)}
                    className="flex-1 min-w-0"
                  >
                    <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Détails</span>
                  </Button>
                  
                  {sanction.statut === 'active' && (
                    <>
                      {sanction.type === 'amende' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handlePaySanction(sanction.id)}
                          className="flex-1 min-w-0 bg-green-600 hover:bg-green-700"
                          disabled={actionLoading[`pay_${sanction.id}`]}
                        >
                          {actionLoading[`pay_${sanction.id}`] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          )}
                          <span className="truncate">Payer</span>
                        </Button>
                      )}
                      {canManageSanctions && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelSanction(sanction.id)}
                          className="flex-1 min-w-0"
                          disabled={actionLoading[`cancel_${sanction.id}`]}
                        >
                          {actionLoading[`cancel_${sanction.id}`] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          ) : (
                            <XCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          )}
                          <span className="truncate">Annuler</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <span className="text-gray-700">Page {currentPage} sur {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog de détails - Amélioré */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Détails de la sanction
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Informations complètes sur cette sanction
            </DialogDescription>
          </DialogHeader>
          {selectedSanction && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-gray-900">Raison</Label>
                  <p className="text-gray-700 mt-1">{selectedSanction.raison}</p>
                </div>
                {!isStudent && selectedSanction.user && (
                  <div>
                    <Label className="font-semibold text-gray-900">Utilisateur</Label>
                    <div className="mt-1">
                      <p className="text-gray-700">{selectedSanction.user.prenom} {selectedSanction.user.nom}</p>
                      <p className="text-sm text-gray-500">{selectedSanction.user.email}</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="font-semibold text-gray-900">Type</Label>
                  <div className="mt-1">
                    {getTypeBadge(selectedSanction.type)}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold text-gray-900">Statut</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSanction.statut)}
                  </div>
                </div>
                {selectedSanction.type === 'amende' && selectedSanction.montant && (
                  <div>
                    <Label className="font-semibold text-gray-900">Montant</Label>
                    <p className="text-gray-700 mt-1 font-semibold text-lg">{formatCurrency(selectedSanction.montant)}</p>
                  </div>
                )}
                <div>
                  <Label className="font-semibold text-gray-900">Date de début</Label>
                  <p className="text-gray-700 mt-1">{formatDate(selectedSanction.date_debut)}</p>
                </div>
                {selectedSanction.date_fin && (
                  <div>
                    <Label className="font-semibold text-gray-900">Date de fin</Label>
                    <p className="text-gray-700 mt-1">{formatDate(selectedSanction.date_fin)}</p>
                  </div>
                )}
                {selectedSanction.date_paiement && (
                  <div>
                    <Label className="font-semibold text-gray-900">Date de paiement</Label>
                    <p className="text-gray-700 mt-1">{formatDate(selectedSanction.date_paiement)}</p>
                  </div>
                )}
                {selectedSanction.created_at && (
                  <div>
                    <Label className="font-semibold text-gray-900">Date de création</Label>
                    <p className="text-gray-700 mt-1">{formatDate(selectedSanction.created_at)}</p>
                  </div>
                )}
              </div>
              {selectedSanction.description && (
                <div>
                  <Label className="font-semibold text-gray-900">Description</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-700">{selectedSanction.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SanctionManagement;

