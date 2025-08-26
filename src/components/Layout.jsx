import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';
import {
  BookOpen,
  Users,
  BookMarked,
  AlertTriangle,
  Bell,
  Settings,
  LogOut,
  Menu,
  Home,
  Search,
  Calendar,
  BarChart3,
  UserCheck,
  BookPlus,
  Clock,
  DollarSign
} from 'lucide-react';

const Layout = () => {
  // Utilisation des fonctions du contexte d'authentification
  const { 
    user, 
    logout,  
    hasAnyRole, 
    getBorrowingInfo, 
    getUserDisplayName, 
    getUserInitials, 
    getRoleLabel 
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const borrowingInfo = getBorrowingInfo();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Rediriger quand même vers la page de connexion
      navigate('/login');
    }
  };

  // Navigation items basés sur les rôles
  const getNavigationItems = () => {
    const items = [
      {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: Home,
        roles: ['emprunteur', 'bibliothecaire', 'administrateur']
      },
      {
        title: 'Catalogue',
        href: '/catalog',
        icon: BookOpen,
        roles: ['emprunteur', 'bibliothecaire', 'administrateur']
      },
      {
        title: 'Recherche',
        href: '/search',
        icon: Search,
        roles: ['emprunteur', 'bibliothecaire', 'administrateur']
      },
      {
        title: 'Mes emprunts',
        href: '/my-borrows',
        icon: BookMarked,
        roles: ['emprunteur']
      },
      {
        title: 'Mes réservations',
        href: '/my-reservations',
        icon: Calendar,
        roles: ['emprunteur']
      },
      {
        title: 'Mes sanctions',
        href: '/my-sanctions',
        icon: AlertTriangle,
        roles: ['emprunteur']
      },
      {
        title: 'Gestion des livres',
        href: '/admin/books',
        icon: BookPlus,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Gestion des emprunts',
        href: '/admin/borrows',
        icon: Clock,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Gestion des réservations',
        href: '/admin/reservations',
        icon: Calendar,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Gestion des utilisateurs',
        href: '/admin/users',
        icon: Users,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Sanctions',
        href: '/admin/sanctions',
        icon: DollarSign,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Statistiques',
        href: '/admin/statistics',
        icon: BarChart3,
        roles: ['bibliothecaire', 'administrateur']
      },
      {
        title: 'Administration',
        href: '/admin/settings',
        icon: Settings,
        roles: ['administrateur']
      }
    ];

    return items.filter(item => hasAnyRole(item.roles));
  };

  const navigationItems = getNavigationItems();

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'administrateur':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'bibliothecaire':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'emprunteur':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const NavigationContent = () => (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Mobile menu trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 px-3 py-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">Bibliothèque</span>
                </div>
                <div className="flex-1 px-3">
                  <NavigationContent />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">
              Bibliothèque Universitaire
            </span>
          </div>

          <div className="flex-1" />

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Borrowing info for students */}
            {user?.role === 'emprunteur' && borrowingInfo && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <BookMarked className="h-4 w-4" />
                <span>
                  {borrowingInfo.current}/{borrowingInfo.limit}
                </span>
                {borrowingInfo.unpaidFines > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {borrowingInfo.unpaidFines} FCFA
                  </Badge>
                )}
              </div>
            )}

            {/* Notifications */}
            <Link to="/notifications" className="cursor-pointer">
                    <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                   </Button>
              </Link>
            

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <Badge className={`w-fit text-xs ${getRoleBadgeColor()}`}>
                      {getRoleLabel()}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 top-16 border-r bg-background">
          <div className="flex-1 overflow-auto p-4">
            <NavigationContent />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

