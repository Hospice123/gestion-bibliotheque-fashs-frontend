import React, { useState, useEffect } from 'react';
import { Settings, Database, Mail, Bell, Shield, Clock, DollarSign, BookOpen, Save, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
              <Save className="h-5 w-5 text-green-600" />
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

const Administration = () => {
  const { hasAnyRole } = useAuth();
  const [settings, setSettings] = useState({
    general: {
      nom_bibliotheque: 'Bibliothèque Universitaire',
      adresse: '',
      telephone: '',
      email: '',
      horaires_ouverture: '',
      duree_emprunt_defaut: 14,
      nombre_prolongations_max: 2,
      duree_prolongation: 7
    },
    emprunts: {
      limite_emprunts_etudiant: 5,
      limite_emprunts_enseignant: 10,
      duree_emprunt_livre: 14,
      duree_emprunt_periodique: 7,
      penalite_retard_par_jour: 0.50,
      duree_suspension_retard: 7
    },
    reservations: {
      duree_reservation: 3,
      nombre_reservations_max: 3,
      notification_disponibilite: true,
      annulation_automatique: true
    },
    notifications: {
      rappel_avant_echeance: true,
      jours_avant_rappel: 2,
      notification_retard: true,
      notification_reservation: true,
      email_administrateur: ''
    },
    securite: {
      duree_session: 120,
      tentatives_connexion_max: 5,
      duree_blocage_compte: 30,
      mot_de_passe_min_length: 8
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const canManageSettings = hasAnyRole(['administrateur']);

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
    if (canManageSettings) {
      loadSettings();
    }
  }, [canManageSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      clearErrors();
      const response = await apiService.getSettings();
      if (response.success) {
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du chargement des paramètres');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      handleApiError(error, 'Erreur réseau lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (category) => {
    try {
      setSaving(prev => ({ ...prev, [category]: true }));
      clearErrors();
      clearSuccess();
      const response = await apiService.updateSettings(category, settings[category]);
      if (response.success) {
        setSuccessMessage('Paramètres sauvegardés avec succès');
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      handleApiError(error, 'Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setSaving(prev => ({ ...prev, backup: true }));
      clearErrors();
      clearSuccess();
      const response = await apiService.backupDatabase();
      if (response.success) {
        setSuccessMessage('Sauvegarde créée avec succès');
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      handleApiError(error, 'Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(prev => ({ ...prev, backup: false }));
    }
  };

  const handleClearCache = async () => {
    try {
      setSaving(prev => ({ ...prev, cache: true }));
      clearErrors();
      clearSuccess();
      const response = await apiService.clearCache();
      if (response.success) {
        setSuccessMessage('Cache vidé avec succès');
      } else {
        handleApiError({ response: { data: { message: response.message } } }, 'Erreur lors du vidage du cache');
      }
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      handleApiError(error, 'Erreur réseau lors du vidage du cache');
    } finally {
      setSaving(prev => ({ ...prev, cache: false }));
    }
  };

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès non autorisé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder aux paramètres d'administration.</p>
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
      {/* Panneaux de notification */}
      <ErrorPanel errors={errors} onClose={clearErrors} />
      <SuccessPanel message={successMessage} onClose={clearSuccess} />
      
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Configurez les paramètres généraux de la bibliothèque</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        {/* Onglets responsifs */}
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 min-w-max">
            <TabsTrigger value="general" className="text-xs sm:text-sm">Général</TabsTrigger>
            <TabsTrigger value="emprunts" className="text-xs sm:text-sm">Emprunts</TabsTrigger>
            <TabsTrigger value="reservations" className="text-xs sm:text-sm">Réservations</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="securite" className="text-xs sm:text-sm">Sécurité</TabsTrigger>
          </TabsList>
        </div>

        {/* Paramètres généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>
                Configuration de base de la bibliothèque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_bibliotheque">Nom de la bibliothèque</Label>
                  <Input
                    id="nom_bibliotheque"
                    value={settings.general.nom_bibliotheque}
                    onChange={(e) => handleSettingChange('general', 'nom_bibliotheque', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={settings.general.telephone}
                    onChange={(e) => handleSettingChange('general', 'telephone', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_emprunt_defaut">Durée d'emprunt par défaut (jours)</Label>
                  <Input
                    id="duree_emprunt_defaut"
                    type="number"
                    min="1"
                    value={settings.general.duree_emprunt_defaut}
                    onChange={(e) => handleSettingChange('general', 'duree_emprunt_defaut', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_prolongations_max">Nombre maximum de prolongations</Label>
                  <Input
                    id="nombre_prolongations_max"
                    type="number"
                    min="0"
                    value={settings.general.nombre_prolongations_max}
                    onChange={(e) => handleSettingChange('general', 'nombre_prolongations_max', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_prolongation">Durée de prolongation (jours)</Label>
                  <Input
                    id="duree_prolongation"
                    type="number"
                    min="1"
                    value={settings.general.duree_prolongation}
                    onChange={(e) => handleSettingChange('general', 'duree_prolongation', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Textarea
                  id="adresse"
                  value={settings.general.adresse}
                  onChange={(e) => handleSettingChange('general', 'adresse', e.target.value)}
                  rows={2}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaires_ouverture">Horaires d'ouverture</Label>
                <Textarea
                  id="horaires_ouverture"
                  value={settings.general.horaires_ouverture}
                  onChange={(e) => handleSettingChange('general', 'horaires_ouverture', e.target.value)}
                  placeholder="Lundi-Vendredi: 8h-18h, Samedi: 9h-17h"
                  rows={3}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('general')} 
                  disabled={saving.general}
                  className="w-full sm:w-auto"
                >
                  {saving.general ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres des emprunts */}
        <TabsContent value="emprunts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Paramètres des Emprunts
              </CardTitle>
              <CardDescription>
                Configuration des règles d'emprunt et des sanctions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limite_emprunts_etudiant">Limite d'emprunts - Étudiants</Label>
                  <Input
                    id="limite_emprunts_etudiant"
                    type="number"
                    min="1"
                    value={settings.emprunts.limite_emprunts_etudiant}
                    onChange={(e) => handleSettingChange('emprunts', 'limite_emprunts_etudiant', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite_emprunts_enseignant">Limite d'emprunts - Enseignants</Label>
                  <Input
                    id="limite_emprunts_enseignant"
                    type="number"
                    min="1"
                    value={settings.emprunts.limite_emprunts_enseignant}
                    onChange={(e) => handleSettingChange('emprunts', 'limite_emprunts_enseignant', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_emprunt_livre">Durée d'emprunt - Livres (jours)</Label>
                  <Input
                    id="duree_emprunt_livre"
                    type="number"
                    min="1"
                    value={settings.emprunts.duree_emprunt_livre}
                    onChange={(e) => handleSettingChange('emprunts', 'duree_emprunt_livre', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_emprunt_periodique">Durée d'emprunt - Périodiques (jours)</Label>
                  <Input
                    id="duree_emprunt_periodique"
                    type="number"
                    min="1"
                    value={settings.emprunts.duree_emprunt_periodique}
                    onChange={(e) => handleSettingChange('emprunts', 'duree_emprunt_periodique', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalite_retard_par_jour">Pénalité par jour de retard (FCFA)</Label>
                  <Input
                    id="penalite_retard_par_jour"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.emprunts.penalite_retard_par_jour}
                    onChange={(e) => handleSettingChange('emprunts', 'penalite_retard_par_jour', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_suspension_retard">Durée de suspension pour retard (jours)</Label>
                  <Input
                    id="duree_suspension_retard"
                    type="number"
                    min="0"
                    value={settings.emprunts.duree_suspension_retard}
                    onChange={(e) => handleSettingChange('emprunts', 'duree_suspension_retard', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('emprunts')} 
                  disabled={saving.emprunts}
                  className="w-full sm:w-auto"
                >
                  {saving.emprunts ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres des réservations */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Paramètres des Réservations
              </CardTitle>
              <CardDescription>
                Configuration du système de réservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duree_reservation">Durée de réservation (jours)</Label>
                  <Input
                    id="duree_reservation"
                    type="number"
                    min="1"
                    value={settings.reservations.duree_reservation}
                    onChange={(e) => handleSettingChange('reservations', 'duree_reservation', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_reservations_max">Nombre maximum de réservations par utilisateur</Label>
                  <Input
                    id="nombre_reservations_max"
                    type="number"
                    min="1"
                    value={settings.reservations.nombre_reservations_max}
                    onChange={(e) => handleSettingChange('reservations', 'nombre_reservations_max', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Label htmlFor="notification_disponibilite">Notification de disponibilité</Label>
                    <p className="text-sm text-gray-600">Notifier l'utilisateur quand le livre devient disponible</p>
                  </div>
                  <Switch
                    id="notification_disponibilite"
                    checked={settings.reservations.notification_disponibilite}
                    onCheckedChange={(checked) => handleSettingChange('reservations', 'notification_disponibilite', checked)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Label htmlFor="annulation_automatique">Annulation automatique</Label>
                    <p className="text-sm text-gray-600">Annuler automatiquement les réservations expirées</p>
                  </div>
                  <Switch
                    id="annulation_automatique"
                    checked={settings.reservations.annulation_automatique}
                    onCheckedChange={(checked) => handleSettingChange('reservations', 'annulation_automatique', checked)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('reservations')} 
                  disabled={saving.reservations}
                  className="w-full sm:w-auto"
                >
                  {saving.reservations ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres des notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres des Notifications
              </CardTitle>
              <CardDescription>
                Configuration du système de notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jours_avant_rappel">Jours avant rappel d'échéance</Label>
                  <Input
                    id="jours_avant_rappel"
                    type="number"
                    min="1"
                    value={settings.notifications.jours_avant_rappel}
                    onChange={(e) => handleSettingChange('notifications', 'jours_avant_rappel', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_administrateur">Email administrateur</Label>
                  <Input
                    id="email_administrateur"
                    type="email"
                    value={settings.notifications.email_administrateur}
                    onChange={(e) => handleSettingChange('notifications', 'email_administrateur', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Label htmlFor="rappel_avant_echeance">Rappel avant échéance</Label>
                    <p className="text-sm text-gray-600">Envoyer un rappel avant l'échéance d'emprunt</p>
                  </div>
                  <Switch
                    id="rappel_avant_echeance"
                    checked={settings.notifications.rappel_avant_echeance}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'rappel_avant_echeance', checked)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Label htmlFor="notification_retard">Notification de retard</Label>
                    <p className="text-sm text-gray-600">Notifier en cas de retard de retour</p>
                  </div>
                  <Switch
                    id="notification_retard"
                    checked={settings.notifications.notification_retard}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'notification_retard', checked)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <Label htmlFor="notification_reservation">Notification de réservation</Label>
                    <p className="text-sm text-gray-600">Notifier lors de nouvelles réservations</p>
                  </div>
                  <Switch
                    id="notification_reservation"
                    checked={settings.notifications.notification_reservation}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'notification_reservation', checked)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('notifications')} 
                  disabled={saving.notifications}
                  className="w-full sm:w-auto"
                >
                  {saving.notifications ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paramètres de sécurité */}
        <TabsContent value="securite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configuration de la sécurité et des accès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duree_session">Durée de session (minutes)</Label>
                  <Input
                    id="duree_session"
                    type="number"
                    min="30"
                    value={settings.securite.duree_session}
                    onChange={(e) => handleSettingChange('securite', 'duree_session', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tentatives_connexion_max">Tentatives de connexion maximum</Label>
                  <Input
                    id="tentatives_connexion_max"
                    type="number"
                    min="3"
                    value={settings.securite.tentatives_connexion_max}
                    onChange={(e) => handleSettingChange('securite', 'tentatives_connexion_max', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_blocage_compte">Durée de blocage de compte (minutes)</Label>
                  <Input
                    id="duree_blocage_compte"
                    type="number"
                    min="15"
                    value={settings.securite.duree_blocage_compte}
                    onChange={(e) => handleSettingChange('securite', 'duree_blocage_compte', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mot_de_passe_min_length">Longueur minimum du mot de passe</Label>
                  <Input
                    id="mot_de_passe_min_length"
                    type="number"
                    min="6"
                    value={settings.securite.mot_de_passe_min_length}
                    onChange={(e) => handleSettingChange('securite', 'mot_de_passe_min_length', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('securite')} 
                  disabled={saving.securite}
                  className="w-full sm:w-auto"
                >
                  {saving.securite ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Actions Système
          </CardTitle>
          <CardDescription>
            Maintenance et sauvegarde du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleBackupDatabase} 
              disabled={saving.backup}
              variant="outline"
              className="flex-1"
            >
              {saving.backup ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Sauvegarder la base de données
            </Button>
            <Button 
              onClick={handleClearCache} 
              disabled={saving.cache}
              variant="outline"
              className="flex-1"
            >
              {saving.cache ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Vider le cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Administration;

