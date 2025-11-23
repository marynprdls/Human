import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';
import artisanRegistryService from '../services/artisanRegistry.service';
import { logger } from '../utils/logger';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { account, registeredUser } = useSocialAuth();
  const { txHash, order } = location.state || {};
  const [incrementing, setIncrementing] = useState(false);
  const [incremented, setIncremented] = useState(false);

  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

  useEffect(() => {
    // Auto-increment payment counter if artisan is registered on-chain
    if (order?.artisan_address && account && !incremented && !incrementing) {
      incrementPaymentCounter();
    }
  }, [order, account]);

  const incrementPaymentCounter = async () => {
    if (!order?.artisan_address || !account) {
      logger.log('⚠️  Missing order or account, skipping increment');
      return;
    }

    setIncrementing(true);
    try {
      logger.log('🔍 Checking if artisan is registered on-chain...');
      logger.log('   Artisan address:', order.artisan_address);

      // Verificar si el artesano está registrado en el contrato
      const isRegistered = await artisanRegistryService.isRegistered(order.artisan_address);
      logger.log('   Is registered:', isRegistered);

      if (!isRegistered) {
        logger.log('ℹ️  Artisan not registered in contract, skipping counter increment');
        setIncremented(true);
        return;
      }

      logger.log('✅ Artisan is registered, incrementing payment counter...');
      logger.log('   Using account:', account.publicKey);
      toast.info('📊 Actualizando contador on-chain...');

      // Incrementar el contador de pagos
      const result = await artisanRegistryService.incrementPayments(
        order.artisan_address,
        (xdr) => account.signTransaction(xdr)
      );

      if (result.success) {
        logger.log('✅ Payment counter incremented successfully!');
        logger.log('   Transaction hash:', result.txHash);
        if (result.txHash) {
          toast.success(
            <div>
              ✅ Contador actualizado on-chain
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs underline mt-1"
              >
                Ver transacción →
              </a>
            </div>
          );
        } else {
          toast.success('✅ Contador actualizado on-chain');
        }
        setIncremented(true);
      } else {
        logger.error('❌ Failed to increment counter:', result.error);
        toast.warn('⚠️  No se pudo actualizar el contador: ' + result.error);
      }
    } catch (error: any) {
      logger.error('❌ Error incrementing payment counter:', error);
      logger.error('   Error details:', error.message);
      toast.error('❌ Error al actualizar contador: ' + error.message);
    } finally {
      setIncrementing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ¡Pago Exitoso!
        </h1>
        <p className="text-gray-600 mb-6">
          Tu pago ha sido procesado correctamente
        </p>

        {order && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Monto Pagado</p>
            <p className="text-2xl font-bold text-gray-800">
              {order.amount_xlm} {order.currency}
            </p>
          </div>
        )}

        {txHash && (
          <div className="mb-6">
            <p className="text-xs text-gray-600 mb-2">Hash de Transacción</p>
            <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
              {txHash.substring(0, 32)}...
            </p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block"
            >
              Ver en Stellar Explorer →
            </a>
          </div>
        )}

        {/* On-chain Counter Status */}
        {incrementing && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm text-blue-700">Actualizando contador on-chain...</p>
            </div>
          </div>
        )}

        {incremented && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">✅ Contador on-chain actualizado</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/scan')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Escanear Otro QR
          </button>
          <button
            onClick={() => navigate(registeredUser?.role === 'client' ? '/client-dashboard' : '/artisan-dashboard')}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
