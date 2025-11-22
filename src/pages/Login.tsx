import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated, loading, userInfo } = useSocialAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User already authenticated, redirecting...');
      navigate('/role-select');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (loading) return;

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        try {
          const clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

          // Initialize Google Identity Services
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render the button
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              type: 'standard',
              shape: 'rectangular',
              theme: 'outline',
              text: 'signin_with',
              size: 'large',
              logo_alignment: 'left',
              width: 350,
            }
          );

          setInitializing(false);
          console.log('✅ Google Sign-In button rendered');
        } catch (error) {
          console.error('❌ Failed to initialize Google Sign-In:', error);
          setInitializing(false);
        }
      } else {
        // Retry after a short delay
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, [loading]);

  const handleCredentialResponse = async (response: any) => {
    console.log('📩 Received credential response');
    await loginWithGoogle(response);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">HUMAN</h1>
          <p className="text-gray-600">Pagos P2P con Stellar</p>
        </div>

        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Conecta tu cuenta de Google para crear tu billetera Stellar automáticamente
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div ref={googleButtonRef} className="w-full flex justify-center"></div>

          {initializing && (
            <p className="text-sm text-gray-500">Cargando botón de Google...</p>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by</p>
          <p className="font-semibold">Stellar + Accesly</p>
        </div>
      </div>
    </div>
  );
}
