import React, { useEffect, useState } from 'react';
import { Users, Package, ShoppingBag, LayoutDashboard } from 'lucide-react';
import * as api from '../../services/api';

type AdminTab = 'stats' | 'clients' | 'products' | 'orders';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, totalProducts: 0, totalOrders: 0 });

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'stats') {
      api.fetchDashboardStats().then(setStats);
    } else if (activeTab === 'clients') {
      api.getAllClients().then(setData);
    } else if (activeTab === 'products') {
      api.getProducts().then(setData);
    } else if (activeTab === 'orders') {
      api.fetchAllOrders().then(setData);
    }
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
        {activeTab === 'orders' && renderTable(['ID', 'Client ID', 'Produit ID', 'Quantité', 'Total'], 'orders')}
      </div>
    </div>
  );

  // --- Fonctions de rendu locales ---
  function renderTable(headers: string[], type: string) {
    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {headers.map(h => <th key={h} className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item: any) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">#{item.id}</td>
              {type === 'clients' && (
                <>
                  <td className="px-6 py-4">{item.nom || item.username}</td>
                  <td className="px-6 py-4">{item.email}</td>
                 
<td className="px-6 py-4">
  <span className={`px-2 py-1 rounded-full text-xs ${
    // On vérifie si c'est le chiffre 1 OU si c'est le booléen true
    (item.admin === 1 || item.admin === true) 
      ? 'bg-purple-100 text-purple-700' 
      : 'bg-gray-100 text-gray-700'
  }`}>
    {(item.admin === 1 || item.admin === true) ? 'Admin' : 'Client'}
  </span>
</td>
                </>
              )}
              {type === 'products' && (
                <>
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4">{item.price} €</td>
                  <td className="px-6 py-4">{item.stockQuantity}</td>
                </>
              )}
              {type === 'orders' && (
                <>
                  <td className="px-6 py-4 text-xs">{item.customerId || item.clientId}</td>
                  <td className="px-6 py-4">#{item.productId}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4 font-bold">{item.totalPrice} €</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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
      className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}