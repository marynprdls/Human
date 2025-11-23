import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';
import artisanRegistryService from '../services/artisanRegistry.service';
import { logger } from '../utils/logger';

export default function ArtisanRegister() {
  const navigate = useNavigate();
  const { account, userInfo, updateRegisteredUser } = useSocialAuth();

  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    business_name: '',
    business_description: '',
    location_name: '',
    latitude: '',
    longitude: ''
  });

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

    if (!formData.name || !formData.business_name) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // PASO 1: Registrar en el contrato de Stellar (on-chain)
      toast.info('📝 Registrando en blockchain...');

      const contractResult = await artisanRegistryService.registerArtisan(
        account.publicKey,
        formData.business_name,
        (xdr) => account.signTransaction(xdr)
      );

      if (!contractResult.success) {
        throw new Error(contractResult.error || 'Error al registrar en blockchain');
      }

      logger.log('✅ Registered on-chain successfully');
      toast.success('✅ Registrado en blockchain');

      // PASO 2: Registrar en Supabase (off-chain metadata)
      const payload = {
        stellar_address: account.publicKey,
        google_sub: userInfo.sub,
        role: 'artisan' as const,
        name: formData.name,
        email: userInfo.email,
        photo_url: userInfo.picture,
        business_name: formData.business_name,
        business_description: formData.business_description || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        location_name: formData.location_name || undefined
      };

      logger.log('📤 Saving metadata to database:', payload);

      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar metadata');
      }

      const user = await response.json();
      logger.log('[ok] Metadata saved:', user);

      // Update context with registered user
      updateRegisteredUser(user);

      toast.success('🎉 ¡Registro completo!');

      // Guardar en localStorage para auto-redirect
      localStorage.setItem('user_role', 'artisan');

      // Redirigir al dashboard del artesano
      navigate('/artisan-dashboard');

    } catch (error: any) {
      logger.error('Error registering:', error);
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    toast.info('Obteniendo tu ubicación...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        toast.success('Ubicación obtenida');
      },
      (error) => {
        logger.error('Geolocation error:', error);
        toast.error('No se pudo obtener la ubicación');
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎨</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Registro de Artesano
            </h1>
            <p className="text-gray-600">
              Completa tu perfil para empezar a recibir pagos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre Personal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nombre del Negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Artesanías Don Juan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de tu Negocio
              </label>
              <textarea
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                placeholder="Tejidos artesanales hechos a mano con técnicas tradicionales..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Ubicación */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ubicación de tu Negocio
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  📍 Usar mi ubicación
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Latitud"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Longitud"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="Nombre del lugar (ej: Oaxaca Centro)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <p className="text-xs text-gray-500 mt-2">
                💡 La ubicación te hará visible en el mapa después de tu primera venta
              </p>
            </div>

            {/* Wallet Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Tu Wallet Stellar:</p>
              <p className="text-xs font-mono text-gray-800">
                {account?.publicKey}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/role-select')}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancelar
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
