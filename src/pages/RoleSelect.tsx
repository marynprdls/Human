import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { userInfo, account } = useSocialAuth();

  if (!account) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            {userInfo?.picture ? (
              <img
                src={userInfo.picture}
                alt={userInfo.name}
                className="w-full h-full rounded-full"
              />
            ) : (
              <div className="text-3xl">👤</div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Hola, {userInfo?.name}!
          </h1>
          <p className="text-white/80 text-sm">
            Wallet: {account.publicKey.substring(0, 8)}...{account.publicKey.substring(account.publicKey.length - 4)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/artisan-dashboard')}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Soy Artesano</h2>
            <p className="text-gray-600">
              Genera QR codes para recibir pagos de tus clientes
            </p>
          </button>

          <button
            onClick={() => navigate('/scan')}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="text-6xl mb-4">🧳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Soy Cliente</h2>
            <p className="text-gray-600">
              Escanea QR codes para pagar a artesanos
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
