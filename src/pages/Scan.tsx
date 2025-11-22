import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'react-toastify';

export default function Scan() {
  const navigate = useNavigate();
  const { isAuthenticated, account } = useSocialAuth();
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
    try {
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );

      setScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error al iniciar scanner:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
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
        console.error('Error al detener scanner:', err);
      }
    }
  };

  const onScanSuccess = (decodedText: string) => {
    console.log('QR escaneado:', decodedText);
    stopScanning();

    // Parse Stellar payment URI
    // Format: web+stellar:pay?destination=GXXX&amount=10&memo=abc
    if (decodedText.includes('stellar:pay') || decodedText.includes('order_id=')) {
      try {
        // Extract order ID from QR
        const url = new URL(decodedText.replace('web+stellar:pay', 'http://dummy'));
        const orderId = url.searchParams.get('memo') || url.searchParams.get('order_id');

        if (orderId) {
          toast.success('¡QR escaneado correctamente!');
          navigate(`/pay/${orderId}`);
        } else {
          toast.error('QR inválido: No se encontró orden');
        }
      } catch (err) {
        console.error('Error parsing QR:', err);
        toast.error('QR inválido');
      }
    } else {
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
              onClick={() => navigate('/role-select')}
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
                <div className="text-6xl">❌</div>
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
