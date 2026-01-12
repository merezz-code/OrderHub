import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, AlertTriangle, Plus } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import * as api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { AddProductForm } from './AddProductForm';

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
  // États pour les données et le statut
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false); // État pour afficher le formulaire
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger les produits. Vérifiez la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Extraction dynamique des catégories pour le filtre
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  
  // Logique de filtrage (Recherche + Catégorie + Produits actifs uniquement)
  const filteredProducts = products.filter(product => {
  const matchesSearch =
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

  // Si isActive est undefined ou null, on l'affiche quand même par défaut
  const isAvailable = product.isActive !== false; 

  return matchesSearch && matchesCategory && isAvailable;
});

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Chargement du catalogue...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg flex items-center gap-4 my-8">
        <AlertTriangle className="w-8 h-8" />
        <div>
          <h3 className="font-bold">Erreur de chargement</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Catalogue Produits</h1>
          <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {/* Barre de recherche - prend le maximum d'espace disponible */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Filtre par catégorie */}
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer outline-none transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes les catégories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Ajouter - Aligné à droite sur PC, plein écran sur mobile */}
          {isAdmin && ( 
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau Produit</span>
          </button>)}
        </div>
      </div>

      {/* Grille de produits */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg font-medium">Aucun produit ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
      {showAddForm && (
        <AddProductForm
          onClose={() => setShowAddForm(false)}
          onProductAdded={() => {
            loadProducts(); // On recharge la liste depuis SQLite
            setShowAddForm(false); // On ferme la modale
          }}
        />
      )}
    </div>
  );
}