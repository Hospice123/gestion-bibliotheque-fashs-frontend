import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, BookOpen, Eye, EyeOff, Info, Users, MapPin, Phone, Mail } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection après connexion
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Erreur lors de la connexion');
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite',err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Section informative - Visible sur desktop */}
          <div className="hidden lg:block space-y-6">
            {/* Logo et titre principal */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-4">
                <div className="p-4 bg-primary rounded-full">
                  <BookOpen className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bibliothèque Universitaire
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Système de gestion moderne et intuitif
              </p>
            </div>

            {/* Informations sur les services */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  Services disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Catalogue numérique</h4>
                      <p className="text-sm text-gray-600">Recherchez et réservez vos ouvrages en ligne</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Gestion des emprunts</h4>
                      <p className="text-sm text-gray-600">Suivez vos emprunts et prolongations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Notifications automatiques</h4>
                      <p className="text-sm text-gray-600">Recevez des rappels par email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Informations pratiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Campus Universitaire, Bibliothèque FASHS </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">+229 01 90 57 38 95</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">sodehospice@gmail.com</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section de connexion */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Logo et titre pour mobile */}
            <div className="text-center mb-8 lg:hidden">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary rounded-full">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bibliothèque Universitaire
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Connectez-vous à votre compte
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl lg:text-2xl">Connexion</CardTitle>
                <CardDescription className="text-base">
                  Accédez à votre espace personnel
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votreEmail@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Votre mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="h-11 pr-10"
                      />
                       <br/>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={!isFormValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>

                  {/* Informations pour les nouveaux utilisateurs */}
                  <div className="w-full">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2">
                            <h4 className="font-medium text-blue-900 text-sm">
                              Nouveau à la bibliothèque ?
                            </h4>
                            <p className="text-sm text-blue-800 leading-relaxed">
                              Les <strong>emprunteurs</strong> (étudiants et enseignants) doivent s'inscrire 
                              directement auprès de la bibliothèque avec une pièce d'identité et un justificatif 
                              de statut universitaire.
                            </p>
                            <div className="pt-2 space-y-1">
                              <p className="text-xs text-blue-700">
                                <strong>Horaires d'inscription :</strong> Lundi-Vendredi 8h-18h
                              </p>
                              <p className="text-xs text-blue-700">
                                <strong>Lieu :</strong> Accueil de la bibliothèque
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lien vers l'inscription pour le personnel */}
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                      Personnel de la bibliothèque ?{' '}
                    </span>
                    <Link
                      to="/register"
                      className="text-primary hover:underline font-medium"
                    >
                      Créer un compte
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>

            {/* Informations de contact pour mobile */}
            <div className="mt-6 lg:hidden">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-center">Contact</h4>
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">+229 01 90 57 38 95</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">sodehospice@gmail.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

