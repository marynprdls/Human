import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import MobileLayout from '@/components/mobile-layout';
import Card from '@/components/card';
import PrimaryButton from '@/components/primary-button';
import { User, LogOut, ExternalLink, Copy, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { account, userInfo, registeredUser, logout } = useSocialAuth();

  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.publicKey);
    toast.success('Dirección copiada al portapapeles');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!account || !registeredUser) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout showBottomNav activeTab="profile">
      <div className="pb-24">
        {/* Header */}
        <div className="px-6 py-4 bg-background border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Mi Perfil
          </h1>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Profile Picture & Info */}
          <Card>
            <div className="flex flex-col items-center text-center space-y-4">
              {userInfo?.picture ? (
                <img
                  src={userInfo.picture}
                  alt={userInfo.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-background text-3xl font-bold border-4 border-primary/20">
                  {userInfo?.name?.[0] || registeredUser.name?.[0] || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {userInfo?.name || registeredUser.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Shield className="w-4 h-4" />
                  {registeredUser.role === 'artisan' ? 'Artesano' : 'Cliente'}
                </p>
              </div>
            </div>
          </Card>

          {/* Account Info */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Información de cuenta</h3>

              {userInfo?.email && (
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground font-medium">{userInfo.email}</p>
                  </div>
                </div>
              )}

              {registeredUser.phone && (
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm text-foreground font-medium">{registeredUser.phone}</p>
                  </div>
                </div>
              )}

              {registeredUser.location_data && (
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="text-sm text-foreground font-medium">
                      {registeredUser.location_data.description || 'Lima, Perú'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Wallet Info */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Billetera Stellar</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Dirección pública</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-background rounded-lg text-xs font-mono text-foreground break-all">
                      {account.publicKey}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors"
                      title="Copiar dirección"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <a
                  href={`https://stellar.expert/explorer/testnet/account/${account.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-background hover:bg-secondary rounded-lg text-sm font-medium text-foreground transition-colors"
                >
                  Ver en Stellar Expert
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>

          {/* Network Info */}
          <Card className="bg-secondary">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">ℹ️</span>
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Información de red</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Red: Stellar Testnet</li>
                  <li>• Autenticación: Google OAuth</li>
                  <li>• Wallet: Determinística (BIP-39/BIP-44)</li>
                  <li>• Protocolo: Soroban Smart Contracts</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <PrimaryButton
              onClick={() => navigate(registeredUser.role === 'artisan' ? '/artisan-dashboard' : '/client-dashboard')}
              variant="secondary"
              className="w-full"
            >
              Volver al inicio
            </PrimaryButton>

            <PrimaryButton
              onClick={handleLogout}
              variant="primary"
              className="w-full bg-destructive hover:bg-destructive/90"
            >
              <div className="flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" />
                <span>Cerrar sesión</span>
              </div>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
