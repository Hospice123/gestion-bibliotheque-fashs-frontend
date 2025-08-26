import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import {
  BookOpen,
  BookMarked,
  Calendar,
  AlertTriangle,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import apiService from '../lib/api';
import { Link } from 'react-router-dom';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount || 0);
};

const Dashboard = () => {
  const { user, hasRole, getBorrowingInfo } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const borrowingInfo = getBorrowingInfo();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getDashboard();
        if (response?.success) {
          setDashboardData(response.data);
        } else {
          setError(response?.message || 'Erreur lors du chargement des données.');
        }
      } catch (err) {
        setError('Erreur lors du chargement des données.');
        console.error('Erreur dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'emprunteur': return 'Étudiant';
      case 'bibliothecaire': return 'Bibliothécaire';
      case 'administrateur': return 'Administrateur';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const quickAction = (to, icon, label, variant = 'default') => (
    <Button asChild variant={variant} className="w-full justify-start">
      <Link to={to}>
        {icon}
        {label}
      </Link>
    </Button>
  );

  if (hasRole('emprunteur')) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {user?.prenom} !</h1>
          <p className="text-muted-foreground">Voici un aperçu de votre activité à la bibliothèque</p>
        </div>

        {borrowingInfo?.hasActiveSanctions && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Vous avez des sanctions actives. <Link to="/my-sanctions" className="ml-1 underline">Voir les détails</Link>
            </AlertDescription>
          </Alert>
        )}

        {borrowingInfo?.unpaidFines > 0 && (
          <Alert variant="destructive">
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Vous avez {formatCurrency(borrowingInfo?.unpaidFines)} d'amendes impayées. <Link to="/my-sanctions" className="ml-1 underline">Payer maintenant</Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardStat title="Emprunts actifs" icon={<BookMarked className="h-4 w-4 text-muted-foreground" />} value={`${borrowingInfo?.current || 0} / ${borrowingInfo?.limit || 5}`} subtitle={borrowingInfo?.canBorrow ? 'Vous pouvez emprunter' : 'Limite atteinte'} />
          <CardStat title="Réservations" icon={<Calendar className="h-4 w-4 text-muted-foreground" />} value={dashboardData?.reservations_actives || 0} subtitle="En attente" />
          <CardStat title="Livres en retard" icon={<Clock className="h-4 w-4 text-muted-foreground" />} value={dashboardData?.emprunts_en_retard || 0} subtitle="À retourner rapidement" color="text-destructive" />
          <CardStat title="Amendes" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} value={formatCurrency(borrowingInfo?.unpaidFines)} subtitle="À payer" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickAction('/catalog', <BookOpen className="mr-2 h-4 w-4" />, 'Parcourir le catalogue')}
              {quickAction('/search', <BookOpen className="mr-2 h-4 w-4" />, 'Rechercher un livre', 'outline')}
              {quickAction('/my-borrows', <BookMarked className="mr-2 h-4 w-4" />, 'Voir mes emprunts', 'outline')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Livres populaires</CardTitle>
              <CardDescription>Les livres les plus empruntés cette semaine</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.livres_populaires?.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.livres_populaires.slice(0, 3).map((livre) => (
                    <div key={livre.id} className="flex items-center space-x-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{livre.titre}</p>
                        <p className="text-xs text-muted-foreground truncate">{livre.auteur}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{livre.emprunts_count} emprunts</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {user?.prenom} !</h1>
        <p className="text-muted-foreground">Tableau de bord {getRoleDisplayName(user?.role)} - Vue d'ensemble de la bibliothèque</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardStat title="Emprunts actifs" icon={<BookMarked className="h-4 w-4 text-muted-foreground" />} value={dashboardData?.emprunts_actifs || 0} subtitle={`+${dashboardData?.emprunts_aujourd_hui || 0} aujourd'hui`} />
        <CardStat title="Livres en retard" icon={<Clock className="h-4 w-4 text-muted-foreground" />} value={dashboardData?.emprunts_en_retard || 0} subtitle="Nécessitent une attention" color="text-destructive" />
        <CardStat title="Utilisateurs actifs" icon={<Users className="h-4 w-4 text-muted-foreground" />} value={dashboardData?.utilisateurs_actifs || 0} subtitle="Inscrits à la bibliothèque" />
        <CardStat title="Amendes actives" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} value={`${dashboardData?.amendes_actives || 0} FCFA`} subtitle="Total à recouvrer" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités de gestion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickAction('/admin/borrows', <BookMarked className="mr-2 h-4 w-4" />, 'Gérer les emprunts')}
            {quickAction('/admin/books', <BookMarked className="mr-2 h-4 w-4" />, 'Gérer les livres')}
            {quickAction('/admin/users', <BookMarked className="mr-2 h-4 w-4" />, 'Gérer les utilisateurs')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières actions dans le système</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.activite_recente?.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.activite_recente.slice(0, 5).map((activite, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activite.description}</p>
                      <p className="text-xs text-muted-foreground">{activite.date}</p>
                    </div>
                    {activite.type === 'emprunt' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {activite.type === 'retard' && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CardStat = ({ title, icon, value, subtitle, color = '' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);

export default Dashboard;

