import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Calendar, DollarSign, Download, AlertCircle, Target, Clock, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Statistics = () => {
  const { hasRole } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const canViewStatistics = hasRole('bibliothecaire') || hasRole('administrateur');

  // Génération dynamique des années disponibles
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year.toString());
    }
    return years;
  };

  useEffect(() => {
    if (canViewStatistics) {
      loadStatistics();
    }
  }, [selectedPeriod, selectedYear, canViewStatistics]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        period: selectedPeriod,
        year: selectedYear
      };

      const response = await apiService.getStatistics(params);
      
      if (response.success && response.data) {
        // Adaptation à la nouvelle structure de données
        const normalizedData = normalizeBackendData(response.data);
        setStatistics(normalizedData);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement des statistiques');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour adapter les données du backend à la structure attendue par le composant
  const normalizeBackendData = (backendData) => {
    // Extraction des données principales
    const general = backendData.general || {};
    const parPeriode = backendData.par_periode || {};
    const taux = backendData.taux || {};
    const topCategories = backendData.top_categories || [];
    const topLivres = backendData.top_livres || [];
    const topUtilisateurs = backendData.top_utilisateurs || [];

    // Transformation des catégories populaires
    const categoriesPopulaires = topCategories.map((cat) => ({
      nom: cat.nom || 'Catégorie inconnue',
      emprunts: Number(cat.emprunts_count) || 0,
      pourcentage: topCategories.length > 0 ? 
        Math.round((Number(cat.emprunts_count) || 0) / topCategories.reduce((sum, c) => sum + (Number(c.emprunts_count) || 0), 0) * 100) : 0
    }));

    // Transformation des livres populaires
    const livresPopulaires = topLivres.map(livre => ({
      titre: livre.titre || 'Titre inconnu',
      auteur: livre.auteur || 'Auteur inconnu',
      emprunts: Number(livre.emprunts_count) || 0
    }));

    // Création de données pour les graphiques temporels basées sur les données par période
    const empruntsParPeriode = [
      { periode: "Aujourd'hui", emprunts: Number(parPeriode.emprunts_aujourd_hui) || 0 },
      { periode: "Cette semaine", emprunts: Number(parPeriode.emprunts_cette_semaine) || 0 },
      { periode: "Ce mois", emprunts: Number(parPeriode.emprunts_ce_mois) || 0 },
      { periode: "Cette année", emprunts: Number(parPeriode.emprunts_cette_annee) || 0 }
    ];

    // Données sur les utilisateurs (basées sur les données disponibles)
    const utilisateursActifs = [
      { 
        type: 'Utilisateurs actifs', 
        nombre: Number(general.total_utilisateurs) || 0, 
        couleur: '#10B981' 
      },
      { 
        type: 'Total des emprunts', 
        nombre: Number(general.total_emprunts) || 0, 
        couleur: '#3B82F6' 
      },
      { 
        type: 'Réservations', 
        nombre: Number(general.total_reservations) || 0, 
        couleur: '#F59E0B' 
      }
    ];

    // Données sur les taux de performance
    const indicateursTaux = [
      { 
        nom: 'Taux d\'occupation', 
        valeur: Number(taux.taux_occupation) || 0, 
        unite: '%',
        couleur: '#10B981'
      },
      { 
        nom: 'Taux de retard', 
        valeur: Number(taux.taux_retard) || 0, 
        unite: '%',
        couleur: '#EF4444'
      },
      { 
        nom: 'Durée moyenne d\'emprunt', 
        valeur: Number(taux.duree_moyenne_emprunt) || 0, 
        unite: ' jours',
        couleur: '#3B82F6'
      },
      { 
        nom: 'Livres par utilisateur', 
        valeur: Number(taux.livres_par_utilisateur) || 0, 
        unite: '',
        couleur: '#8B5CF6'
      }
    ];

    return {
      overview: {
        total_livres: Number(general.total_livres) || 0,
        total_utilisateurs: Number(general.total_utilisateurs) || 0,
        emprunts_actifs: Number(general.total_emprunts) || 0,
        total_reservations: Number(general.total_reservations) || 0
      },
      par_periode: parPeriode,
      taux: taux,
      categories_populaires: categoriesPopulaires,
      livres_populaires: livresPopulaires,
      utilisateurs_actifs: utilisateursActifs,
      emprunts_par_periode: empruntsParPeriode,
      indicateurs_taux: indicateursTaux,
      top_utilisateurs: topUtilisateurs
    };
  };

  const handleExportData = async () => {
    try {
      if (!statistics) {
        throw new Error('Aucune donnée à exporter');
      }

      // Tentative d'export via l'API
      try {
        const response = await apiService.exportStatistics({
          period: selectedPeriod,
          year: selectedYear,
          format: 'json'
        });
        
        if (response.success && response.downloadUrl) {
          window.open(response.downloadUrl, '_blank');
          return;
        }
      } catch (apiError) {
        console.warn('Export via API non disponible, utilisation du fallback local:', apiError);
      }

      // Fallback : export local
      const exportData = {
        metadata: {
          periode: selectedPeriod,
          annee: selectedYear,
          date_export: new Date().toISOString(),
          version: '2.0'
        },
        donnees: statistics
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistiques_bibliotheque_${selectedYear}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'export des données');
    }
  };

  // formatCurrency n'est plus utilisée directement pour l'affichage des statistiques
  // mais peut être conservée si elle est utilisée ailleurs ou pour de futures fonctionnalités.
  // Pour l'instant, je la commente pour éviter l'avertissement ESLint.
  /*
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(amount) || 0);
  };
  */

  const formatNumber = (number) => {
    return new Intl.NumberFormat('fr-FR').format(Number(number) || 0);
  };

  // formatPercentage n'est plus utilisée directement pour l'affichage des statistiques
  // mais peut être conservée si elle est utilisée ailleurs ou pour de futures fonctionnalités.
  // Pour l'instant, je la commente pour éviter l'avertissement ESLint.
  /*
  const formatPercentage = (number) => {
    return `${Number(number).toFixed(1)}%`;
  };
  */

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  // Composant pour afficher un message d'erreur
  const ErrorMessage = ({ message, onRetry }) => (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );

  // Composant pour afficher un graphique vide
  const EmptyChart = ({ title, description }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!canViewStatistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder aux statistiques.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && <ErrorMessage message={error} onRetry={loadStatistics} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600">Analyse des données de la bibliothèque</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {generateYearOptions().map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={!statistics || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {statistics ? (
        <>
          {/* Vue d'ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des livres</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.overview.total_livres)}</div>
                <p className="text-xs text-muted-foreground">
                  Collection de la bibliothèque
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.overview.total_utilisateurs)}</div>
                <p className="text-xs text-muted-foreground">
                  Membres inscrits
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des emprunts </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.overview.emprunts_actifs)}</div>
                <p className="text-xs text-muted-foreground">
                  Livres actuellement empruntés
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.overview.total_reservations)}</div>
                <p className="text-xs text-muted-foreground">
                  Livres réservés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Indicateurs de performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statistics.indicateurs_taux.map((indicateur, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{indicateur.nom}</CardTitle>
                  {indicateur.nom.includes('Taux') ? (
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: indicateur.couleur }}>
                    {indicateur.valeur}{indicateur.unite}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Indicateur de performance
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Graphiques principaux */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emprunts par période */}
            {statistics.emprunts_par_periode.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Emprunts par période</CardTitle>
                  <CardDescription>Évolution des emprunts sur différentes périodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statistics.emprunts_par_periode}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periode" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(value), 'Emprunts']} />
                      <Bar dataKey="emprunts" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Emprunts par période" 
                description="Évolution des emprunts sur différentes périodes" 
              />
            )}

            {/* Catégories populaires */}
            {statistics.categories_populaires.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Catégories populaires</CardTitle>
                  <CardDescription>Répartition des emprunts par catégorie</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statistics.categories_populaires}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nom, pourcentage }) => `${nom} (${pourcentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="emprunts"
                      >
                        {statistics.categories_populaires.map((entry, _index) => (
                          <Cell key={`cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(value), 'Emprunts']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <EmptyChart 
                title="Catégories populaires" 
                description="Répartition des emprunts par catégorie" 
              />
            )}
          </div>

          {/* Tableaux de données */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Livres populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Livres les plus empruntés</CardTitle>
                <CardDescription>Top des livres les plus populaires</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics.livres_populaires.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.livres_populaires.map((livre, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{livre.titre}</p>
                          <p className="text-sm text-gray-600 truncate">par {livre.auteur}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {formatNumber(livre.emprunts)} emprunts
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun livre populaire à afficher</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Répartition des activités */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des activités</CardTitle>
                <CardDescription>Types d'activités dans la bibliothèque</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics.utilisateurs_actifs.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.utilisateurs_actifs.map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: type.couleur }}
                          ></div>
                          <span className="font-medium">{type.type}</span>
                        </div>
                        <Badge variant="secondary">
                          {formatNumber(type.nombre)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée d'activité à afficher</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Utilisateurs les plus actifs */}
          {statistics.top_utilisateurs && statistics.top_utilisateurs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs les plus actifs</CardTitle>
                <CardDescription>Top des utilisateurs par nombre d'emprunts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.top_utilisateurs.slice(0, 5).map((utilisateur, index) => (
                    <div key={utilisateur.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {utilisateur.prenom} {utilisateur.nom}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{utilisateur.email}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-600 mb-4">
            Aucune statistique n'est disponible pour la période sélectionnée.
          </p>
          <Button onClick={loadStatistics} variant="outline">
            Actualiser
          </Button>
        </div>
      )}
    </div>
  );
};

export default Statistics;

