import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'sonner';
import { Asset } from '@stellar/stellar-sdk';
import { logger } from '../utils/logger';

interface OrderDetails {
  order_id: string;
  artisan_address: string;
  amount_xlm: string;
  currency: string;
  description: string;
  status: string;
  expires_at: string;
}

export default function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { account, isAuthenticated } = useSocialAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }
    loadOrder();
  }, [isAuthenticated, account, orderId]);

  const loadOrder = async () => {
    if (!orderId) {
      setError('ID de orden inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/orders/${orderId}`
      );

      if (!response.ok) {
        throw new Error('Orden no encontrada');
      }

      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err: any) {
      logger.error('Error loading order:', err);
      setError(err.message || 'Error al cargar la orden');
      toast.error('No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!account || !order) return;

    logger.log('💳 [PAYMENT] Iniciando proceso de pago...');
    logger.log('💳 [PAYMENT] Order ID:', orderId);
    logger.log('💳 [PAYMENT] Order details:', order);

    // Check if order is expired
    if (order.status === 'expired') {
      logger.error('❌ [PAYMENT] Orden expirada');
      toast.error('Esta orden ha expirado');
      return;
    }

    if (order.status === 'paid') {
      logger.error('❌ [PAYMENT] Orden ya pagada');
      toast.error('Esta orden ya fue pagada');
      return;
    }

    setPaying(true);
    try {
      logger.log('⚙️ [PAYMENT] Preparando asset...');

      // Prepare asset (XLM or USDC)
      let asset = Asset.native(); // XLM
      if (order.currency === 'USDC') {
        const usdcIssuer = import.meta.env.PUBLIC_USDC_ISSUER;
        if (!usdcIssuer) {
          throw new Error('USDC issuer not configured');
        }
        asset = new Asset('USDC', usdcIssuer);
        logger.log('💎 [PAYMENT] Using USDC asset');
      } else {
        logger.log('⭐ [PAYMENT] Using native XLM');
      }

      // Send payment using Accesly account
      // Convert amount to proper Stellar format (must be string with up to 7 decimals)
      const amount = parseFloat(order.amount_xlm).toFixed(7);

      logger.log('💸 [PAYMENT] Enviando pago a Stellar blockchain...');
      logger.log('💸 [PAYMENT] Detalles del pago:', {
        from: account.publicKey,
        to: order.artisan_address,
        amount: amount,
        currency: order.currency,
        memo: order.order_id.substring(0, 28)
      });

      const txHash = await account.sendPayment(
        order.artisan_address,
        amount,
        asset,
        order.order_id.substring(0, 28) // Memo (max 28 chars)
      );

      logger.log('✅ [PAYMENT] ¡Pago enviado exitosamente a Stellar!');
      logger.log('🔗 [PAYMENT] Transaction Hash:', txHash);
      logger.log('🌐 [PAYMENT] Ver en Stellar Expert:', `https://stellar.expert/explorer/testnet/tx/${txHash}`);

      // Confirm payment with backend
      logger.log('📡 [PAYMENT] Confirmando pago con el backend...');
      const confirmResponse = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/orders/${orderId}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_hash: txHash,
            payer_address: account.publicKey,
          }),
        }
      );

      if (!confirmResponse.ok) {
        logger.error('❌ [PAYMENT] Error al confirmar con backend');
        throw new Error('Error al confirmar el pago');
      }

      const confirmData = await confirmResponse.json();
      logger.log('✅ [PAYMENT] Pago confirmado por el backend:', confirmData);

      // Note: Payment counter is now incremented manually by artisan
      // from their dashboard after confirming they received payment
      logger.log('✅ [PAYMENT] Pago registrado. Artesano debe confirmar desde su dashboard.');

      logger.log('🎉 [PAYMENT] ¡Proceso de pago completado exitosamente!');
      toast.success('¡Pago realizado exitosamente!');
      navigate('/payment-success', { state: { txHash, order } });
    } catch (err: any) {
      logger.error('❌ [PAYMENT] Error durante el pago:', err);
      logger.error('❌ [PAYMENT] Error message:', err.message);
      logger.error('❌ [PAYMENT] Error stack:', err.stack);
      toast.error('Error al procesar el pago: ' + err.message);
    } finally {
      setPaying(false);
      logger.log('🏁 [PAYMENT] Proceso de pago finalizado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 flex items-center justify-center">
        <div className="text-white text-xl">Cargando orden...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">[F]</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/scan')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Escanear Otro QR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Confirmar Pago
          </h1>

          {/* Order Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Monto a Pagar</p>
              <p className="text-3xl font-bold text-gray-800">
                {order.amount_xlm} {order.currency}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p className="text-gray-800 font-medium">{order.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Artesano</p>
                <p className="text-gray-800 font-mono text-xs">
                  {order.artisan_address.substring(0, 8)}...
                  {order.artisan_address.substring(order.artisan_address.length - 4)}
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${order.artisan_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Ver cuenta →
                </a>
              </div>

              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {order.status === 'pending'
                    ? 'Pendiente'
                    : order.status === 'paid'
                    ? 'Pagado'
                    : 'Expirado'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {order.status === 'pending' && (
              <button
                onClick={handlePayment}
                disabled={paying}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {paying ? 'Procesando...' : `Pagar ${order.amount_xlm} ${order.currency}`}
              </button>
            )}

            <button
              onClick={() => navigate('/scan')}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 El pago se procesará en la red Stellar. La transacción es irreversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
