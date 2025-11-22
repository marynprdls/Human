import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';

export default function ArtisanDashboard() {
  const navigate = useNavigate();
  const { account, userInfo, isAuthenticated, logout } = useSocialAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('Loading...');

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }
    loadBalance();
  }, [isAuthenticated, account, navigate]);

  const loadBalance = async () => {
    if (!account) return;
    try {
      const balances = await account.getBalance();
      const xlmBalance = balances.find(b => b.asset === 'XLM');
      setBalance(xlmBalance ? `${parseFloat(xlmBalance.balance).toFixed(2)} XLM` : '0 XLM');
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance('Error');
    }
  };

  const generateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!account) {
      toast.error('No hay cuenta conectada');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_address: account.publicKey,
          amount_xlm: amount,
          currency: 'XLM',
          description: description || 'Pago por servicio',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar QR');
      }

      const data = await response.json();
      setQrDataUrl(data.qr_data_url);
      setOrderId(data.order_id);
      toast.success('¡QR generado!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al generar QR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearQR = () => {
    setQrDataUrl(null);
    setOrderId(null);
    setAmount('');
    setDescription('');
  };

  if (!account) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {userInfo?.picture && (
                <img
                  src={userInfo.picture}
                  alt={userInfo.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {userInfo?.name || 'Artesano'}
                </h1>
                <p className="text-sm text-gray-600">
                  {account.publicKey.substring(0, 8)}...{account.publicKey.substring(account.publicKey.length - 4)}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Salir
            </button>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">Balance</p>
            <p className="text-2xl font-bold text-gray-800">{balance}</p>
          </div>
        </div>

        {/* QR Generator or Display */}
        {!qrDataUrl ? (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generar QR de Pago</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto (XLM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artesanía hecha a mano"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={generateQR}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Generando...' : 'Generar QR'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              ¡Muestra este QR al cliente!
            </h2>

            <div className="flex flex-col items-center space-y-4">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
              />

              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{amount} XLM</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={clearQR}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Generar Nuevo QR
                </button>
                <button
                  onClick={() => navigate('/role-select')}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
