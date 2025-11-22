import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { txHash, order } = location.state || {};

  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

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

        <div className="space-y-3">
          <button
            onClick={() => navigate('/scan')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Escanear Otro QR
          </button>
          <button
            onClick={() => navigate('/role-select')}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
