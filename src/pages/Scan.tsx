import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export default function Scan() {
  const navigate = useNavigate();
  const { isAuthenticated, account, registeredUser } = useSocialAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, account, navigate]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    logger.log('📷 [SCAN] Iniciando scanner...');
    try {
      // First, show the scanner UI (render the #reader div)
      setScanning(true);
      setError(null);

      // Wait for the DOM to update and render the #reader element
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.log('📷 [SCAN] Solicitando permisos de cámara...');
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      logger.log('📷 [SCAN] Configurando scanner con facingMode: environment');
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );

      logger.log('✅ [SCAN] Scanner iniciado correctamente');
    } catch (err: any) {
      logger.error('❌ [SCAN] Error al iniciar scanner:', err);
      logger.error('❌ [SCAN] Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setScanning(false);

      // Provide specific error messages based on error type
      let errorMessage = 'No se pudo acceder a la cámara.';

      if (err.message?.includes('NotReadableError') || err.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra Zoom, Teams, o cualquier app que use la cámara.';
        logger.error('❌ [SCAN] SOLUCIÓN: Cierra otras aplicaciones que usen la cámara (Zoom, Teams, Skype, OBS, etc.)');
      } else if (err.message?.includes('NotAllowedError') || err.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Haz clic en el icono de cámara en la barra de direcciones y permite el acceso.';
        logger.error('❌ [SCAN] SOLUCIÓN: Permite permisos de cámara en el navegador');
      } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara. Conecta una cámara o usa un dispositivo con cámara.';
        logger.error('❌ [SCAN] SOLUCIÓN: Conecta una cámara o usa un dispositivo móvil');
      }

      setError(errorMessage);
      toast.error('Error al acceder a la cámara');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setScanning(false);
      } catch (err) {
        logger.error('Error al detener scanner:', err);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    logger.log('✅ [SCAN] QR escaneado exitosamente!');
    logger.log('📄 [SCAN] Contenido del QR:', decodedText);
    stopScanning();

    // Parse Stellar payment URI
    // Format: web+stellar:pay?destination=GXXX&amount=10&memo=abc
    logger.log('🔍 [SCAN] Verificando formato del QR...');

    if (decodedText.includes('stellar:pay') || decodedText.includes('order_id=')) {
      try {
        logger.log('✅ [SCAN] QR tiene formato válido de pago Stellar');
        // Extract order ID from QR
        const url = new URL(decodedText.replace('web+stellar:pay', 'http://dummy'));
        const orderId = url.searchParams.get('memo') || url.searchParams.get('order_id');

        logger.log('🔑 [SCAN] Order ID extraído:', orderId);

        if (orderId) {
          logger.log('✅ [SCAN] Navegando a página de pago...');
          toast.success('¡QR escaneado correctamente!');
          navigate(`/pay/${orderId}`);
        } else {
          logger.error('❌ [SCAN] No se encontró order_id en el QR');
          toast.error('QR inválido: No se encontró orden');
        }
      } catch (err) {
        logger.error('❌ [SCAN] Error parsing QR:', err);
        logger.error('❌ [SCAN] QR content:', decodedText);
        toast.error('QR inválido');
      }
    } else {
      logger.error('❌ [SCAN] QR no contiene formato de pago válido');
      logger.error('❌ [SCAN] Expected: "stellar:pay" or "order_id="');
      logger.error('❌ [SCAN] Actual:', decodedText);
      toast.error('Este QR no es válido para pagos');
    }
  };

  const onScanFailure = (error: string) => {
    // Ignore scanning errors (happen constantly)
    // console.log('Scan error:', error);
  };

  if (!account) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Escanear QR</h1>
            <button
              onClick={() => navigate(registeredUser?.role === 'client' ? '/client-dashboard' : '/artisan-dashboard')}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="bg-white px-4 pb-4 shadow-xl flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {!scanning && !error && (
              <div className="text-center space-y-6">
                <div className="text-6xl">📷</div>
                <p className="text-gray-600">
                  Escanea el código QR del artesano para pagar
                </p>
                <button
                  onClick={startScanning}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Abrir Cámara
                </button>
              </div>
            )}

            {error && (
              <div className="text-center space-y-4">
                <div className="text-6xl">[F]</div>
                <p className="text-red-600 font-semibold">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    startScanning();
                  }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Intentar de Nuevo
                </button>
              </div>
            )}

            {scanning && (
              <div className="w-full max-w-sm space-y-4">
                <div
                  id="reader"
                  className="rounded-lg overflow-hidden border-4 border-blue-500"
                ></div>
                <p className="text-center text-gray-600 text-sm">
                  Apunta la cámara al código QR
                </p>
                <button
                  onClick={stopScanning}
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Input Option */}
        <div className="bg-white rounded-b-2xl p-4 shadow-xl border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">
            ¿No puedes escanear? Ingresa el código manualmente
          </p>
          <input
            type="text"
            placeholder="Código de orden"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                navigate(`/pay/${e.currentTarget.value}`);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
