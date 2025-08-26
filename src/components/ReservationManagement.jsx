import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, BookOpen, User, CheckCircle, XCircle, AlertTriangle, Filter, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
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

const ReservationManagement = () => {
  const { hasRole } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [actionType, setActionType] = useState('');
  const [errors, setErrors] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

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

  const loadReservations = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const params = {
        page: currentPage,
        per_page: 10
      };

      if (selectedStatus) params.statut = selectedStatus;

      const response = await apiService.getReservations(params);
      if (response.success) {
        setReservations(Array.isArray(response.data.data) ? response.data.data : Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.data.last_page || 1);
      } else {
        console.error('API Error during loadReservations:', response);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des réservations');
      }
    } catch (error) {
      console.error('Network or Server Error during loadReservations:', error);
      handleApiError(error, 'Erreur réseau lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleStatusFilter = (value) => {
    setSelectedStatus(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleConfirmReservation = async () => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, confirm: true }));
    try {
      const response = await apiService.confirmerReservation(selectedReservation.id);
      if (response.success) {
        toast.success('Réservation confirmée avec succès');
        setShowConfirmDialog(false);
        setSelectedReservation(null);
        loadReservations();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la confirmation');
      }
    } catch (error) {
      console.error('Network or Server Error during handleConfirmReservation:', error);
      handleApiError(error, 'Erreur réseau lors de la confirmation');
    } finally {
      setActionLoading(prev => ({ ...prev, confirm: false }));
    }
  };

  const handleCancelReservation = async () => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, cancel: true }));
    try {
      const response = await apiService.annulerReservation(selectedReservation.id);
      if (response.success) {
        toast.success('Réservation annulée avec succès');
        setShowConfirmDialog(false);
        setSelectedReservation(null);
        loadReservations();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Network or Server Error during handleCancelReservation:', error);
      handleApiError(error, 'Erreur réseau lors de l\'annulation');
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleExpireReservation = async () => {
    clearErrors();
    setActionLoading(prev => ({ ...prev, expire: true }));
    try {
      const response = await apiService.expirerReservation(selectedReservation.id);
      if (response.success) {
        toast.success('Réservation marquée comme expirée');
        setShowConfirmDialog(false);
        setSelectedReservation(null);
        loadReservations();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de l\'expiration');
      }
    } catch (error) {
      console.error('Network or Server Error during handleExpireReservation:', error);
      handleApiError(error, 'Erreur réseau lors de l\'expiration');
    } finally {
      setActionLoading(prev => ({ ...prev, expire: false }));
    }
  };

  const openConfirmDialog = (reservation, action) => {
    setSelectedReservation(reservation);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const executeAction = () => {
    switch (actionType) {
      case 'confirm':
        handleConfirmReservation();
        break;
      case 'cancel':
        handleCancelReservation();
        break;
      case 'expire':
        handleExpireReservation();
        break;
      default:
        setShowConfirmDialog(false);
    }
  };

  const getActionText = () => {
    switch (actionType) {
      case 'confirm':
        return {
          title: 'Confirmer la réservation',
          description: 'Le livre sera marqué comme emprunté et la réservation sera confirmée.',
          buttonText: 'Confirmer',
          buttonVariant: 'default'
        };
      case 'cancel':
        return {
          title: 'Annuler la réservation',
          description: 'La réservation sera annulée et le livre sera disponible pour d\'autres utilisateurs.',
          buttonText: 'Annuler la réservation',
          buttonVariant: 'destructive'
        };
      case 'expire':
        return {
          title: 'Marquer comme expirée',
          description: 'La réservation sera marquée comme expirée et le livre sera disponible pour d\'autres utilisateurs.',
          buttonText: 'Marquer expirée',
          buttonVariant: 'destructive'
        };
      default:
        return { title: '', description: '', buttonText: '', buttonVariant: 'default' };
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { label: 'Active', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'disponible': { label: 'Disponible', variant: 'default', className: 'bg-green-100 text-green-800' },
      'confirmee': { label: 'Confirmée', variant: 'secondary', className: 'bg-purple-100 text-purple-800' },
      'annulee': { label: 'Annulée', variant: 'destructive', className: 'bg-gray-100 text-gray-800' },
      'expiree': { label: 'Expirée', variant: 'destructive', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig["active"];
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

  const isExpiringSoon = (dateExpiration, statut) => {
    if (statut !== 'active' && statut !== 'disponible') return false;
    const today = new Date();
    const expirationDate = new Date(dateExpiration);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  const isExpired = (dateExpiration, statut) => {
    if (statut !== 'active' && statut !== 'disponible') return false;
    const today = new Date();
    const expirationDate = new Date(dateExpiration);
    return today.getTime() > expirationDate.getTime();
  };

  const getDaysUntilExpiration = (dateExpiration) => {
    const today = new Date();
    const expirationDate = new Date(dateExpiration);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
            {isLibrarian ? 'Gestion des Réservations' : 'Mes Réservations'}
          </h1>
          <p className="text-gray-600">
            {isLibrarian 
              ? 'Gérez toutes les réservations de la bibliothèque' 
              : 'Consultez et gérez vos réservations'
            }
          </p>
        </div>
      </div>

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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="confirmee">Confirmée</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
              <SelectItem value="expiree">Expirée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des réservations - Améliorée pour la responsivité */}
      {reservations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-gray-600">
              {isLibrarian 
                ? 'Aucune réservation ne correspond aux critères sélectionnés.'
                : 'Vous n\'avez aucune réservation en cours.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reservations.map((reservation) => (
            <Card 
              key={reservation.id} 
              className={`${
                isExpired(reservation.date_expiration, reservation.statut) 
                  ? 'border-red-200 bg-red-50/30' 
                  : isExpiringSoon(reservation.date_expiration, reservation.statut)
                  ? 'border-yellow-200 bg-yellow-50/30'
                  : ''
              } flex flex-col`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{reservation.livre?.titre}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {getStatusBadge(reservation.statut)}
                    {reservation.position_file > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Position {reservation.position_file}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex flex-col gap-2 mt-2">
                  <span>par {reservation.livre?.auteur}</span>
                  {isLibrarian && reservation.utilisateur && (
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Réservé par {reservation.utilisateur.prenom} {reservation.utilisateur.nom}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Date de réservation</p>
                      <p className="text-sm text-gray-600">{formatDate(reservation.date_reservation)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Date d'expiration</p>
                      <p className={`text-sm ${isExpired(reservation.date_expiration, reservation.statut) ? 'text-red-600 font-medium' : isExpiringSoon(reservation.date_expiration, reservation.statut) ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(reservation.date_expiration)}
                        {getDaysUntilExpiration(reservation.date_expiration) >= 0 && (
                          <span className="ml-1">({getDaysUntilExpiration(reservation.date_expiration)} jours restants)</span>
                        )}
                        {getDaysUntilExpiration(reservation.date_expiration) < 0 && (
                          <span className="ml-1">(Expirée il y a {-getDaysUntilExpiration(reservation.date_expiration)} jours)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isLibrarian && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Utilisateur</p>
                        <p className="text-sm text-gray-600 truncate">{reservation.utilisateur?.prenom} {reservation.utilisateur?.nom}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Actions pour les bibliothécaires */}
                {isLibrarian && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {reservation.statut === 'active' && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => openConfirmDialog(reservation, 'confirm')}
                        className="flex-1 min-w-0"
                      >
                        <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Confirmer</span>
                      </Button>
                    )}
                    {(reservation.statut === 'active' || reservation.statut === 'disponible') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openConfirmDialog(reservation, 'cancel')}
                          className="flex-1 min-w-0"
                        >
                          <XCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Annuler</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openConfirmDialog(reservation, 'expire')}
                          className="flex-1 min-w-0"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Expirer</span>
                        </Button>
                      </>
                    )}
                  </div>
                )}
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

      {/* Dialog de confirmation - Amélioré */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getActionText().title}</DialogTitle>
            <DialogDescription>
              {getActionText().description}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Détails de la réservation</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Livre :</strong> {selectedReservation.livre?.titre}</p>
                  <p><strong>Auteur :</strong> {selectedReservation.livre?.auteur}</p>
                  {isLibrarian && selectedReservation.utilisateur && (
                    <p><strong>Utilisateur :</strong> {selectedReservation.utilisateur.prenom} {selectedReservation.utilisateur.nom}</p>
                  )}
                  <p><strong>Date de réservation :</strong> {formatDate(selectedReservation.date_reservation)}</p>
                  <p><strong>Date d'expiration :</strong> {formatDate(selectedReservation.date_expiration)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={actionLoading[actionType]}>
                Annuler
              </Button>
            </DialogClose>
            <Button 
              onClick={executeAction} 
              variant={getActionText().buttonVariant}
              disabled={actionLoading[actionType]}
            >
              {actionLoading[actionType] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {getActionText().buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationManagement;

