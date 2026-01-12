import { Trash2, Plus, Minus, ShoppingBag, AlertCircle } from 'lucide-react';
import { Product } from '../../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function ShoppingCart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: ShoppingCartProps) {
  // Correction du calcul du total (gestion de prix/prix)
  // Dans ShoppingCart.tsx
  const total = items.reduce((sum, item) => {
    // Utilise 'prix' s'il existe, sinon 'price', sinon 0
    const unitPrice = item.product.price || 0;
    return sum + (unitPrice * item.quantity);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Votre panier est vide</h2>
        <p className="text-gray-600">Ajoutez des produits pour commencer vos achats</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Panier</h2>
        <p className="text-sm text-gray-600">{items.length} article(s)</p>
      </div>

      <div className="p-6 space-y-4">
        {items.map(item => (
          <div key={item.product.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">{item.product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.product.price.toFixed(2)} €</p>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stockQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {item.quantity > item.product.stockQuantity && (
                <div className="mt-2 flex items-start gap-1 text-xs text-orange-600">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Stock insuffisant ({item.product.stockQuantity} disponibles)</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">
                {(item.product.price || 0).toFixed(2)} €
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-800">Total</span>
          <span className="text-2xl font-bold text-gray-900">{total.toFixed(2)} €</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Passer la commande
        </button>
      </div>
    </div>
  );
}
