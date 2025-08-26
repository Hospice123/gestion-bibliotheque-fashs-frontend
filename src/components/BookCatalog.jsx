import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, Users, Calendar, Star, Plus, Edit, Trash2, Eye, Settings, CheckCircle, XCircle, Clock, AlertTriangle, HelpCircle, X } from 'lucide-react';
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
import { toast } from 'sonner';

// Configuration des statuts de livres
const BOOK_STATUSES = {
  disponible: {
    label: 'Disponible',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Livre disponible pour emprunt'
  },
  indisponible: {
    label: 'Indisponible',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    description: 'Livre temporairement indisponible'
  },
  emprunte: {
    label: 'Emprunté',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Users,
    description: 'Livre actuellement emprunté'
  },
  reserve: {
    label: 'Réservé',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    description: 'Livre réservé par un utilisateur'
  },
  maintenance: {
    label: 'Maintenance',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Settings,
    description: 'Livre en maintenance ou réparation'
  },
  perdu: {
    label: 'Perdu',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: HelpCircle,
    description: 'Livre perdu ou égaré'
  }
};

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

// Composant pour les filtres de livres
const BookFilters = ({ 
  searchTerm, 
  handleSearchChange, 
  handleSearchSubmit, 
  selectedCategory, 
  handleCategoryFilter, 
  selectedStatus, 
  handleStatusFilter, 
  categories, 
  BOOK_STATUSES 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex flex-col lg:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par titre, auteur, ISBN..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </form>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={handleCategoryFilter} value={selectedCategory || 'all'}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleStatusFilter} value={selectedStatus || 'all'}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(BOOK_STATUSES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const BookCatalog = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmBorrowDialog, setShowConfirmBorrowDialog] = useState(false);
  const [showConfirmReservationDialog, setShowConfirmReservationDialog] = useState(false);
  
  // États pour la gestion des erreurs
  const [errors, setErrors] = useState([]);
  
  // États pour les dialogues de confirmation de suppression
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [bookToConfirmDelete, setBookToConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    auteur: '',
    isbn: '',
    editeur: '',
    annee_publication: '',
    nombre_pages: '',
    langue: 'fr',
    description: '',
    category_id: null,
    nombre_exemplaires: 1,
    emplacement: '',
    statut: 'disponible'
  });

  const canManageBooks = user && (user.role === 'administrateur' || user.role === 'bibliothecaire');

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

  const loadBooks = useCallback(async () => {
    setLoading(true);
    clearErrors();
    try {
      const params = {
        page: currentPage,
        per_page: 12
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedStatus) params.statut = selectedStatus;

      const response = await apiService.getLivres(params);

      if (response.success) {
        setBooks(response.data.livres || []);
        setTotalPages(response.data.pagination.last_page || 1);
      } else {
        setBooks([]);
        setTotalPages(1);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des livres');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livres:', error);
      setBooks([]);
      setTotalPages(1);
      handleApiError(error, 'Erreur réseau lors du chargement des livres');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedCategory, selectedStatus]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories();

      if (response.success) {
        setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
      } else {
        setCategories([]);
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des catégories');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
      handleApiError(error, 'Erreur réseau lors du chargement des catégories');
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value) => {
    setSelectedCategory(value === 'all' ? '' : value);
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
      titre: '',
      auteur: '',
      isbn: '',
      editeur: '',
      annee_publication: '',
      nombre_pages: '',
      langue: 'fr',
      description: '',
      category_id: null,
      nombre_exemplaires: 1,
      emplacement: '',
      statut: 'disponible'
    });
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    clearErrors();
    try {
      const response = await apiService.createLivre({ ...formData, category_id: parseInt(formData.category_id) });
      if (response.success) {
        toast.success('Livre ajouté avec succès!');
        setShowAddDialog(false);
        resetForm();
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de l\'ajout du livre');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du livre:', error);
      handleApiError(error, 'Erreur réseau lors de l\'ajout du livre');
    }
  };

  // Fonction pour gérer la modification du livre
  const handleEditBook = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    setEditLoading(true);
    clearErrors();
    try {
      const response = await apiService.updateLivre(selectedBook.id, { ...formData, category_id: parseInt(formData.category_id) });
      if (response.success) {
        toast.success('Livre modifié avec succès!');
        setShowEditDialog(false);
        setSelectedBook(null);
        resetForm();
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la modification du livre');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du livre:', error);
      handleApiError(error, 'Erreur réseau lors de la modification du livre');
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour gérer la suppression après confirmation
  const handleDeleteBookConfirmed = async () => {
    if (!bookToConfirmDelete) return;
    setDeleteLoading(true);
    clearErrors();
    try {
      const response = await apiService.deleteLivre(bookToConfirmDelete.id);
      if (response.success) {
        toast.success('Livre supprimé avec succès!');
        setShowConfirmDeleteDialog(false);
        setBookToConfirmDelete(null);
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la suppression du livre');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du livre:', error);
      handleApiError(error, 'Erreur réseau lors de la suppression du livre');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickStatusChange = async (bookId, newStatus) => {
    clearErrors();
    try {
      const response = await apiService.updateLivre(bookId, { statut: newStatus });
      if (response.success) {
        toast.success(`Statut du livre mis à jour: ${BOOK_STATUSES[newStatus].label}`);
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      handleApiError(error, 'Erreur réseau lors de la mise à jour du statut');
    }
  };

  // Fonction pour ouvrir le dialogue d'édition directement
  const openEditDialog = (book) => {
    setSelectedBook(book);
    setFormData({
      titre: book.titre || '',
      auteur: book.auteur || '',
      isbn: book.isbn || '',
      editeur: book.editeur || '',
      annee_publication: book.annee_publication || '',
      nombre_pages: book.nombre_pages || '',
      langue: book.langue || 'fr',
      description: book.description || '',
      category_id: book.categorie_id ? book.categorie_id.toString() : '',
      nombre_exemplaires: book.nombre_exemplaires || 1,
      emplacement: book.emplacement || '',
      statut: book.statut || 'disponible'
    });
    setShowEditDialog(true);
  };

  const openDeleteConfirmation = (book) => {
    setBookToConfirmDelete(book);
    setShowConfirmDeleteDialog(true);
  };

  const openDetailsDialog = (book) => {
    setSelectedBook(book);
    setShowDetailsDialog(true);
  };

  const handleBorrowBookClick = (book) => {
    if (book.statut !== 'disponible') {
      handleApiError({ response: { data: { message: 'Ce livre n\'est pas disponible pour l\'emprunt.' } } });
      return;
    }

    setSelectedBook(book);
    setShowConfirmBorrowDialog(true);
  };

  const handleConfirmBorrow = async () => {
    if (!selectedBook) return;
    setBorrowLoading(true);
    clearErrors();
    try {
      const response = await apiService.createEmprunt({ livre_id: selectedBook.id });
      if (response.success) {
        toast.success('Livre emprunté avec succès!');
        setShowConfirmBorrowDialog(false);
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de l\'emprunt');
      }
    } catch (error) {
      handleApiError(error, 'Erreur réseau lors de l\'emprunt');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReserveBookClick = (book) => {
    if (book.statut === 'disponible' || book.statut === 'emprunte') {
      handleApiError({ response: { data: { message: 'Ce livre est disponible ou déjà emprunté. La réservation n\'est pas nécessaire.' } } });
      return;
    }

    setSelectedBook(book);
    setShowConfirmReservationDialog(true);
  };

  const handleConfirmReservation = async () => {
    if (!selectedBook) return;
    setReserveLoading(true);
    clearErrors();
    try {
      const response = await apiService.createReservation({ livre_id: selectedBook.id });
      if (response.success) {
        toast.success('Livre réservé avec succès!');
        setShowConfirmReservationDialog(false);
        loadBooks();
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la réservation');
      }
    } catch (error) {
      handleApiError(error, 'Erreur réseau lors de la réservation');
    } finally {
      setReserveLoading(false);
    }
  };

  // Composant interne pour la carte de livre
  const BookCard = ({ book, canManageBooks, openEditDialog, openDeleteConfirmation, openDetailsDialog, handleBorrowBookClick, handleReserveBookClick, handleQuickStatusChange }) => {
    const getStatusBadge = (status) => {
      const config = BOOK_STATUSES[status] || BOOK_STATUSES.disponible;
      const IconComponent = config.icon;
      return (
        <Badge className={`${config.color} flex items-center gap-1`}>
          <IconComponent className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    };

    return (
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">{getStatusBadge(book.statut)}</div>
            {canManageBooks && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(book)} className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openDeleteConfirmation(book)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-[48px]">
            <CardTitle className="text-lg line-clamp-2">{book.titre}</CardTitle>
          </div>
          <CardDescription className="line-clamp-1">par {book.auteur}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-1 min-h-[72px]">
            {book.categorie && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{book.categorie.nom}</span>
              </div>
            )}
            {book.annee_publication && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{book.annee_publication}</span>
              </div>
            )}
            {book.emplacement && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{book.emplacement}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 min-h-[60px]">
            {canManageBooks && (
              <>
                <Label className="text-xs text-gray-500">Changer le statut:</Label>
                <Select onValueChange={(value) => handleQuickStatusChange(book.id, value)} value={book.statut}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BOOK_STATUSES).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => openDetailsDialog(book)} className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Détails
            </Button>
            {book.statut === 'disponible' && (
              <Button size="sm" onClick={() => handleBorrowBookClick(book)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Emprunter
              </Button>
            )}
            {book.statut !== 'disponible' && book.statut !== 'emprunte' && (
              <Button variant="outline" size="sm" onClick={() => handleReserveBookClick(book)} className="flex-1">
                Réserver
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Composant interne pour la confirmation de réservation
  const ConfirmReservationDialog = ({ book, isOpen, onClose, onConfirm, loading }) => {
    if (!book) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Confirmer la réservation
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de réserver ce livre. Veuillez confirmer votre choix.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">{book.titre}</h4>
              <p className="text-sm text-gray-600">par {book.auteur}</p>
              {book.categorie && (
                <p className="text-sm text-gray-500">Catégorie: {book.categorie.nom}</p>
              )}
              {book.emplacement && (
                <p className="text-sm text-gray-500">Emplacement: {book.emplacement}</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Conditions de réservation</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Durée de réservation: 7 jours</li>
                <li>• Notification lors de la disponibilité</li>
                <li>• Annulation automatique après expiration</li>
                <li>• Maximum 3 réservations simultanées</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-orange-600" />
                <span className="text-gray-700">Livre non disponible pour emprunt direct (actuellement {book.statut})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Pas de réservation active pour ce livre</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Limite de réservations non atteinte</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Réservation en cours...
                </>
              ) : (
                `Confirmer la réservation`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant interne pour la confirmation d'emprunt
  const ConfirmBorrowDialog = ({ book, isOpen, onClose, onConfirm, loading }) => {
    if (!book) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Confirmer l'emprunt
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'emprunter ce livre. Veuillez confirmer votre choix.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">{book.titre}</h4>
              <p className="text-sm text-gray-600">par {book.auteur}</p>
              {book.categorie && (
                <p className="text-sm text-gray-500">Catégorie: {book.categorie.nom}</p>
              )}
              {book.emplacement && (
                <p className="text-sm text-gray-500">Emplacement: {book.emplacement}</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Conditions d'emprunt</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Durée d'emprunt: 14 jours</li>
                <li>• Possibilité de renouvellement: 1 fois</li>
                <li>• Retard: 500 FCFA par jour</li>
                <li>• Vous êtes responsable du livre emprunté</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Livre disponible</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Aucun emprunt en retard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Limite d'emprunts non atteinte</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Emprunt en cours...
                </>
              ) : (
                `Confirmer l'emprunt`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant interne pour l'ajout de livre
  const AddBookDialog = ({ isOpen, onOpenChange, onSubmit, formData, onFormChange, categories, BOOK_STATUSES }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau livre</DialogTitle>
            <DialogDescription>Remplissez les informations ci-dessous pour ajouter un livre à la bibliothèque.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titre" className="text-right">Titre</Label>
              <Input id="titre" value={formData.titre} onChange={(e) => onFormChange('titre', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="auteur" className="text-right">Auteur</Label>
              <Input id="auteur" value={formData.auteur} onChange={(e) => onFormChange('auteur', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isbn" className="text-right">ISBN</Label>
              <Input id="isbn" value={formData.isbn} onChange={(e) => onFormChange('isbn', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editeur" className="text-right">Éditeur</Label>
              <Input id="editeur" value={formData.editeur} onChange={(e) => onFormChange('editeur', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annee_publication" className="text-right">Année</Label>
              <Input id="annee_publication" type="number" value={formData.annee_publication} onChange={(e) => onFormChange('annee_publication', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre_pages" className="text-right">Pages</Label>
              <Input id="nombre_pages" type="number" value={formData.nombre_pages} onChange={(e) => onFormChange('nombre_pages', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="langue" className="text-right">Langue</Label>
              <Input id="langue" value={formData.langue} onChange={(e) => onFormChange('langue', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => onFormChange('description', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_id" className="text-right">Catégorie</Label>
              <Select onValueChange={(value) => onFormChange('category_id', value)} value={formData.category_id ? formData.category_id.toString() : ''}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre_exemplaires" className="text-right">Exemplaires</Label>
              <Input id="nombre_exemplaires" type="number" value={formData.nombre_exemplaires} onChange={(e) => onFormChange('nombre_exemplaires', e.target.value)} className="col-span-3" min="1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emplacement" className="text-right">Emplacement</Label>
              <Input id="emplacement" value={formData.emplacement} onChange={(e) => onFormChange('emplacement', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statut" className="text-right">Statut</Label>
              <Select onValueChange={(value) => onFormChange('statut', value)} value={formData.statut}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BOOK_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant interne pour l'édition de livre
  const EditBookDialog = ({ isOpen, onOpenChange, onSubmit, formData, onFormChange, categories, BOOK_STATUSES, loading }) => {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le livre</DialogTitle>
            <DialogDescription>Mettez à jour les informations du livre.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="titre" className="text-right">Titre</Label>
              <Input id="titre" value={formData.titre} onChange={(e) => onFormChange('titre', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="auteur" className="text-right">Auteur</Label>
              <Input id="auteur" value={formData.auteur} onChange={(e) => onFormChange('auteur', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isbn" className="text-right">ISBN</Label>
              <Input id="isbn" value={formData.isbn} onChange={(e) => onFormChange('isbn', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editeur" className="text-right">Éditeur</Label>
              <Input id="editeur" value={formData.editeur} onChange={(e) => onFormChange('editeur', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annee_publication" className="text-right">Année</Label>
              <Input id="annee_publication" type="number" value={formData.annee_publication} onChange={(e) => onFormChange('annee_publication', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre_pages" className="text-right">Pages</Label>
              <Input id="nombre_pages" type="number" value={formData.nombre_pages} onChange={(e) => onFormChange('nombre_pages', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="langue" className="text-right">Langue</Label>
              <Input id="langue" value={formData.langue} onChange={(e) => onFormChange('langue', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => onFormChange('description', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_id" className="text-right">Catégorie</Label>
              <Select onValueChange={(value) => onFormChange('category_id', value)} value={formData.category_id ? formData.category_id.toString() : ''}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre_exemplaires" className="text-right">Exemplaires</Label>
              <Input id="nombre_exemplaires" type="number" value={formData.nombre_exemplaires} onChange={(e) => onFormChange('nombre_exemplaires', e.target.value)} className="col-span-3" min="1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emplacement" className="text-right">Emplacement</Label>
              <Input id="emplacement" value={formData.emplacement} onChange={(e) => onFormChange('emplacement', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statut" className="text-right">Statut</Label>
              <Select onValueChange={(value) => onFormChange('statut', value)} value={formData.statut}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BOOK_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Modification en cours...
                  </>
                ) : (
                  'Modifier'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant interne pour les détails du livre
  const BookDetailsDialog = ({ book, isOpen, onOpenChange }) => {
    if (!book) return null;

    const StatusIcon = BOOK_STATUSES[book.statut]?.icon || BookOpen;

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              {book.titre}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              par {book.auteur}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">ISBN:</div>
              <div>{book.isbn || 'N/A'}</div>

              <div className="font-semibold">Éditeur:</div>
              <div>{book.editeur || 'N/A'}</div>

              <div className="font-semibold">Année de publication:</div>
              <div>{book.annee_publication || 'N/A'}</div>

              <div className="font-semibold">Nombre de pages:</div>
              <div>{book.nombre_pages || 'N/A'}</div>

              <div className="font-semibold">Langue:</div>
              <div>{book.langue || 'N/A'}</div>

              <div className="font-semibold">Catégorie:</div>
              <div>{book.categorie?.nom || 'N/A'}</div>

              <div className="font-semibold">Nombre d'exemplaires:</div>
              <div>{book.nombre_exemplaires || 'N/A'}</div>

              <div className="font-semibold">Emplacement:</div>
              <div>{book.emplacement || 'N/A'}</div>

              <div className="font-semibold">Statut:</div>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                {BOOK_STATUSES[book.statut]?.label || book.statut}
              </div>
            </div>

            {book.description && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Description:</div>
                <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {book.description}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Composant interne pour la confirmation de suppression
  const ConfirmDeleteDialog = ({ book, isOpen, onClose, onConfirm, loading }) => {
    if (!book) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce livre ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900">{book.titre}</h4>
              <p className="text-sm text-red-700">par {book.auteur}</p>
              {book.categorie && (
                <p className="text-sm text-red-600">Catégorie: {book.categorie.nom}</p>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Attention</span>
              </div>
              <p className="text-sm text-yellow-700">
                La suppression de ce livre entraînera également la suppression de tous les emprunts et réservations associés.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression en cours...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Panneau d'erreur */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogue des livres</h1>
          <p className="text-gray-600">Découvrez et gérez la collection de la bibliothèque</p>
        </div>
        {canManageBooks && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un livre
              </Button>
            </DialogTrigger>
            <AddBookDialog 
              isOpen={showAddDialog} 
              onOpenChange={setShowAddDialog} 
              onSubmit={handleAddBook} 
              formData={formData} 
              onFormChange={handleFormChange} 
              categories={categories} 
              BOOK_STATUSES={BOOK_STATUSES} 
            />
          </Dialog>
        )}
      </div>

      <BookFilters
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        handleSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        handleCategoryFilter={handleCategoryFilter}
        selectedStatus={selectedStatus}
        handleStatusFilter={handleStatusFilter}
        categories={categories}
        BOOK_STATUSES={BOOK_STATUSES}
      />

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-500">Chargement des livres...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">Aucun livre trouvé</p>
          <p className="text-gray-400">Essayez d'ajuster vos filtres ou d'ajouter un nouveau livre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              canManageBooks={canManageBooks}
              openEditDialog={openEditDialog}
              openDeleteConfirmation={openDeleteConfirmation}
              openDetailsDialog={openDetailsDialog}
              handleBorrowBookClick={handleBorrowBookClick}
              handleReserveBookClick={handleReserveBookClick}
              handleQuickStatusChange={handleQuickStatusChange}
            />
          ))}
        </div>
      )}

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
      <ConfirmBorrowDialog
        book={selectedBook}
        isOpen={showConfirmBorrowDialog}
        onClose={() => setShowConfirmBorrowDialog(false)}
        onConfirm={handleConfirmBorrow}
        loading={borrowLoading}
      />
      
      <ConfirmReservationDialog
        book={selectedBook}
        isOpen={showConfirmReservationDialog}
        onClose={() => setShowConfirmReservationDialog(false)}
        onConfirm={handleConfirmReservation}
        loading={reserveLoading}
      />

      <ConfirmDeleteDialog
        book={bookToConfirmDelete}
        isOpen={showConfirmDeleteDialog}
        onClose={() => setShowConfirmDeleteDialog(false)}
        onConfirm={handleDeleteBookConfirmed}
        loading={deleteLoading}
      />

      <EditBookDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEditBook}
        formData={formData}
        onFormChange={handleFormChange}
        categories={categories}
        BOOK_STATUSES={BOOK_STATUSES}
        loading={editLoading}
      />
      
      <BookDetailsDialog
        book={selectedBook}
        isOpen={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
};

export default BookCatalog;

