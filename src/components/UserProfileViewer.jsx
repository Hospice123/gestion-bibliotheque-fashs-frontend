import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

const UserProfileViewer = ({ user }) => {
  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Aucun utilisateur sélectionné.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide', error;
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'administrateur': { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
      'bibliothecaire': { label: 'Bibliothécaire', className: 'bg-blue-100 text-blue-800' },
      'emprunteur': { label: 'Emprunteur', className: 'bg-green-100 text-green-800' },
      'etudiant': { label: 'Étudiant', className: 'bg-purple-100 text-purple-800' },
      'enseignant': { label: 'Enseignant', className: 'bg-orange-100 text-orange-800' }
    };
    const config = roleConfig[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const InfoField = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="text-gray-500 mt-1">{icon}</div>
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium text-gray-600">{label}</Label>
        <p className="text-sm text-gray-900 font-medium break-words">
          {value || <span className="text-gray-400 italic">Non renseigné</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {user.prenom} {user.nom}
              </CardTitle>
              <CardDescription>{getRoleBadge(user.role)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <InfoField icon={<Phone className="h-4 w-4" />} label="Téléphone" value={user.telephone} />
            <InfoField icon={<Calendar className="h-4 w-4" />} label="Date de naissance" value={formatDate(user.date_naissance)} />
            {(user.role === 'etudiant' || user.numero_etudiant) && (
              <InfoField icon={<User className="h-4 w-4" />} label="Numéro étudiant" value={user.numero_etudiant} />
            )}
            <div className="md:col-span-2">
              <InfoField icon={<MapPin className="h-4 w-4" />} label="Adresse" value={user.adresse} />
            </div>
            <div className="md:col-span-2">
              <InfoField icon={<CheckCircle className="h-4 w-4" />} label="Inscrit le" value={formatDate(user.created_at)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileViewer;


