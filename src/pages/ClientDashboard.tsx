import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'sonner';
import TransactionHistory from '../components/TransactionHistory';
import MobileLayout from '@/components/mobile-layout';
import Card from '@/components/card';
import PrimaryButton from '@/components/primary-button';
import { Copy, RefreshCw, LogOut, ExternalLink, Scan, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../utils/logger';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { account, userInfo, registeredUser, isAuthenticated, logout } = useSocialAuth();
  const [xlmBalance, setXlmBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }

    if (registeredUser && registeredUser.role !== 'client') {
      navigate('/role-select');
      return;
    }

    if (registeredUser) {
      loadBalance();
    }
  }, [isAuthenticated, account, registeredUser, navigate]);

  const loadBalance = async () => {
    if (!account) return;

    try {
      setLoadingBalance(true);
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/transactions/${account.publicKey}/balance`
      );

      if (!response.ok) {
        throw new Error('Error al cargar balance');
      }

      const data = await response.json();
      setXlmBalance(data.xlm);
    } catch (error: any) {
      logger.error('Error loading balance:', error);
      toast.error('Error al cargar balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.publicKey);
    toast.success('Dirección copiada al portapapeles');
  };

  // Show loading while waiting for registeredUser
  if (!account || !registeredUser) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout showBottomNav activeTab="home">
      <div className="pb-24">
        {/* Custom Header with Avatar and Logout */}
        <div className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
          <div className="flex items-center gap-3">
            {userInfo?.picture ? (
              <img
                src={userInfo.picture}
                alt={userInfo.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-background font-bold">
                {userInfo?.name?.[0] || registeredUser.name?.[0] || 'C'}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {userInfo?.name || registeredUser.name}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {account.publicKey.substring(0, 8)}...{account.publicKey.substring(account.publicKey.length - 4)}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-destructive/10 flex items-center justify-center transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Large Balance Card */}
          <Card className="bg-foreground text-background">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm opacity-70">Balance total</p>
                {loadingBalance ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-background/30 border-t-background rounded-full animate-spin"></div>
                    <p className="text-3xl font-bold opacity-50">Cargando...</p>
                  </div>
                ) : (
                  <p className="text-5xl font-bold">{xlmBalance !== null ? xlmBalance.toFixed(2) : '0.00'}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm opacity-70">XLM</p>
                  <button
                    onClick={loadBalance}
                    disabled={loadingBalance}
                    className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 disabled:opacity-30"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingBalance ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${account.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs flex items-center gap-1"
                >
                  Ver en Stellar Expert
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </Card>

          {/* Main Actions */}
          <div className="grid grid-cols-2 gap-4">
            <PrimaryButton
              onClick={() => navigate('/scan')}
              variant="primary"
              className="h-auto"
            >
              <div className="flex flex-col items-center gap-2 py-3">
                <Scan className="w-8 h-8" />
                <span className="text-sm font-medium">Escanear QR</span>
              </div>
            </PrimaryButton>

            <PrimaryButton
              onClick={handleCopyAddress}
              variant="secondary"
              className="h-auto"
            >
              <div className="flex flex-col items-center gap-2 py-3">
                <Copy className="w-8 h-8" />
                <span className="text-sm font-medium">Copiar dirección</span>
              </div>
            </PrimaryButton>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Resumen</h2>

            <div className="grid grid-cols-2 gap-4">
              <Card padding="md" className="bg-secondary">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Wallet</p>
                  <p className="text-lg font-bold text-foreground">Stellar</p>
                  <p className="text-xs text-primary">Testnet</p>
                </div>
              </Card>

              <Card padding="md" className="bg-secondary">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-lg font-bold text-foreground">Cliente</p>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Transaction History - Collapsible */}
          <div className="space-y-4">
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <h2 className="text-lg font-bold text-foreground">Actividad reciente</h2>
              {showTransactions ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {showTransactions && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <TransactionHistory address={account.publicKey} limit={5} />
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">ℹ️</span>
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Información importante</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Transacciones en red Stellar (Testnet)</li>
                  <li>• Pagos instantáneos y seguros</li>
                  <li>• Wallet protegido con Google OAuth</li>
                  <li>• Escanea QR para pagar a artesanos</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
