import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Users, Package, ShoppingBag, LayoutDashboard, Edit2, Trash2, Plus } from 'lucide-react';
import * as api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type AdminTab = 'stats' | 'clients' | 'products' | 'orders';
interface AdminDashboardProps {
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
}

export function AdminDashboard({ setStatusMessage }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, totalProducts: 0, totalOrders: 0 });
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, stockQuantity: 0 });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ clientId: '', productId: '', quantity: 1 });
  const [productsList, setProductsList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  // 2. Récupère l'utilisateur ici
  const { user } = useAuth();
  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };
  //console.log("Utilisateur actuel:", user);

  const handleCreateOrder = async () => {
    // 1. Récupérer le token brut (indispensable pour avoir le sub)
    const token = (user as any)?.access_token || localStorage.getItem('token');

    // 2. Décoder le token pour extraire le 'sub' (ID Keycloak)
    let currentAdminId = null;
    if (token) {
      const decoded = parseJwt(token);
      currentAdminId = decoded?.sub;
    }

    // 3. Récupérer le produit pour le prix
    const selectedProduct = productsList.find(p => String(p.id) === String(newOrder.productId));

    // 4. VERIFICATION LOGS (Regarde ta console F12)
    console.log("ID trouvé via décodage:", currentAdminId);

    if (!currentAdminId || !selectedProduct) {
      setStatusMessage("Erreur : Impossible de récupérer votre ID Client ou le Produit.");
      return;
    }

    try {
      const orderData = {
        clientId: currentAdminId, // Envoie l'UUID Keycloak
        productId: selectedProduct.id,
        quantity: newOrder.quantity,
        totalPrice: selectedProduct.price * newOrder.quantity
      };

      await api.createOrder(orderData);

      // Rafraîchir
      const updatedOrders = await api.fetchAllOrders();
      setData(updatedOrders);

      setShowOrderForm(false);
      setStatusMessage("Commande créée avec succès !");
    } catch (err) {
      setStatusMessage("Erreur lors de l'enregistrement.");
    }
  };
  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity
    });
  };
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProduct(editingProduct.id, editForm);

      // Rafraîchir la liste et fermer le formulaire
      const updatedProducts = await api.getProducts();
      setData(updatedProducts);
      setEditingProduct(null);

      setStatusMessage("Produit mis à jour !");
    } catch (error) {
      setStatusMessage("Erreur lors de la modification");
    }
  };
  const handleDeleteClick = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      try {
        await api.deleteProduct(id);
        // Rafraîchir les données après suppression
        const updatedProducts = await api.getProducts();
        setData(updatedProducts);
        setStatusMessage("Produit supprimé avec succès !"); // Si tu as gardé la méthode simple
      } catch (error) {
        setStatusMessage("Erreur lors de la suppression.");
      }
    }
  };
  const getProductName = (item: any) => {
    // Sécurité : si l'item de la ligne est nul
    if (!item) return "Donnée invalide";

    const pId = item.productId || item.idProduit;
    const product = productsList.find(p => String(p.id) === String(pId));

    if (product) return product.name;
    return item.productName || `Produit #${pId || 'Inconnu'}`;
  };

  const getClientName = (item: any) => {
    if (!item) return "Inconnu";

    // On récupère l'ID quel que soit son nom dans le JSON
    const cId = item.clientId || item.customerId || item.idClient;

    if (!cId) return "Client #?";

    // 1. Chercher si c'est moi (l'admin)
    if (cId === user?.sub || cId === (user as any)?.id) {
      return user?.name || "Administrateur";
    }

    // 2. Chercher dans la liste des clients chargés
    const client = clientsList.find(c => String(c.id || c.sub) === String(cId));
    if (client) return client.nom || client.name || client.username;

    // 3. Si on ne trouve pas le nom, on affiche au moins le début de l'ID
    return `ID: ${cId.toString().substring(0, 8)}...`;
  };

  // Charger les données selon l'onglet actif
  useEffect(() => {
    const loadInitialData = async () => {
      if (activeTab === 'stats') {
        api.fetchDashboardStats().then(setStats);
      } else if (activeTab === 'clients') {
        api.getAllClients().then(setData);
      } else if (activeTab === 'products') {
        api.getProducts().then(setData);
      } else if (activeTab === 'orders') {
        api.fetchAllOrders().then(setData);
        // ON RÉCUPÈRE AUSSI LES PRODUITS POUR LE FORMULAIRE
        api.getProducts().then(setProductsList);
        api.getAllClients().then(setClientsList);
      }
    };
    loadInitialData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* --- Barre des Onglets (Tabs) --- */}
      <div className="flex border-b border-gray-200">
        <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={LayoutDashboard} label="Stats" />
        <TabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={Users} label="Clients" />
        <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label="Produits" />
        <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={ShoppingBag} label="Commandes" />
      </div>

      {/* --- Contenu Dynamique --- */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'clients' && renderTable(['ID', 'Nom', 'Email', 'Role'], 'clients')}
        {activeTab === 'products' && renderTable(['ID', 'Désignation', 'Prix', 'Stock'], 'products')}
        {activeTab === 'orders' && (
          <>

            <div className="p-4 flex justify-end bg-gray-50 border-b">
              <button
                onClick={() => setShowOrderForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Créer une commande
              </button>
            </div>

            {renderTable(['ID', 'Client ID', 'Produit ID', 'Quantité', 'Total'], 'orders')}
          </>
        )}
      </div>
    </div>
  );


  // --- Fonctions de rendu locales ---
  function renderTable(headers: string[], type: string) {
    return (
      <div className="flex flex-col">
        {/* 1. Formulaire de modification (s'affiche seulement si on édite un produit) */}
        {type === 'products' && editingProduct && (
          <div className="m-6 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">
              Modification du produit : {editingProduct.name} (ID: #{editingProduct.id})
            </h3>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Désignation</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Prix (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Stock</label>
                <input
                  type="number"
                  value={editForm.stockQuantity}
                  onChange={e => setEditForm({ ...editForm, stockQuantity: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors">Enregistrer</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500 transition-colors">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Le Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                {headers.map(h => <th key={h} className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>)}
                {type === 'products' && <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.filter(item => item !== null).map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">#{item.id}</td>
                  {/* ... tes colonnes clients ... */}
                  {type === 'clients' && (
                    <>
                      <td className="px-6 py-4">{item.nom || item.username}</td>
                      <td className="px-6 py-4">{item.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(item.admin === 1 || item.admin === true) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {(item.admin === 1 || item.admin === true) ? 'Admin' : 'Client'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* ... tes colonnes produits ... */}
                  {type === 'products' && (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4">{item.price} €</td>
                      <td className="px-6 py-4">
                        <span className={item.stockQuantity < 5 ? 'text-red-600 font-bold' : ''}>
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleEditClick(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteClick(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                  {/* ... tes colonnes commandes ... */}
                  {type === 'orders' && (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {/* On passe l'item entier pour que la fonction cherche clientId à l'intérieur */}
                        {getClientName(item)}
                      </td>

                      <td className="px-6 py-4">
                        {/* Pareil pour le produit */}
                        {getProductName(item)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.quantity}</span>
                      </td>

                      <td className="px-6 py-4 font-bold text-green-700">
                        {item.totalPrice ? `${item.totalPrice} €` : "0.00 €"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showOrderForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Créer une commande (Admin)</h2>

              <div className="space-y-4">
                {/* Utilisateur Fixé (L'Admin actuel) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client (Vous-même)</label>
                  <input
                    type="text"
                    disabled
                    className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                    value={`${user?.name || 'Administrateur'}`}
                  />
                </div>

                {/* Liste déroulante des Produits */}
                {/* Liste déroulante des Produits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner le Produit</label>
                  <select
                    className="w-full p-2 border rounded bg-white text-gray-900"
                    onChange={(e) => setNewOrder({ ...newOrder, productId: e.target.value })}
                    value={newOrder.productId}
                  >
                    <option value="">-- Choisir un produit --</option>
                    {productsList.map((prod: any) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} — {prod.price}€
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={!newOrder.productId}
                    onClick={async () => {
                      try {
                        // On appelle la fonction de gestion que tu as définie en haut
                        await handleCreateOrder();
                        // Le rafraîchissement est déjà géré à l'intérieur de handleCreateOrder
                      } catch (err) {
                        setStatusMessage("Erreur lors de la création ou stock insuffisant.");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Confirmer la commande
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStats() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="p-4 bg-blue-50 rounded-lg">Total Clients: <strong>{stats.totalClients}</strong></div>
        <div className="p-4 bg-green-50 rounded-lg">Total Produits: <strong>{stats.totalProducts}</strong></div>
        <div className="p-4 bg-orange-50 rounded-lg">Total Commandes: <strong>{stats.totalOrders}</strong></div>
      </div>
    );
  }
}

// Composant Petit Bouton d'Onglet
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
