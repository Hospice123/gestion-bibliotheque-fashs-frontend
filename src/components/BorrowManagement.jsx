import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, BookOpen, User, AlertTriangle, CheckCircle, RotateCcw, XCircle, Filter, X, History, Search, Download, Eye, BarChart3, TrendingUp, Users, DollarSign, Shield, UserCheck, Gavel } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../lib/api';
import { toast } from 'sonner';
import UserProfileViewer from './UserProfileViewer';

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

// Composant pour les statistiques des emprunts
const BorrowStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

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

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const response = await apiService.getStatistiquesEmprunts();
      
      if (response.success) {
        // Adapter la structure de données reçue du backend
        const stats = response.data?.statistiques || response.data || {};
        setStatistics(stats);
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      handleApiError(error, 'Erreur réseau lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucune statistique disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panneau d'erreur */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      
      {/* Statistiques principales - Adaptées à la structure backend exacte */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emprunts actifs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.emprunts_actifs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.emprunts_en_retard || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.emprunts_aujourd_hui || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Retours aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.retours_aujourd_hui || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.emprunts_ce_mois || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Amendes actives</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.amendes_actives || 0}  FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Résumé des activités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emprunts actifs</p>
                    <p className="text-sm text-gray-600">Livres actuellement empruntés</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {statistics.emprunts_actifs || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emprunts en retard</p>
                    <p className="text-sm text-gray-600">Nécessitent une attention</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {statistics.emprunts_en_retard || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emprunts ce mois</p>
                    <p className="text-sm text-gray-600">Activité mensuelle</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {statistics.emprunts_ce_mois || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité quotidienne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emprunts aujourd'hui</p>
                    <p className="text-sm text-gray-600">Nouveaux emprunts</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {statistics.emprunts_aujourd_hui || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Retours aujourd'hui</p>
                    <p className="text-sm text-gray-600">Livres retournés</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {statistics.retours_aujourd_hui || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Amendes actives</p>
                    <p className="text-sm text-gray-600">Montant total</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {statistics.amendes_actives || 0}  FCFA
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Composant pour l'historique des emprunts (RESTAURÉ pour les bibliothécaires)
const BorrowHistory = ({ isLibrarian, user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [errors, setErrors] = useState([]);

  // États pour la gestion des profils
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUser, _setSelectedUser] = useState(null);

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

  const loadHistory = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const params = {
        page: currentPage,
        per_page: 10
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.statut = statusFilter;
      if (dateFilter !== 'all') params.date_filter = dateFilter;

      let response;
      if (isLibrarian) {
        // Pour les bibliothécaires, récupérer l'historique complet
        response = await apiService.getHistoriqueEmprunts(null, params);
      } else {
        // Pour les utilisateurs, récupérer leur historique personnel
        response = await apiService.getHistoriqueEmprunts(user?.id, params);
      }

      if (response.success) {
        const fetchedHistory = response.data?.emprunts || [];
        const pagination = response.data?.pagination || {};
        
        setHistory(Array.isArray(fetchedHistory) ? fetchedHistory : []);
        setTotalPages(pagination.last_page || 1);
        setTotalItems(pagination.total || 0);
      } else {
        setHistory([]);
        setTotalPages(1);
        setTotalItems(0);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement de l\'historique');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setHistory([]);
      setTotalPages(1);
      setTotalItems(0);
      handleApiError(error, 'Erreur réseau lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, dateFilter, isLibrarian, user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadHistory();
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const openDetailsDialog = (borrow) => {
    setSelectedBorrow(borrow);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'en_cours': { label: 'En cours', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'en_retard': { label: 'En retard', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'retourne': { label: 'Retourné', variant: 'secondary', className: 'bg-green-100 text-green-800' },
      'perdu': { label: 'Perdu', variant: 'destructive', className: 'bg-orange-100 text-orange-800' },
      'prolonge': { label: 'Prolongé', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || statusConfig['en_cours'];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panneau d'erreur */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      
      {/* Interface de recherche et filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Titre, auteur, emprunteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={handleStatusFilter} value={statusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="retourne">Retourné</SelectItem>
                <SelectItem value="perdu">Perdu</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={handleDateFilter} value={dateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="last_week">Dernière semaine</SelectItem>
                <SelectItem value="last_month">Dernier mois</SelectItem>
                <SelectItem value="last_3_months">3 derniers mois</SelectItem>
                <SelectItem value="last_year">Dernière année</SelectItem>
              </SelectContent>
            </Select>
            
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </form>
      </div>

      {/* Résultats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {totalItems} emprunt{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste de l'historique */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique trouvé</h3>
            <p className="text-gray-600">
              {isLibrarian 
                ? 'Aucun emprunt ne correspond aux critères de recherche.'
                : 'Vous n\'avez aucun historique d\'emprunt.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {history.map((borrow) => (
            <Card key={borrow.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{borrow.livre?.titre}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {getStatusBadge(borrow.statut)}
                    {/* Badge avec nom de l'emprunteur */}
                    {isLibrarian && borrow.user && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        👤 {borrow.user.prenom} {borrow.user.nom}
                      </Badge>
                    )}
                    {borrow.nombre_prolongations > 0 && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {borrow.nombre_prolongations} prolongation{borrow.nombre_prolongations > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex flex-col gap-2 mt-2">
                  <span>par {borrow.livre?.auteur}</span>
                  {/* Informations emprunteur plus visibles */}
                  {isLibrarian && borrow.user && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                      <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-blue-900">
                          {borrow.user.prenom} {borrow.user.nom}
                        </p>
                        <p className="text-xs text-blue-600">{borrow.user.email}</p>
                      </div>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Date d'emprunt</p>
                      <p className="text-sm text-gray-600">{formatDate(borrow.date_emprunt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Date de retour prévue</p>
                      <p className="text-sm text-gray-600">{formatDate(borrow.date_retour_prevue)}</p>
                    </div>
                  </div>
                  {borrow.date_retour_effective && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Date de retour effective</p>
                        <p className="text-sm text-gray-600">{formatDate(borrow.date_retour_effective)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {borrow.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{borrow.notes}</p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsDialog(borrow)}
                    className="flex-1 min-w-0"
                  >
                    <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Détails</span>
                  </Button>
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
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <span className="text-gray-700">Page {currentPage} sur {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog des détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'emprunt</DialogTitle>
            <DialogDescription>
              Informations complètes sur cet emprunt
            </DialogDescription>
          </DialogHeader>
          {selectedBorrow && (
            <div className="space-y-6">
              {/* Informations du livre */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Informations du livre</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Titre</p>
                    <p className="text-gray-900">{selectedBorrow.livre?.titre}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Auteur</p>
                    <p className="text-gray-900">{selectedBorrow.livre?.auteur}</p>
                  </div>
                  {selectedBorrow.livre?.isbn && (
                    <div>
                      <p className="font-medium text-gray-700">ISBN</p>
                      <p className="text-gray-900">{selectedBorrow.livre.isbn}</p>
                    </div>
                  )}
                  {selectedBorrow.livre?.editeur && (
                    <div>
                      <p className="font-medium text-gray-700">Éditeur</p>
                      <p className="text-gray-900">{selectedBorrow.livre.editeur}</p>
                    </div>
                  )}
                  {selectedBorrow.livre?.annee_publication && (
                    <div>
                      <p className="font-medium text-gray-700">Année</p>
                      <p className="text-gray-900">{selectedBorrow.livre.annee_publication}</p>
                    </div>
                  )}
                  {selectedBorrow.livre?.categorie?.nom && (
                    <div>
                      <p className="font-medium text-gray-700">Catégorie</p>
                      <p className="text-gray-900">{selectedBorrow.livre.categorie.nom}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations de l'emprunt */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Informations de l'emprunt</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Date d'emprunt</p>
                    <p className="text-gray-900">{formatDate(selectedBorrow.date_emprunt)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Date de retour prévue</p>
                    <p className="text-gray-900">{formatDate(selectedBorrow.date_retour_prevue)}</p>
                  </div>
                  {selectedBorrow.date_retour_effective && (
                    <div>
                      <p className="font-medium text-gray-700">Date de retour effective</p>
                      <p className="text-gray-900">{formatDate(selectedBorrow.date_retour_effective)}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-700">Statut</p>
                    <div className="mt-1">{getStatusBadge(selectedBorrow.statut)}</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Prolongations</p>
                    <p className="text-gray-900">{selectedBorrow.nombre_prolongations || 0}</p>
                  </div>
                </div>
              </div>

              {/* Informations de l'emprunteur (pour les bibliothécaires) */}
              {isLibrarian && selectedBorrow.user && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Informations de l'emprunteur</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Nom complet</p>
                      <p className="text-gray-900">{selectedBorrow.user.prenom} {selectedBorrow.user.nom}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{selectedBorrow.user.email}</p>
                    </div>
                    {selectedBorrow.user.role && (
                      <div>
                        <p className="font-medium text-gray-700">Rôle</p>
                        <p className="text-gray-900">{selectedBorrow.user.role}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBorrow.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedBorrow.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fermer
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour le profil de l'emprunteur */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profil de l'emprunteur</DialogTitle>
            <DialogDescription>
              Informations détaillées de l'utilisateur (lecture seule pour les bibliothécaires)
            </DialogDescription>
          </DialogHeader>
          {selectedUser && selectedUser.id ? (
            <UserProfileViewer 
              userId={selectedUser.id} 
              isReadOnly={true} // Mode lecture seule pour les bibliothécaires
            />
          ) : (
            <div className="text-center py-8">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur sélectionné</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fermer
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BorrowManagement = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  // États pour la gestion du profil user
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // États pour le dialogue de confirmation de sanction
  const [showSanctionConfirmDialog, setShowSanctionConfirmDialog] = useState(false);
  const [sanctionUserInfo, setSanctionUserInfo] = useState(null);

  const isLibrarian = hasRole('bibliothecaire') || hasRole('administrateur');

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

  const loadBorrows = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const params = {
        page: currentPage,
        per_page: 10
      };

      if (selectedStatus !== 'all') params.statut = selectedStatus;

      // Utiliser l'API getEmprunts avec les paramètres appropriés
      const response = await apiService.getEmprunts(params);

      if (response.success) {
        const fetchedBorrows = response.data?.emprunts || [];
        const pagination = response.data?.pagination || {};
        
        setBorrows(Array.isArray(fetchedBorrows) ? fetchedBorrows : []);
        setTotalPages(pagination.last_page || 1);
      } else {
        setBorrows([]);
        setTotalPages(1);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des emprunts');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des emprunts:', error);
      setBorrows([]);
      setTotalPages(1);
      handleApiError(error, 'Erreur réseau lors du chargement des emprunts');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    loadBorrows();
  }, [loadBorrows]);

  const handleStatusFilter = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleExtendBorrow = async (borrowId) => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, [`extend_${borrowId}`]: true }));
    try {
      const response = await apiService.prolongerEmprunt(borrowId, 7);
      if (response.success) {
        toast.success('Emprunt prolongé avec succès!');
        loadBorrows();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la prolongation');
      }
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
      handleApiError(error, 'Erreur réseau lors de la prolongation');
    } finally {
      setActionLoading(prev => ({ ...prev, [`extend_${borrowId}`]: false }));
    }
  };

  const handleReturnBook = async () => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, return: true }));
    try {
      const response = await apiService.retournerLivre(selectedBorrow.id, notes);
      if (response.success) {
        toast.success('Livre marqué comme retourné avec succès!');
        setShowReturnDialog(false);
        setSelectedBorrow(null);
        setNotes('');
        loadBorrows();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du retour');
      }
    } catch (error) {
      console.error('Erreur lors du retour:', error);
      handleApiError(error, 'Erreur réseau lors du retour');
    } finally {
      setActionLoading(prev => ({ ...prev, return: false }));
    }
  };

  const handleMarkLost = async () => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, lost: true }));
    try {
      const response = await apiService.marquerPerdu(selectedBorrow.id, notes);
      if (response.success) {
        toast.success('Livre marqué comme perdu avec succès!');
        setShowLostDialog(false);
        setSelectedBorrow(null);
        setNotes('');
        loadBorrows();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du marquage perdu');
      }
    } catch (error) {
      console.error('Erreur lors du marquage perdu:', error);
      handleApiError(error, 'Erreur réseau lors du marquage perdu');
    } finally {
      setActionLoading(prev => ({ ...prev, lost: false }));
    }
  };

  const openReturnDialog = (borrow) => {
    setSelectedBorrow(borrow);
    setNotes('');
    setShowReturnDialog(true);
  };

  const openLostDialog = (borrow) => {
    setSelectedBorrow(borrow);
    setNotes('');
    setShowLostDialog(true);
  };

  // Fonction pour ouvrir le profil de l'emprunteur
  const openBorrowerProfile = (borrower) => {
    setSelectedUser(borrower);
    setShowProfileDialog(true);
  };

  // Fonction pour ouvrir le dialogue de confirmation de sanction
  const openSanctionConfirmDialog = (borrow) => {
    const emprunteur = borrow.user;
    if (emprunteur && emprunteur.id) {
      setSanctionUserInfo({
        userId: emprunteur.id,
        userName: `${emprunteur.prenom} ${emprunteur.nom}`,
        userEmail: emprunteur.email,
        borrowId: borrow.id,
        bookTitle: borrow.livre?.titre || 'Livre non spécifié'
      });
      setShowSanctionConfirmDialog(true);
    } else {
      toast.error('Informations emprunteur non disponibles');
    }
  };

  // Fonction pour rediriger vers la page de sanctions avec les paramètres
  const redirectToSanctions = () => {
    if (sanctionUserInfo) {
      // Construire l'URL avec les paramètres de l'user à sanctionner
      const params = new URLSearchParams({
        userId: sanctionUserInfo.userId,
        userName: sanctionUserInfo.userName,
        userEmail: sanctionUserInfo.userEmail,
        borrowId: sanctionUserInfo.borrowId,
        bookTitle: sanctionUserInfo.bookTitle
      });
      
      navigate(`/admin/sanctions?${params.toString()}`);
      setShowSanctionConfirmDialog(false);
      setSanctionUserInfo(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'en_cours': { label: 'En cours', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'en_retard': { label: 'En retard', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'retourne': { label: 'Retourné', variant: 'secondary', className: 'bg-green-100 text-green-800' },
      'perdu': { label: 'Perdu', variant: 'destructive', className: 'bg-orange-100 text-orange-800' },
      'prolonge': { label: 'Prolongé', variant: 'outline', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || statusConfig['en_cours'];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isOverdue = (dateRetourPrevue, statut) => {
    if (statut !== 'en_cours' && statut !== 'en_retard') return false;
    const today = new Date();
    const dueDate = new Date(dateRetourPrevue);
    return today > dueDate;
  };

  const getDaysUntilDue = (dateRetourPrevue) => {
    const today = new Date();
    const dueDate = new Date(dateRetourPrevue);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des emprunts...</p>
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
            {isLibrarian ? 'Gestion des Emprunts' : 'Mes Emprunts'}
          </h1>
          <p className="text-gray-600">
            {isLibrarian 
              ? 'Gérez tous les emprunts de la bibliothèque' 
              : 'Consultez et gérez vos emprunts en cours'
            }
          </p>
        </div>
      </div>

      {/* Onglets - Historique visible uniquement pour les bibliothécaires */}
      <Tabs defaultValue="current" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full ${isLibrarian ? 'grid-cols-3' : 'grid-cols-2'} min-w-max`}>
            <TabsTrigger value="current" className="text-sm">
              Emprunts Actuels
            </TabsTrigger>
            {isLibrarian && (
              <TabsTrigger value="history" className="text-sm">
                Historique
              </TabsTrigger>
            )}
            <TabsTrigger value="statistics" className="text-sm">
              Statistiques
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Onglet des emprunts actuels */}
        <TabsContent value="current" className="space-y-6">
          {/* Filtres - Améliorés pour la responsivité */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select onValueChange={handleStatusFilter} value={selectedStatus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                  <SelectItem value="retourne">Retourné</SelectItem>
                  <SelectItem value="perdu">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des emprunts actuels */}
          {borrows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun emprunt trouvé</h3>
                <p className="text-gray-600">
                  {isLibrarian 
                    ? 'Aucun emprunt ne correspond aux critères sélectionnés.'
                    : 'Vous n\'avez aucun emprunt en cours.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {borrows.map((borrow) => (
                <Card 
                  key={borrow.id} 
                  className={`${isOverdue(borrow.date_retour_prevue, borrow.statut) ? 'border-red-200 bg-red-50/30' : ''} flex flex-col`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <CardTitle className="text-lg truncate">{borrow.livre?.titre}</CardTitle>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {getStatusBadge(borrow.statut)}
                        {/* Badge avec nom de l'emprunteur */}
                        {isLibrarian && borrow.user && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            👤 {borrow.user.prenom} {borrow.user.nom}
                          </Badge>
                        )}
                        {borrow.nombre_prolongations > 0 && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            {borrow.nombre_prolongations} prolongation{borrow.nombre_prolongations > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="flex flex-col gap-2 mt-2">
                      <span>par {borrow.livre?.auteur}</span>
                      {/* Informations emprunteur plus visibles */}
                      {isLibrarian && borrow.user && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                          <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-900">
                              {borrow.user.prenom} {borrow.user.nom}
                            </p>
                            <p className="text-xs text-blue-600">{borrow.user.email}</p>
                          </div>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Date d'emprunt</p>
                          <p className="text-sm text-gray-600">{formatDate(borrow.date_emprunt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Date de retour prévue</p>
                          <p className={`text-sm ${isOverdue(borrow.date_retour_prevue, borrow.statut) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {formatDate(borrow.date_retour_prevue)}
                            {borrow.statut === 'en_cours' && (
                              <span className="ml-1">
                                ({getDaysUntilDue(borrow.date_retour_prevue) > 0 
                                  ? `dans ${getDaysUntilDue(borrow.date_retour_prevue)} jour${getDaysUntilDue(borrow.date_retour_prevue) > 1 ? 's' : ''}`
                                  : `${Math.abs(getDaysUntilDue(borrow.date_retour_prevue))} jour${Math.abs(getDaysUntilDue(borrow.date_retour_prevue)) > 1 ? 's' : ''} de retard`
                                })
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {borrow.date_retour_effective && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Date de retour effective</p>
                            <p className="text-sm text-gray-600">{formatDate(borrow.date_retour_effective)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {borrow.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-gray-600">{borrow.notes}</p>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(borrow.statut === 'en_cours' || borrow.statut === 'en_retard') && (
                        <>
                          {!isLibrarian && borrow.nombre_prolongations < 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExtendBorrow(borrow.id)}
                              disabled={actionLoading[`extend_${borrow.id}`]}
                              className="flex-1 min-w-0"
                            >
                              {actionLoading[`extend_${borrow.id}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1 flex-shrink-0" />
                              )}
                              <span className="truncate">Prolonger</span>
                            </Button>
                          )}
                          {isLibrarian && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReturnDialog(borrow)}
                                className="flex-1 min-w-0"
                              >
                                <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">Retourner</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLostDialog(borrow)}
                                className="flex-1 min-w-0"
                              >
                                <XCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">Marquer perdu</span>
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      
                      {/* Bouton pour voir le profil de l'emprunteur */}
                      {isLibrarian && borrow.user && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBorrowerProfile(borrow.user)}
                            className="flex-1 min-w-0"
                          >
                            <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Voir l'Emprunteur</span>
                          </Button>

                      )}
                      
                      {/* Bouton pour créer une sanction */}
                      {isLibrarian && borrow.user && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSanctionConfirmDialog(borrow)}
                          className="flex-1 min-w-0 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                        >
                          <Gavel className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Sanctions</span>
                        </Button>
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-gray-700">Page {currentPage} sur {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Onglet de l'historique (RESTAURÉ pour les bibliothécaires uniquement) */}
        {isLibrarian && (
          <TabsContent value="history">
            <BorrowHistory isLibrarian={isLibrarian} user={user} />
          </TabsContent>
        )}

        {/* Onglet des statistiques */}
        <TabsContent value="statistics">
          <BorrowStatistics />
        </TabsContent>
      </Tabs>

      {/* Dialog de retour */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Marquer comme retourné</DialogTitle>
            <DialogDescription>
              Confirmez le retour de ce livre et ajoutez des notes si nécessaire.
            </DialogDescription>
          </DialogHeader>
          {selectedBorrow && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Détails de l'emprunt</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Livre :</strong> {selectedBorrow.livre?.titre}</p>
                  <p><strong>Auteur :</strong> {selectedBorrow.livre?.auteur}</p>
                  {isLibrarian && selectedBorrow.user && (
                    <p><strong>Emprunteur :</strong> {selectedBorrow.user.prenom} {selectedBorrow.user.nom}</p>
                  )}
                  <p><strong>Date d'emprunt :</strong> {formatDate(selectedBorrow.date_emprunt)}</p>
                  <p><strong>Date de retour prévue :</strong> {formatDate(selectedBorrow.date_retour_prevue)}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="return-notes">Notes (optionnel)</Label>
                <Textarea
                  id="return-notes"
                  placeholder="Ajoutez des notes sur l'état du livre ou autres observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={actionLoading.return}>
                Annuler
              </Button>
            </DialogClose>
            <Button onClick={handleReturnBook} disabled={actionLoading.return}>
              {actionLoading.return ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Confirmer le retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de perte */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Marquer comme perdu</DialogTitle>
            <DialogDescription>
              Marquez ce livre comme perdu. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedBorrow && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Détails de l'emprunt</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Livre :</strong> {selectedBorrow.livre?.titre}</p>
                  <p><strong>Auteur :</strong> {selectedBorrow.livre?.auteur}</p>
                  {isLibrarian && selectedBorrow.user && (
                    <p><strong>Emprunteur :</strong> {selectedBorrow.user.prenom} {selectedBorrow.user.nom}</p>
                  )}
                  <p><strong>Date d'emprunt :</strong> {formatDate(selectedBorrow.date_emprunt)}</p>
                  <p><strong>Date de retour prévue :</strong> {formatDate(selectedBorrow.date_retour_prevue)}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="lost-notes">Raison de la perte (requis)</Label>
                <Textarea
                  id="lost-notes"
                  placeholder="Décrivez les circonstances de la perte du livre..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={actionLoading.lost}>
                Annuler
              </Button>
            </DialogClose>
            <Button 
              onClick={handleMarkLost} 
              variant="destructive"
              disabled={actionLoading.lost || !notes.trim()}
            >
              {actionLoading.lost ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Marquer comme perdu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour le profil de l'emprunteur */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Profil de l'Emprunteur</DialogTitle>
            <DialogDescription>
              Consultation des informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserProfileViewer user={selectedUser} />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fermer
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Dialog de confirmation pour la sanction */}
      <Dialog open={showSanctionConfirmDialog} onOpenChange={setShowSanctionConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer une sanction</DialogTitle>
            <DialogDescription>
              Vous allez être redirigé vers la page de gestion des sanctions pour cet utilisateur.
            </DialogDescription>
          </DialogHeader>
          {sanctionUserInfo && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Utilisateur à sanctionner</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nom :</strong> {sanctionUserInfo.userName}</p>
                  <p><strong>Email :</strong> {sanctionUserInfo.userEmail}</p>
                  <p><strong>Livre concerné :</strong> {sanctionUserInfo.bookTitle}</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Information</p>
                    <p className="text-sm text-yellow-700">
                      Vous serez redirigé vers la page de gestion des sanctions .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </DialogClose>
            <Button onClick={redirectToSanctions}>
              <Gavel className="h-4 w-4 mr-2" />
              Aller aux sanctions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowManagement;

