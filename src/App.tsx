import { useState } from 'react';
import { ShoppingCart as CartIcon, Package, User, LogOut, Store } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { ProductCatalog } from './components/products/ProductCatalog';
import { ShoppingCart, CartItem } from './components/orders/ShoppingCart';
import { OrderList } from './components/orders/OrderList';
import { Product, OrderWithItems, OrderItem } from './types';

type View = 'products' | 'cart' | 'orders' | 'profile';

function AppContent() {
  const { user, customer, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('products');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [showAuth, setShowAuth] = useState<'login' | 'register'>('login');

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    if (!customer) return;

    const orderNumber = `ORD-${Date.now()}`;
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const orderItems: OrderItem[] = cartItems.map(item => ({
      id: `oi-${Date.now()}-${item.product.id}`,
      orderId: `o-${Date.now()}`,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.product.price * item.quantity,
      product: item.product,
    }));

    const newOrder: OrderWithItems = {
      id: `o-${Date.now()}`,
      customerId: customer.id,
      orderNumber,
      status: 'pending',
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItems,
      customer,
    };

    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    setCurrentView('orders');
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
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'products'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Produits
              </button>

              <button
                onClick={() => setCurrentView('cart')}
                className={`relative px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'cart'
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

              <button
                onClick={() => setCurrentView('orders')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="w-5 h-5 inline mr-1" />
                Commandes
              </button>

              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
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
