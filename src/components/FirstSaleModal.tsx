import { MapPin, Sparkles, X } from 'lucide-react';
import PrimaryButton from './primary-button';
import Card from './card';

interface FirstSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMap: () => void;
}

export default function FirstSaleModal({ isOpen, onClose, onViewMap }: FirstSaleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scaleIn">
        <Card className="relative bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-primary">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center space-y-6 py-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-bounce">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🎉</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                ¡Felicidades!
              </h2>
              <p className="text-xl font-semibold text-primary">
                Es tu primera venta
              </p>
            </div>

            {/* Message */}
            <div className="bg-white/80 rounded-lg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-left text-foreground">
                  Ahora aparecerás en el <span className="font-bold text-primary">mapa</span> como un negocio que usa nuestros servicios
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-muted-foreground text-left">
                  Los clientes podrán encontrarte y conocer tus productos de forma más fácil
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <PrimaryButton
                onClick={onViewMap}
                variant="primary"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Ver mapa</span>
                </div>
              </PrimaryButton>

              <PrimaryButton
                onClick={onClose}
                variant="secondary"
                className="w-full"
              >
                Continuar
              </PrimaryButton>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
