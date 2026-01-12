import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function CustomerProfile() {
  const { customer } = useAuth();

  if (!customer) return <div className="p-6">Chargement...</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
        <h2 className="text-2xl font-bold text-white">Mon Profil</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Nom : On utilise 'nom' venant du Java */}
        <div className="flex items-center gap-4">
          <User className="text-blue-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Nom complet</p>
            <p className="text-lg font-medium">{customer.nom || "Utilisateur"}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-4">
          <Mail className="text-purple-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Email</p>
            <p className="text-lg font-medium">{customer.email}</p>
          </div>
        </div>

        {/* Téléphone : mapping avec 'telephone' */}
        <div className="flex items-center gap-4">
          <Phone className="text-green-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Téléphone</p>
            <p className="text-lg font-medium">{customer.telephone || 'Non renseigné'}</p>
          </div>
        </div>

        {/* Adresse : mapping avec 'adresse' */}
        <div className="flex items-start gap-4">
          <MapPin className="text-orange-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Adresse</p>
            <p className="text-lg font-medium">{customer.adresse || 'Aucune adresse'}</p>
          </div>
        </div>

        {/* Date : mapping avec 'createdAt' */}
        <div className="mt-8 pt-6 border-t flex justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <p>Membre depuis : {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}