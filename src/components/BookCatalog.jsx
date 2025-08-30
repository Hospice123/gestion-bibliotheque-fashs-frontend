import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, Users, Calendar, Star, Plus, Edit, Trash2, Eye, Settings, CheckCircle, XCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
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

// Nouveau composant pour la confirmation de suppression
const ConfirmDeleteDialog = ({ book, isOpen, onClose, onConfirm, loading }) => {
  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce livre ?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Détails du livre */}
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

          {/* Avertissement */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h5 className="font-medium text-red-900 mb-2">⚠️ Attention</h5>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Le livre sera définitivement supprimé du catalogue</li>
              <li>• Tous les emprunts et réservations associés seront annulés</li>
              <li>• Cette action ne peut pas être annulée</li>
            </ul>
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
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Suppression en cours...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Nouveau composant pour la confirmation de réservation
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
          {/* Détails du livre */}
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

          {/* Conditions de réservation */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Conditions de réservation</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• La réservation est valable 7 jours.</li>
              <li>• Vous serez notifié lorsque le livre sera disponible.</li>
              <li>• Une fois disponible, vous aurez 2 jours pour le récupérer.</li>
              <li>• Maximum 5 réservations actives par utilisateur.</li>
            </ul>
          </div>

          {/* Vérifications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
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

// Composant pour la confirmation d'emprunt (existant)
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
          {/* Détails du livre */}
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

          {/* Conditions d'emprunt */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Conditions d'emprunt</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Durée d'emprunt: 14 jours</li>
              <li>• Possibilité de renouvellement: 1 fois</li>
              <li>• Retard: 0,50 FCFA par jour</li>
              <li>• Vous êtes responsable du livre emprunté</li>
            </ul>
          </div>

          {/* Vérifications */}
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

// Composant pour changer rapidement le statut d'un livre
const QuickStatusChange = ({ book, onStatusChange, canManage }) => {
  if (!canManage) return null;

  const handleStatusChange = (newStatus) => {
    onStatusChange(book.id, newStatus);
  };

  return (
    <Select value={book.statut || 'disponible'} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(BOOK_STATUSES).map(([status, config]) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <config.icon className="h-4 w-4" />
              {config.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const BookCatalog = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmBorrowDialog, setShowConfirmBorrowDialog] = useState(false);
  const [showConfirmReservationDialog, setShowConfirmReservationDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false); // Nouveau state
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // Nouveau state
  const [formData, setFormData] = useState({
    titre: '',
    auteur: '',
    isbn: '',
    editeur: '',
    annee_publication: '',
    nombre_pages: '',
    langue: 'fr',
    description: '',
    categorie_id: '',
    nombre_exemplaires: 1,
    emplacement: '',
    statut: 'disponible'
  });

  // Définition de canManageBooks plus robuste
  const canManageBooks = user && (user.role === 'administrateur' || user.role === 'bibliothecaire');

  // Utilisation de useCallback pour loadBooks et loadCategories pour éviter les re-créations inutiles
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 12
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categorie_id = selectedCategory;
      if (selectedStatus) params.statut = selectedStatus;

      console.log('Fetching books with params:', params);
      const response = await apiService.getLivres(params);
      console.log('Books API response:', response);

      if (response.success) {
        setBooks(response.data.livres || []);
        setTotalPages(response.data.pagination.last_page || 1);
      } else {
        setBooks([]);
        setTotalPages(1);
        toast.error('Erreur lors du chargement des livres: ' + (response.message || 'Réponse API non réussie'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livres:', error);
      setBooks([]);
      setTotalPages(1);
      toast.error('Erreur réseau ou serveur lors du chargement des livres.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  const loadCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const response = await apiService.getCategories();
      console.log('Categories API response:', response);

      if (response.success) {
        setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
      } else {
        setCategories([]);
        toast.error('Erreur lors du chargement des catégories: ' + (response.message || 'Réponse API non réussie'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
      toast.error('Erreur réseau ou serveur lors du chargement des catégories.');
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
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
      categorie_id: '',
      nombre_exemplaires: 1,
      emplacement: '',
      statut: 'disponible'
    });
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.createLivre(formData);
      if (response.success) {
        toast.success('Livre ajouté avec succès!');
        setShowAddDialog(false);
        resetForm();
        loadBooks();
      } else {
        toast.error('Erreur lors de l\'ajout du livre: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du livre:', error);
      toast.error('Erreur réseau ou serveur lors de l\'ajout du livre.');
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      const response = await apiService.updateLivre(selectedBook.id, formData);
      if (response.success) {
        toast.success('Livre modifié avec succès!');
        setShowEditDialog(false);
        setSelectedBook(null);
        resetForm();
        loadBooks();
      } else {
        toast.error('Erreur lors de la modification du livre: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de la modification du livre:', error);
      toast.error('Erreur réseau ou serveur lors de la modification du livre.');
    }
  };

  // Nouvelle fonction pour ouvrir le dialogue de confirmation de suppression
  const handleDeleteBookClick = (book) => {
    setSelectedBook(book);
    setShowConfirmDeleteDialog(true);
  };

  // Fonction pour confirmer la suppression après validation
  const handleConfirmDelete = async () => {
    if (!selectedBook) return;

    setDeleteLoading(true);
    try {
      const response = await apiService.deleteLivre(selectedBook.id);
      if (response.success) {
        toast.success('Livre supprimé avec succès!');
        setShowConfirmDeleteDialog(false);
        setSelectedBook(null);
        loadBooks();
      } else {
        toast.error('Erreur lors de la suppression du livre: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du livre:', error);
      toast.error('Erreur réseau ou serveur lors de la suppression du livre.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Nouvelle fonction pour ouvrir le dialogue de confirmation d'emprunt
  const handleBorrowBookClick = (book) => {
    // Vérifications préliminaires
    if (book.statut !== 'disponible') {
      toast.error('Ce livre n\'est pas disponible pour l\'emprunt.');
      return;
    }

    setSelectedBook(book);
    setShowConfirmBorrowDialog(true);
  };

  // Fonction pour confirmer l'emprunt après validation
  const handleConfirmBorrow = async () => {
    if (!selectedBook) return;

    setBorrowLoading(true);
    try {
      const response = await apiService.createEmprunt({ livre_id: selectedBook.id });
      if (response.success) {
        toast.success('Livre emprunté avec succès!');
        setShowConfirmBorrowDialog(false);
        setSelectedBook(null);
        loadBooks();
      } else {
        toast.error('Erreur lors de l\'emprunt du livre: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de l\'emprunt du livre:', error);
      toast.error('Erreur réseau ou serveur lors de l\'emprunt du livre.');
    } finally {
      setBorrowLoading(false);
    }
  };

  // Nouvelle fonction pour ouvrir le dialogue de confirmation de réservation
  const handleReserveBookClick = (book) => {
    // Vérifications préliminaires
    if (book.statut === 'disponible') {
      toast.error('Ce livre est disponible, vous pouvez l\'emprunter directement.');
      return;
    }

    if (book.statut !== 'emprunte' && book.statut !== 'reserve') {
      toast.error('Ce livre ne peut pas être réservé dans son état actuel.');
      return;
    }

    setSelectedBook(book);
    setShowConfirmReservationDialog(true);
  };

  // Fonction pour confirmer la réservation après validation
  const handleConfirmReserve = async () => {
    if (!selectedBook) return;

    setReserveLoading(true);
    try {
      const response = await apiService.createReservation({ livre_id: selectedBook.id });
      if (response.success) {
        toast.success('Livre réservé avec succès!');
        setShowConfirmReservationDialog(false);
        setSelectedBook(null);
        loadBooks();
      } else {
        toast.error('Erreur lors de la réservation du livre: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de la réservation du livre:', error);
      toast.error('Erreur réseau ou serveur lors de la réservation du livre.');
    } finally {
      setReserveLoading(false);
    }
  };

  const handleQuickStatusChange = async (bookId, newStatus) => {
    try {
      const response = await apiService.updateLivre(bookId, { statut: newStatus });
      if (response.success) {
        toast.success(`Statut du livre mis à jour: ${BOOK_STATUSES[newStatus].label}`);
        loadBooks();
      } else {
        toast.error('Erreur lors de la mise à jour du statut: ' + (response.message || ''));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur réseau ou serveur lors de la mise à jour du statut.');
    }
  };

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
      categorie_id: book.categorie_id || '',
      nombre_exemplaires: book.nombre_exemplaires || 1,
      emplacement: book.emplacement || '',
      statut: book.statut || 'disponible'
    });
    setShowEditDialog(true);
  };

  const openDetailsDialog = (book) => {
    setSelectedBook(book);
    setShowDetailsDialog(true);
  };

  // Fonction améliorée pour obtenir le badge de statut
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Chargement des livres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et bouton d'ajout */}
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau livre</DialogTitle>
                <DialogDescription>
                  Remplissez les informations ci-dessous pour ajouter un livre au catalogue.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titre">Titre *</Label>
                    <Input
                      id="titre"
                      value={formData.titre}
                      onChange={(e) => handleFormChange('titre', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="auteur">Auteur *</Label>
                    <Input
                      id="auteur"
                      value={formData.auteur}
                      onChange={(e) => handleFormChange('auteur', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => handleFormChange('isbn', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editeur">Éditeur</Label>
                    <Input
                      id="editeur"
                      value={formData.editeur}
                      onChange={(e) => handleFormChange('editeur', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annee_publication">Année de publication</Label>
                    <Input
                      id="annee_publication"
                      type="number"
                      value={formData.annee_publication}
                      onChange={(e) => handleFormChange('annee_publication', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombre_pages">Nombre de pages</Label>
                    <Input
                      id="nombre_pages"
                      type="number"
                      value={formData.nombre_pages}
                      onChange={(e) => handleFormChange('nombre_pages', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="categorie_id">Catégorie</Label>
                    <Select value={formData.category_id ? formData.category_id.toString() : ''} onValueChange={(value) => handleFormChange('category_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(categories) && categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select value={formData.statut} onValueChange={(value) => handleFormChange('statut', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BOOK_STATUSES).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nombre_exemplaires">Nombre d'exemplaires</Label>
                    <Input
                      id="nombre_exemplaires"
                      type="number"
                      min="1"
                      value={formData.nombre_exemplaires}
                      onChange={(e) => handleFormChange('nombre_exemplaires', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="langue">Langue</Label>
                    <Select value={formData.langue} onValueChange={(value) => handleFormChange('langue', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">Anglais</SelectItem>
                        <SelectItem value="es">Espagnol</SelectItem>
                        <SelectItem value="de">Allemand</SelectItem>
                        <SelectItem value="it">Italien</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="emplacement">Emplacement</Label>
                    <Input
                      id="emplacement"
                      value={formData.emplacement}
                      onChange={(e) => handleFormChange('emplacement', e.target.value)}
                      placeholder="Ex: A-12-3"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter le livre</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par titre, auteur, ISBN..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedCategory || 'all'} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(BOOK_STATUSES).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des livres */}
      {books.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500">Aucun livre trouvé</p>
          <p className="text-gray-400">Essayez d'ajuster vos filtres ou d'ajouter un nouveau livre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1">
                    {getStatusBadge(book.statut)}
                  </div>
                  {canManageBooks && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(book)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Modifier le livre"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBookClick(book)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer le livre"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{book.titre}</CardTitle>
                <CardDescription className="line-clamp-1">par {book.auteur}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600 space-y-1">
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
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {book.emplacement}
                      </span>
                    </div>
                  )}
                </div>

                {/* Changement rapide de statut pour les administrateurs */}
                {canManageBooks && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Changer le statut:</Label>
                    <QuickStatusChange
                      book={book}
                      onStatusChange={handleQuickStatusChange}
                      canManage={canManageBooks}
                    />
                  </div>
                )}

                {/* Section des boutons d'action - Améliorée pour la responsivité */}
                <div className="flex flex-col gap-2 pt-2">
                  {/* Première ligne - Bouton Détails toujours présent */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsDialog(book)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                  
                  {/* Deuxième ligne - Boutons conditionnels selon le statut */}
                  <div className="flex gap-2">
                    {/* Afficher le bouton Emprunter si le livre est disponible */}
                    {book.statut === 'disponible' && (
                      <Button
                        size="sm"
                        onClick={() => handleBorrowBookClick(book)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Emprunter
                      </Button>
                    )}
                    
                    {/* Afficher le bouton Réserver si le livre est emprunté ou réservé */}
                    {(book.statut === 'emprunte' || book.statut === 'reserve') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReserveBookClick(book)}
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Réserver
                      </Button>
                    )}
                    
                    {/* Message pour les autres statuts */}
                    {!['disponible', 'emprunte', 'reserve'].includes(book.statut) && (
                      <div className="flex-1 text-center text-sm text-gray-500 py-2">
                        Non disponible
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialogue d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le livre</DialogTitle>
            <DialogDescription>
              Modifiez les informations du livre sélectionné.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-titre">Titre *</Label>
                <Input
                  id="edit-titre"
                  value={formData.titre}
                  onChange={(e) => handleFormChange('titre', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-auteur">Auteur *</Label>
                <Input
                  id="edit-auteur"
                  value={formData.auteur}
                  onChange={(e) => handleFormChange('auteur', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-isbn">ISBN</Label>
                <Input
                  id="edit-isbn"
                  value={formData.isbn}
                  onChange={(e) => handleFormChange('isbn', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-editeur">Éditeur</Label>
                <Input
                  id="edit-editeur"
                  value={formData.editeur}
                  onChange={(e) => handleFormChange('editeur', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-annee_publication">Année de publication</Label>
                <Input
                  id="edit-annee_publication"
                  type="number"
                  value={formData.annee_publication}
                  onChange={(e) => handleFormChange('annee_publication', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-nombre_pages">Nombre de pages</Label>
                <Input
                  id="edit-nombre_pages"
                  type="number"
                  value={formData.nombre_pages}
                  onChange={(e) => handleFormChange('nombre_pages', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-categorie_id">Catégorie</Label>
                <Select value={formData.categorie_id ? formData.categorie_id.toString() : ''} onValueChange={(value) => handleFormChange('categorie_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-statut">Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => handleFormChange('statut', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BOOK_STATUSES).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-nombre_exemplaires">Nombre d'exemplaires</Label>
                <Input
                  id="edit-nombre_exemplaires"
                  type="number"
                  min="1"
                  value={formData.nombre_exemplaires}
                  onChange={(e) => handleFormChange('nombre_exemplaires', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-langue">Langue</Label>
                <Select value={formData.langue} onValueChange={(value) => handleFormChange('langue', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="es">Espagnol</SelectItem>
                    <SelectItem value="de">Allemand</SelectItem>
                    <SelectItem value="it">Italien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-emplacement">Emplacement</Label>
                <Input
                  id="edit-emplacement"
                  value={formData.emplacement}
                  onChange={(e) => handleFormChange('emplacement', e.target.value)}
                  placeholder="Ex: A-12-3"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">Modifier le livre</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du livre</DialogTitle>
            <DialogDescription>
              Informations complètes sur le livre sélectionné.
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                  <p className="text-lg font-semibold text-gray-800">{selectedBook.titre}</p>
                  <p className="text-gray-600">par {selectedBook.auteur}</p>
                  {selectedBook.isbn && (
                    <div>
                      <span className="font-medium">ISBN:</span> {selectedBook.isbn}
                    </div>
                  )}
                  {selectedBook.editeur && (
                    <div>
                      <span className="font-medium">Éditeur:</span> {selectedBook.editeur}
                    </div>
                  )}
                  {selectedBook.annee_publication && (
                    <div>
                      <span className="font-medium">Année:</span> {selectedBook.annee_publication}
                    </div>
                  )}
                  {selectedBook.nombre_pages && (
                    <div>
                      <span className="font-medium">Pages:</span> {selectedBook.nombre_pages}
                    </div>
                  )}
                  {selectedBook.langue && (
                    <div>
                      <span className="font-medium">Langue:</span> {selectedBook.langue}
                    </div>
                  )}
                  {selectedBook.emplacement && (
                    <div>
                      <span className="font-medium">Emplacement:</span> {selectedBook.emplacement}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedBook.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedBook.description}</p>
                </div>
              )}

              {/* Catégorie */}
              {selectedBook.categorie && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Catégorie</h4>
                  <Badge variant="outline">{selectedBook.categorie.nom}</Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedBook.statut === 'disponible' && (
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleBorrowBookClick(selectedBook);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Emprunter ce livre
                  </Button>
                )}
                
                {(selectedBook.statut === 'emprunte' || selectedBook.statut === 'reserve') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleReserveBookClick(selectedBook);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Réserver ce livre
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation d'emprunt */}
      <ConfirmBorrowDialog
        book={selectedBook}
        isOpen={showConfirmBorrowDialog}
        onClose={() => {
          setShowConfirmBorrowDialog(false);
          setSelectedBook(null);
        }}
        onConfirm={handleConfirmBorrow}
        loading={borrowLoading}
      />

      {/* Dialogue de confirmation de réservation */}
      <ConfirmReservationDialog
        book={selectedBook}
        isOpen={showConfirmReservationDialog}
        onClose={() => {
          setShowConfirmReservationDialog(false);
          setSelectedBook(null);
        }}
        onConfirm={handleConfirmReserve}
        loading={reserveLoading}
      />

      {/* Nouveau Dialogue de confirmation de suppression */}
      <ConfirmDeleteDialog
        book={selectedBook}
        isOpen={showConfirmDeleteDialog}
        onClose={() => {
          setShowConfirmDeleteDialog(false);
          setSelectedBook(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default BookCatalog;

