import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'sonner';
import MobileLayout from '@/components/mobile-layout';
import Card from '@/components/card';
import { MapPin, User, Check } from 'lucide-react';
import { logger } from '../utils/logger';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface VerifiedArtisan {
  address: string;
  name: string;
  description?: string;
  total_payments: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function Map() {
  const navigate = useNavigate();
  const { isAuthenticated, account, registeredUser } = useSocialAuth();
  const [artisans, setArtisans] = useState<VerifiedArtisan[]>([]);
  const [loading, setLoading] = useState(true);

  // Default to a generic location (e.g., Lima, Peru)
  const defaultCenter: [number, number] = [-12.0464, -77.0428];

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }

    loadVerifiedArtisans();
  }, [isAuthenticated, account, navigate]);

  const loadVerifiedArtisans = async () => {
    try {
      setLoading(true);
      logger.log('🗺️ [MAP] Cargando artesanos verificados...');

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/artisans/verified`
      );

      if (!response.ok) {
        throw new Error('Error al cargar artesanos');
      }

      const data = await response.json();
      logger.log('✅ [MAP] Artesanos cargados:', data.artisans.length);

      // Filter only artisans with location data
      const artisansWithLocation = data.artisans.filter(
        (a: VerifiedArtisan) => a.location?.latitude && a.location?.longitude
      );

      logger.log('📍 [MAP] Artesanos con ubicación:', artisansWithLocation.length);
      setArtisans(artisansWithLocation);
    } catch (error: any) {
      logger.error('❌ [MAP] Error al cargar artesanos:', error);
      toast.error('Error al cargar artesanos');
    } finally {
      setLoading(false);
    }
  };

  if (!account || !registeredUser) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout showBottomNav activeTab="map">
      <div className="pb-24">
        {/* Header */}
        <div className="px-6 py-4 bg-background border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Mapa de Artesanos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Artesanos verificados que usan HUMAN
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Cargando artesanos...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Card */}
            <div className="px-6 py-4">
              <Card padding="md" className="bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{artisans.length}</p>
                      <p className="text-sm text-muted-foreground">Artesanos verificados</p>
                    </div>
                  </div>
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </Card>
            </div>

            {/* Map */}
            {artisans.length > 0 ? (
              <div className="px-6 pb-6">
                <Card padding="none" className="overflow-hidden">
                  <MapContainer
                    center={artisans[0]?.location ? [artisans[0].location.latitude, artisans[0].location.longitude] : defaultCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {artisans.map((artisan) => {
                      if (!artisan.location) return null;

                      return (
                        <Marker
                          key={artisan.address}
                          position={[artisan.location.latitude, artisan.location.longitude]}
                        >
                          <Popup>
                            <div className="p-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="w-4 h-4 text-green-600" />
                                <p className="font-bold text-foreground">{artisan.name}</p>
                              </div>
                              {artisan.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {artisan.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">
                                  {artisan.total_payments} pagos verificados
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {artisan.address.substring(0, 8)}...{artisan.address.substring(artisan.address.length - 4)}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </Card>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <Card className="bg-secondary">
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">
                      No hay artesanos verificados aún
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Los artesanos aparecerán aquí después de su primera venta verificada
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Info Card */}
            <div className="px-6 pb-6">
              <Card className="bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">ℹ️</span>
                  </div>
                  <div className="flex-1 space-y-2 text-sm">
                    <p className="font-semibold text-foreground">¿Cómo funciona el mapa?</p>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      <li>• Solo aparecen artesanos verificados</li>
                      <li>• Artesanos con al menos 1 venta confirmada</li>
                      <li>• Haz clic en los marcadores para más info</li>
                      <li>• Mapa actualizado en tiempo real</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
