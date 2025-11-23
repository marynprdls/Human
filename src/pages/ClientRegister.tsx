import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';
import { logger } from '../utils/logger';

export default function ClientRegister() {
  const navigate = useNavigate();
  const { account, userInfo, updateRegisteredUser } = useSocialAuth();

  const [name, setName] = useState(userInfo?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.log('🔍 Debug - Account:', account?.publicKey);
    logger.log('🔍 Debug - UserInfo:', userInfo);

    if (!account || !userInfo) {
      toast.error('No hay sesión activa');
      return;
    }

    if (!userInfo.sub) {
      toast.error('Error: Falta Google Sub ID. Intenta cerrar sesión y volver a entrar.');
      logger.error('[F] userInfo.sub is missing:', userInfo);
      return;
    }

    if (!name) {
      toast.error('Ingresa tu nombre');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        stellar_address: account.publicKey,
        google_sub: userInfo.sub,
        role: 'client' as const,
        name: name,
        email: userInfo.email,
        photo_url: userInfo.picture
      };

      logger.log('📤 Registering client:', payload);

      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al registrar');
      }

      const user = await response.json();
      logger.log('[ok] Client registered:', user);

      // Update context with registered user
      updateRegisteredUser(user);

      toast.success('¡Registro exitoso!');

      // Guardar en localStorage para auto-redirect
      localStorage.setItem('user_role', 'client');

      // Redirigir a dashboard de cliente
      navigate('/client-dashboard');

    } catch (error: any) {
      logger.error('Error registering:', error);
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧳</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Registro de Cliente
            </h1>
            <p className="text-gray-600">
              Completa tu perfil para empezar a pagar con QR
            </p>
          </div>

          {/* User Info */}
          {userInfo?.picture && (
            <div className="flex justify-center mb-6">
              <img
                src={userInfo.picture}
                alt={userInfo.name}
                className="w-20 h-20 rounded-full"
              />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userInfo?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* Wallet Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Tu Wallet Stellar:</p>
              <p className="text-xs font-mono text-gray-800 break-all">
                {account?.publicKey}
              </p>
            </div>

            {/* Info */}
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✨ Con tu wallet podrás:
              </p>
              <ul className="text-xs text-green-700 mt-2 space-y-1">
                <li>• Escanear QR codes de artesanos</li>
                <li>• Pagar con XLM instantáneamente</li>
                <li>• Ver tu historial de transacciones</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/role-select')}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
