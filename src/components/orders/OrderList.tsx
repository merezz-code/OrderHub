import { Package, Calendar, DollarSign, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { OrderWithItems } from '../../types';

interface OrderListProps {
  orders: OrderWithItems[];
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  confirmed: { label: 'Confirmée', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  shipped: { label: 'Expédiée', icon: Truck, color: 'text-blue-600 bg-blue-50' },
  delivered: { label: 'Livrée', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucune commande</h2>
        <p className="text-gray-600">Vous n'avez pas encore passé de commande</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes Commandes</h2>

      {orders.map(order => {
        const status = statusConfig[order.status];
        const StatusIcon = status.icon;

        return (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Commande {order.orderNumber}
                    </h3>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-2xl font-bold text-gray-900">
                    <DollarSign className="w-6 h-6" />
                    {order.totalAmount.toFixed(2)} €
                  </div>
                  <p className="text-sm text-gray-600">{order.items.length} article(s)</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.product?.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantité: {item.quantity} × {item.unitPrice.toFixed(2)} €
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.subtotal.toFixed(2)} €</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
