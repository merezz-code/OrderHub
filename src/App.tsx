import { useState } from 'react';
import { ShoppingCart as CartIcon, Package, User, LogOut, Store, LayoutDashboard } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { ProductCatalog } from './components/products/ProductCatalog';
import { ShoppingCart, CartItem } from './components/orders/ShoppingCart';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OrderList } from './components/orders/OrderList';
import { Product, OrderWithItems, OrderItem } from './types';
import * as api from './services/api';

type View = 'products' | 'cart' | 'orders' | 'profile' | 'dashboard';

function AppContent() {
  const { user, logout, setCustomer, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<View>('products');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [showAuth, setShowAuth] = useState<'login' | 'register'>('login');

  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      // On utilise le NOM puisque l'ID est absent (undefined)
      const existingItem = prevItems.find(item => item.product.name === product.name);

      if (existingItem) {
        return prevItems.map(item =>
          item.product.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        String(item.product.id) === String(productId) ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string | number) => {
    setCartItems(prev => prev.filter(item => String(item.product.id) !== String(productId)));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !user) return;

    try {
      for (const item of cartItems) {
        const orderData = {
          // user.sub est l'ID Keycloak, assure-t-on que le backend attend ce format
          clientId: user.id || user.sub,
          productId: item.product.id, // Doit être le Long du backend
          quantity: item.quantity,
          totalPrice: (item.product.price || 0) * item.quantity
        };
        await api.createOrder(orderData);
      }

      setCartItems([]);
      handleViewOrders();
      alert("Commande réussie et stock mis à jour !");
    } catch (error) {
      alert("Erreur : Stock insuffisant ou service indisponible");
    }
  };
  // À mettre dans ton composant AppContent
  const handleViewOrders = async () => {
    try {
      const data = await api.fetchOrders(); // Ton appel API vers le gateway

      const formattedOrders = data.map((order: any) => ({
        id: String(order.id),
        orderNumber: `CMD-${order.id}`,
        status: 'pending',
        totalAmount: order.totalPrice || 0,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: `item-${order.id}`,
            productId: order.productId,
            quantity: order.quantity,
            unitPrice: order.totalPrice / order.quantity,
            subtotal: order.totalPrice
          }
        ]
      }));

      setOrders(formattedOrders);
      setCurrentView('orders');
    } catch (error: any) {
      alert("Erreur de chargement des commandes");
    }
  };

  const handleViewProfile = async () => {
    try {
      const data = await api.fetchMyProfile();
      setCustomer(data);
      setCurrentView('profile');
    } catch (error) {
      setCurrentView('profile');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        {showAuth === 'login' ? (
          <LoginForm onSwitchToRegister={() => setShowAuth('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setShowAuth('login')} />
        )}
      </div>
    );
  }

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">OrderHub</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('products')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Store className="w-5 h-5 inline mr-2" />
                Produits
              </button>

              <button
                onClick={() => setCurrentView('cart')}
                className={`relative px-4 py-2 rounded-lg transition-colors ${currentView === 'cart'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <CartIcon className="w-5 h-5 inline mr-1" />
                Panier
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Dans votre barre de navigation */}
              <button
                onClick={handleViewOrders} // <-- Remplacez setCurrentView par handleViewOrders
                className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Package className="w-5 h-5 inline mr-1" />
                Commandes
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <LayoutDashboard className="w-5 h-5 inline mr-2" />
                  Dashboard
                </button>
              )}
              <button
                onClick={handleViewProfile} // Utilise le handler au lieu de setCurrentView seul
                className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <User className="w-5 h-5 inline mr-1" />
                Profil
              </button>


              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 inline mr-1" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'products' && (
          <ProductCatalog onAddToCart={handleAddToCart} />
        )}

        {currentView === 'cart' && (
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        )}

        {currentView === 'orders' && <OrderList orders={orders} />}
        {currentView === 'dashboard' && <AdminDashboard />}
        {currentView === 'profile' && <CustomerProfile />}

      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
