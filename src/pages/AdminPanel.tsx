import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';
import artisanRegistryService from '../services/artisanRegistry.service';
import type { Artisan } from 'artisan-registry-client';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { account, userInfo, isAuthenticated, logout } = useSocialAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }
    checkAdminStatus();
  }, [isAuthenticated, account, navigate]);

  const checkAdminStatus = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const adminAddress = await artisanRegistryService.getAdmin();
      const isUserAdmin = adminAddress === account.publicKey;

      setIsAdmin(isUserAdmin);

      if (!isUserAdmin) {
        toast.error('No tienes permisos de administrador');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Cargar usuarios de la base de datos
      await loadUsers();

    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Error al verificar permisos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const searchArtisan = async () => {
    if (!searchAddress.trim()) {
      toast.error('Ingresa una dirección Stellar');
      return;
    }

    try {
      setLoading(true);

      // Buscar en el contrato
      const artisanData = await artisanRegistryService.getArtisan(searchAddress);

      if (!artisanData) {
        toast.error('Artesano no encontrado en el contrato');
        setSelectedArtisan(null);
        return;
      }

      setSelectedArtisan(artisanData);
      toast.success('Artesano encontrado');

    } catch (error) {
      console.error('Error searching artisan:', error);
      toast.error('Error al buscar artesano');
    } finally {
      setLoading(false);
    }
  };

  const verifyArtisan = async () => {
    if (!selectedArtisan || !account) return;

    try {
      setVerifying(true);
      toast.info('Firmando transacción de verificación...');

      const result = await artisanRegistryService.verifyArtisan(
        account.publicKey,
        selectedArtisan.stellar_address,
        (xdr) => account.signTransaction(xdr)
      );

      if (result.success) {
        toast.success('¡Artesano verificado exitosamente!');
        // Actualizar el estado
        setSelectedArtisan({
          ...selectedArtisan,
          verified: true
        });
      } else {
        toast.error(`Error: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Error verifying artisan:', error);
      toast.error(error.message || 'Error al verificar artesano');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Panel de Administrador</h1>
              <p className="text-sm text-gray-600">
                Verificar artesanos registrados en el contrato
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Buscar Artesano</h2>

          <div className="flex gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Dirección Stellar del artesano (G...)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <button
              onClick={searchArtisan}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Artisan Details */}
          {selectedArtisan && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-semibold text-gray-800">{selectedArtisan.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-semibold">
                      {selectedArtisan.verified ? (
                        <span className="text-green-600">✓ Verificado</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pendiente</span>
                      )}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Dirección Stellar</p>
                    <p className="font-mono text-sm text-gray-800 break-all">
                      {selectedArtisan.stellar_address}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Registrado</p>
                    <p className="text-sm text-gray-800">
                      {new Date(Number(selectedArtisan.registered_at) * 1000).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {!selectedArtisan.verified && (
                <button
                  onClick={verifyArtisan}
                  disabled={verifying}
                  className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {verifying ? 'Verificando...' : '✓ Verificar Artesano'}
                </button>
              )}

              {selectedArtisan.verified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-semibold">
                    ✓ Este artesano ya está verificado
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Usuarios Registrados ({users.length})</h2>

          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay usuarios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Dirección</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'artisan').map((user) => (
                    <tr key={user.stellar_address} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        {user.business_name && (
                          <p className="text-xs text-gray-500">{user.business_name}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {user.stellar_address.substring(0, 8)}...{user.stellar_address.substring(user.stellar_address.length - 4)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSearchAddress(user.stellar_address);
                            searchArtisan();
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ver detalles →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
