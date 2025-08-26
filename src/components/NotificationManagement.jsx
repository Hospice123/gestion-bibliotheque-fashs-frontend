import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Trash2, MailOpen, XCircle, Loader2, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';

const NotificationManagement = () => {
  const { hasAnyRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  const canManageNotifications = hasAnyRole(['administrateur', 'bibliothecaire', 'emprunteur', 'etudiant']);

  const fetchNotifications = useCallback(async () => {
    if (!canManageNotifications) return;
    setLoading(true);
    setError('');
    try {
      let response;
      if (filter === 'unread') {
        response = await apiService.getNotificationsNonLues();
      } else {
        response = await apiService.getNotifications();
      }
      if (response.success) {
        // Les données réelles des notifications sont dans response.data.data
        // Si l'API getNotificationsNonLues retourne directement le tableau de notifications non lues,
        // alors response.data devrait être le tableau, pas response.data.data.
        // Nous allons vérifier si response.data est un tableau, sinon nous supposons que c'est paginé.
        const fetchedData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setNotifications(fetchedData);
      } else {
        setError(response.message || 'Erreur lors du chargement des notifications.');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }, [canManageNotifications, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refetch notifications whenever the filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filter, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await apiService.marquerNotificationLue(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => (notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif))
        );
      } else {
        setError(response.message || 'Erreur lors du marquage comme lue.');
      }
    } catch (err) {
      console.error('Erreur lors du marquage comme lue:', err);
      setError(err.message || 'Erreur de connexion au serveur.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiService.marquerToutesNotificationsLues();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
        );
      } else {
        setError(response.message || 'Erreur lors du marquage de toutes les notifications comme lues.');
      }
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
      setError(err.message || 'Erreur de connexion au serveur.');
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return;
    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      } else {
        setError(response.message || 'Erreur lors de la suppression de la notification.');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
      setError(err.message || 'Erreur de connexion au serveur.');
    }
  };

  const handleDeleteReadNotifications = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications lues ?')) return;
    try {
      // Assumons que l'API a une route spécifique pour cela, sinon on doit le faire côté client ou une boucle d'appels
      // D'après vos routes Laravel, il y a `Route::delete("read", [NotificationController::class, "deleteRead"]);`
      const response = await apiService.deleteReadNotifications(); // Cette méthode doit être ajoutée à api.js
      if (response.success) {
        setNotifications(prev => prev.filter(notif => !notif.read_at)); // Garder seulement les non lues
      } else {
        setError(response.message || 'Erreur lors de la suppression des notifications lues.');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression des notifications lues:', err);
      setError(err.message || 'Erreur de connexion au serveur.');
    }
  };

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(notif => !notif.read_at) 
    : notifications;

  if (!canManageNotifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès non autorisé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder aux notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex space-x-2">
          <Button onClick={handleMarkAllAsRead} disabled={loading || notifications.length === 0}>
            <MailOpen className="h-4 w-4 mr-2" /> Marquer tout comme lu
          </Button>
          <Button onClick={handleDeleteReadNotifications} disabled={loading || (Array.isArray(notifications) ? notifications.filter(n => n.read_at).length === 0 : true)} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer les lues
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Toutes</Button>
        <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>Non lues</Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && displayedNotifications.length === 0 && !error && (
        <p className="text-center text-gray-500">Aucune notification à afficher.</p>
      )}

      <div className="space-y-4">
        {Array.isArray(displayedNotifications) && displayedNotifications.map(notif => (
          <Card key={notif.id} className={notif.read_at ? 'opacity-70' : 'border-blue-500'}>
            <CardContent className="p-4 flex items-start space-x-4">
              <div className="flex-shrink-0">
                {notif.read_at ? (
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                ) : (
                  <Bell className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="flex-grow">
                <CardTitle className="text-lg font-semibold">{notif.title || 'Notification'}</CardTitle>
                <CardDescription className="text-gray-700 mt-1">{notif.message}</CardDescription>
                <p className="text-sm text-gray-500 mt-2">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Date inconnue'}
                  {notif.read_at && (
                    <span className="ml-2 text-xs text-gray-400">(Lue le {new Date(notif.read_at).toLocaleString()})</span>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                {!notif.read_at && (
                  <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleDeleteNotification(notif.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationManagement;

