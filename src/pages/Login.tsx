import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { Sparkles } from 'lucide-react';
import { logger } from '../utils/logger';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated, loading, userInfo, registeredUser } = useSocialAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      logger.log('[ok] User already authenticated, checking registration...');

      if (registeredUser) {
        // User is registered, redirect to their dashboard
        logger.log(`[ok] Redirecting to ${registeredUser.role} dashboard`);
        if (registeredUser.role === 'artisan') {
          navigate('/artisan-dashboard');
        } else {
          navigate('/client-dashboard');
        }
      } else {
        // User not registered, go to role selection
        logger.log('ℹ️ User not registered, redirecting to role select');
        navigate('/role-select');
      }
    }
  }, [isAuthenticated, registeredUser, navigate]);

  useEffect(() => {
    if (loading) return;

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        try {
          const clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

          console.log('[ok] Rendering Google Sign-In button');

          // Render Google button directly in the div
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });

          // Render the official Google button
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: 'outline',
              size: 'large',
              width: 300,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            }
          );

          setInitializing(false);
          logger.log('[ok] Google Sign-In button rendered successfully');
        } catch (error) {
          logger.error('[F] Failed to initialize Google Sign-In:', error);
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
    logger.log('📩 Received credential response');
    setLoggingIn(true);
    try {
      await loginWithGoogle(response);
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading || loggingIn) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">
            {loading ? 'Cargando...' : 'Iniciando sesión...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="mb-8 animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-foreground flex items-center justify-center shadow-lg">
            <Sparkles className="w-12 h-12 text-background" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8 animate-fadeIn animation-delay-100">
          <h1 className="text-5xl font-bold text-foreground mb-4">HUMAN</h1>
          <p className="text-xl text-muted-foreground max-w-xs leading-relaxed">
            Pagos P2P para artesanos en Stellar
          </p>
        </div>

        {/* Illustration */}
        <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 mb-12 flex flex-col items-center justify-center animate-fadeIn animation-delay-200">
          <div className="text-7xl mb-4">🌟</div>
          <div className="text-center px-6">
            <p className="text-sm text-muted-foreground">
              Billetera Stellar + Google OAuth
            </p>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div className="w-full flex justify-center animate-fadeIn animation-delay-300">
          <div ref={googleButtonRef} className="flex justify-center"></div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-fadeIn animation-delay-400">
          <p className="text-xs text-muted-foreground mb-2">
            Billetera determinista generada automáticamente
          </p>
          <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="text-primary">Stellar</span>
            <span>+</span>
            <span className="text-primary">Accesly</span>
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

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
