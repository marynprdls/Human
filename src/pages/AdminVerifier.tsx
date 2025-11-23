import { useState } from 'react';
import { toast } from 'react-toastify';

export default function AdminVerifier() {
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('stellar2024');
  const [loading, setLoading] = useState(false);
  const [artisan, setArtisan] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const checkArtisan = async () => {
    if (!address.trim()) {
      toast.error('Ingresa una dirección Stellar');
      return;
    }

    setLoading(true);
    setArtisan(null);

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/admin/check/${address}`
      );
      const data = await response.json();

      if (!data.registered) {
        toast.error('Artesano no registrado on-chain');
      } else {
        setArtisan(data);
        toast.success('Artesano encontrado');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  const verifyArtisan = async () => {
    setVerifying(true);
    toast.info('Verificando on-chain...');

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/admin/verify-artisan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artisan_address: address,
            admin_password: password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('¡Artesano verificado exitosamente!');
        setArtisan({ ...artisan, verified: true });
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al verificar artesano');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔐 Panel de Administrador
          </h1>
          <p className="text-gray-600">Verificación de Artesanos On-Chain</p>
        </div>

        {/* Admin Info */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Información del Admin
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="mb-2">
              <strong>Cuenta Admin:</strong>
            </p>
            <p className="font-mono text-xs text-gray-600 break-all">
              GA7VAMQVU4RZHKCTKXEUKQCSCH4LSF27LESZF5CZNZYPZ24V5VVETUDZ
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Verificar Artesano
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Stellar del Artesano
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="GAESNY6OYQPSLDJWWYPFFB7KMUK7ZHDIJWVS4KUCDM7T3RHHOR4UBDCN"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                maxLength={56}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password de Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="stellar2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={checkArtisan}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : '🔍 Verificar Estado'}
            </button>
          </div>
        </div>

        {/* Results */}
        {artisan && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              ✅ Artesano Encontrado
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold text-gray-800">{artisan.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="font-semibold">
                    {artisan.verified ? (
                      <span className="text-green-600">✓ Verificado</span>
                    ) : (
                      <span className="text-yellow-600">⏳ Pendiente</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total Pagos</p>
                  <p className="font-semibold text-gray-800">
                    {artisan.total_payments}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-mono text-xs text-gray-600 break-all">
                    {artisan.stellar_address}
                  </p>
                </div>
              </div>
            </div>

            {!artisan.verified && (
              <button
                onClick={verifyArtisan}
                disabled={verifying}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {verifying
                  ? 'Verificando en blockchain...'
                  : '✅ Verificar Artesano On-Chain'}
              </button>
            )}

            {artisan.verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold">
                  ✓ Este artesano ya está verificado
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
