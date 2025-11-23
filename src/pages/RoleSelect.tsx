import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import PrimaryButton from '@/components/primary-button';
import { Store, User } from 'lucide-react';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { userInfo, account } = useSocialAuth();

  if (!account) {
    navigate('/login');
    return null;
  }

  return (
    <div className="mobile-container">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* User Profile Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-sm">
            {userInfo?.picture ? (
              <img
                src={userInfo.picture}
                alt={userInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Hola, {userInfo?.name || 'Usuario'}!
          </h1>
          <p className="text-xs text-muted-foreground font-mono mb-1">
            {account.publicKey.substring(0, 12)}...{account.publicKey.substring(account.publicKey.length - 4)}
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${account.publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Ver en Stellar Expert →
          </a>
        </div>

        {/* Role Selection */}
        <div className="w-full max-w-sm space-y-6 animate-fadeIn animation-delay-100">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-foreground">¿Qué quieres hacer?</h2>
            <p className="text-muted-foreground">Elige cómo usar HUMAN</p>
          </div>

          <div className="space-y-4">
            {/* Artisan Button */}
            <PrimaryButton
              onClick={() => navigate('/register/artisan')}
              variant="primary"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <Store className="w-8 h-8" />
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">Soy Artesano</div>
                  <div className="text-sm opacity-80 font-normal">
                    Genera QR para recibir pagos
                  </div>
                </div>
              </div>
            </PrimaryButton>

            {/* Client Button */}
            <PrimaryButton
              onClick={() => navigate('/register/client')}
              variant="primary"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <User className="w-8 h-8" />
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">Soy Cliente</div>
                  <div className="text-sm opacity-80 font-normal">
                    Escanea QR para pagar
                  </div>
                </div>
              </div>
            </PrimaryButton>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-fadeIn animation-delay-200">
          <p className="text-xs text-muted-foreground">
            Tu wallet ha sido generada automáticamente
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            con <span className="text-primary font-semibold">Accesly SDK</span> + <span className="text-primary font-semibold">Stellar</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
