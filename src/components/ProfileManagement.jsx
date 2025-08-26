import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, XCircle, AlertTriangle, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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

// Composant pour le panneau de succès
const SuccessPanel = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-green-200 bg-green-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800 text-lg">Succès</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-green-700 bg-green-100 p-2 rounded border border-green-200">
            {message}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProfileManagement = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    numero_etudiant: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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

  const clearSuccess = () => {
    setSuccessMessage('');
  };

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        date_naissance: user.date_naissance || '',
        numero_etudiant: user.numero_etudiant || '',
        password: '',
        password_confirmation: ''
      });
      setLoading(false);
    } else if (!isAuthenticated) {
      setLoading(false);
      handleApiError({ message: 'Vous devez être connecté pour gérer votre profil.' });
    }
  }, [user, isAuthenticated]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Effacer les erreurs quand l'utilisateur modifie un champ
    if (errors.length > 0) {
      clearErrors();
    }
  };

  const resetForm = () => {
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      adresse: user.adresse || '',
      date_naissance: user.date_naissance || '',
      numero_etudiant: user.numero_etudiant || '',
      password: '',
      password_confirmation: ''
    });
    clearErrors();
    clearSuccess();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    clearErrors();
    clearSuccess();
    setSaving(true);

    try {
      // Validation côté client
      if (formData.password && formData.password !== formData.password_confirmation) {
        handleApiError({ message: 'Les mots de passe ne correspondent pas.' });
        setSaving(false);
        return;
      }

      if (formData.password && formData.password.length < 6) {
        handleApiError({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
        setSaving(false);
        return;
      }

      const dataToUpdate = { ...formData };
      // Supprimer les champs de mot de passe s'ils sont vides
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
        delete dataToUpdate.password_confirmation;
      }

      const response = await apiService.updateProfile(dataToUpdate);
      if (response.success) {
        setSuccessMessage('Profil mis à jour avec succès !');
        if (typeof refreshUser === 'function') {
          refreshUser(); // Mettre à jour les informations de l'utilisateur dans le contexte
        }
        setIsEditing(false);
        // Réinitialiser les champs de mot de passe
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      handleApiError(error, 'Une erreur inattendue est survenue');
    } finally {
      setSaving(false);
    }
  };

  // Fonction améliorée pour formater les dates avec gestion des différents formats
  const _formatDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    
    try {
      // Gestion des différents formats de date possibles
      let date;
      
      // Si c'est déjà un objet Date
      if (dateString instanceof Date) {
        date = dateString;
      }
      // Si c'est une chaîne ISO (2024-01-15T10:30:00.000Z)
      else if (typeof dateString === 'string') {
        // Nettoyer la chaîne et créer la date
        const cleanDateString = dateString.trim();
        date = new Date(cleanDateString);
      }
      // Si c'est un timestamp
      else if (typeof dateString === 'number') {
        date = new Date(dateString);
      }
      else {
        return 'Format invalide';
      }

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      // Formater la date en français
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, 'Date reçue:', dateString);
      return 'Erreur de format';
    }
  };

  // Fonction pour formater la date et l'heure d'inscription
  const formatRegistrationDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date d\'inscription:', error);
      return 'Erreur de format';
    }
  };

  // Fonction pour obtenir le badge du rôle
  const getRoleBadge = (role) => {
    const roleConfig = {
      'administrateur': { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
      'bibliothecaire': { label: 'Bibliothécaire', className: 'bg-blue-100 text-blue-800' },
      'emprunteur': { label: 'Emprunteur', className: 'bg-green-100 text-green-800' },
      'etudiant': { label: 'Étudiant', className: 'bg-purple-100 text-purple-800' },
      'enseignant': { label: 'Enseignant', className: 'bg-orange-100 text-orange-800' }
    };

    const config = roleConfig[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profil non trouvé</h3>
          <p className="text-gray-600">Impossible de charger les informations de l'utilisateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panneaux de notification */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      <SuccessPanel message={successMessage} onClose={clearSuccess} />
      
      {/* En-tête responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">Mon Profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles et de connexion</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)} 
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4 flex-shrink-0" />
            <span>Modifier le profil</span>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                resetForm();
              }} 
              disabled={saving}
              className="flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>Annuler</span>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4 flex-shrink-0" />
              )}
              <span>Sauvegarder</span>
            </Button>
          </div>
        )}
      </div>

      {/* Informations du compte - Carte améliorée */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Informations du Compte
          </CardTitle>
          <CardDescription>Rôle et date d'inscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium text-gray-700">Rôle</Label>
                <div className="mt-1">
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium text-gray-700">Date d'inscription</Label>
                <p className="text-sm text-gray-900 mt-1 font-medium">
                  {formatRegistrationDate(user.created_at)}
                </p>
              </div>
            </div>
            {user.numero_etudiant && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <Label className="text-sm font-medium text-gray-700">Numéro étudiant</Label>
                  <p className="text-sm text-gray-900 mt-1 font-medium truncate">
                    {user.numero_etudiant}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles - Formulaire amélioré */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-gray-600" />
            Informations Personnelles
          </CardTitle>
          <CardDescription>Détails de votre compte utilisateur</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-sm font-medium">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleFormChange('prenom', e.target.value)}
                    disabled={!isEditing}
                    required
                    className="pl-10"
                    placeholder="Votre prénom"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleFormChange('nom', e.target.value)}
                    disabled={!isEditing}
                    required
                    className="pl-10"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    disabled={!isEditing}
                    required
                    className="pl-10"
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-sm font-medium">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => handleFormChange('telephone', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_naissance" className="text-sm font-medium">Date de naissance</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => handleFormChange('date_naissance', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              {(user.role === 'emprunteur' || user.role === 'etudiant') && (
                <div className="space-y-2">
                  <Label htmlFor="numero_etudiant" className="text-sm font-medium">Numéro étudiant</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="numero_etudiant"
                      value={formData.numero_etudiant}
                      onChange={(e) => handleFormChange('numero_etudiant', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                      placeholder="Votre numéro étudiant"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-medium">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleFormChange('adresse', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="Votre adresse complète"
                />
              </div>
            </div>

            {/* Section changement de mot de passe */}
            {isEditing && (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
                </div>
                <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <strong>Optionnel :</strong> Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Nouveau mot de passe</Label>
                    <div className="relative">
                      <XCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Minimum 6 caractères"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation" className="text-sm font-medium">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <XCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password_confirmation"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        value={formData.password_confirmation}
                        onChange={(e) => handleFormChange('password_confirmation', e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Confirmez votre mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action en bas du formulaire */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileManagement;

