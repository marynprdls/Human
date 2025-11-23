import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../providers/SocialAuthProvider';
import { toast } from 'sonner';
import artisanRegistryService from '../services/artisanRegistry.service';
import type { Artisan } from 'artisan-registry-client';
import TransactionHistory from '../components/TransactionHistory';
import MobileLayout from '@/components/mobile-layout';
import Card from '@/components/card';
import PrimaryButton from '@/components/primary-button';
import FirstSaleModal from '../components/FirstSaleModal';
import { QrCode, Check, Clock, RefreshCw, LogOut, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '../utils/logger';

export default function ArtisanDashboard() {
  const navigate = useNavigate();
  const { account, userInfo, registeredUser, isAuthenticated, logout } = useSocialAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('Loading...');
  const [contractData, setContractData] = useState<Artisan | null>(null);
  const [isRegisteredOnChain, setIsRegisteredOnChain] = useState<boolean>(false);
  const [loadingContract, setLoadingContract] = useState<boolean>(true);
  const [showQRForm, setShowQRForm] = useState<boolean>(false);
  const [showFirstSaleModal, setShowFirstSaleModal] = useState<boolean>(false);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !account) {
      navigate('/login');
      return;
    }

    if (registeredUser && registeredUser.role !== 'artisan') {
      navigate('/role-select');
      return;
    }

    if (registeredUser) {
      loadBalance();
      loadContractData();
    }
  }, [isAuthenticated, account, registeredUser, navigate]);

  // Auto-refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      logger.log('🔄 Window focused, refreshing data...');
      if (registeredUser) {
        loadBalance();
        loadContractData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [registeredUser]);

  // Polling every 10 seconds to update counter
  useEffect(() => {
    if (!registeredUser || !isRegisteredOnChain) return;

    const interval = setInterval(() => {
      logger.log('⏰ Auto-refreshing contract data...');
      loadContractData();
      checkForFirstSale();
    }, 10000);

    return () => clearInterval(interval);
  }, [registeredUser, isRegisteredOnChain]);

  // Check for first sale on mount
  useEffect(() => {
    if (registeredUser && account) {
      checkForFirstSale();
    }
  }, [registeredUser, account]);

  const checkForFirstSale = async () => {
    if (!account || !registeredUser) return;

    try {
      // Check if user has first_sale_shown flag
      const hasShown = localStorage.getItem(`first_sale_shown_${account.publicKey}`);
      if (hasShown) return; // Already shown

      // Check total payments from contract
      if (contractData && contractData.total_payments === 1) {
        logger.log('🎉 First sale detected! Showing congratulations modal');
        setShowFirstSaleModal(true);
        localStorage.setItem(`first_sale_shown_${account.publicKey}`, 'true');
      }
    } catch (error) {
      logger.error('Error checking for first sale:', error);
    }
  };

  const loadContractData = async () => {
    if (!account) return;

    try {
      setLoadingContract(true);
      logger.log('🔍 Checking artisan registration on-chain...');

      const isRegistered = await artisanRegistryService.isRegistered(account.publicKey);
      setIsRegisteredOnChain(isRegistered);

      if (isRegistered) {
        const artisanData = await artisanRegistryService.getArtisan(account.publicKey);
        setContractData(artisanData);
        logger.log('✅ Artisan data from contract:', artisanData);
      } else {
        logger.log('ℹ️  Artisan not registered in contract');
      }
    } catch (error) {
      logger.error('Error loading contract data:', error);
    } finally {
      setLoadingContract(false);
    }
  };

  const loadBalance = async () => {
    if (!account) return;
    try {
      const balances = await account.getBalance();
      const xlmBalance = balances.find(b => b.asset === 'XLM');
      setBalance(xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0.00');
    } catch (error) {
      logger.error('Error loading balance:', error);
      setBalance('Error');
    }
  };

  const generateQR = async () => {
    logger.log('🚀 generateQR called! Amount:', amount, 'Account:', account?.publicKey);

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!account) {
      toast.error('No hay cuenta conectada');
      return;
    }

    setLoading(true);
    logger.log('📡 Making request to:', `${import.meta.env.PUBLIC_API_URL}/api/orders/create`);
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_address: account.publicKey,
          amount_xlm: amount,
          currency: 'XLM',
          description: description || 'Pago por servicio',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar QR');
      }

      const data = await response.json();
      setQrDataUrl(data.qr_data_url);
      setOrderId(data.order_id);
      setShowQRForm(false);
      toast.success('¡QR generado!');
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error('Error al generar QR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearQR = () => {
    setQrDataUrl(null);
    setOrderId(null);
    setAmount('');
    setDescription('');
    setShowQRForm(false);
  };

  const handleIncrementPayments = async () => {
    if (!account || !isRegisteredOnChain) {
      toast.error('Debes estar registrado on-chain');
      return;
    }

    setLoading(true);
    try {
      logger.log('📊 Incrementando contador de pagos...');

      const result = await artisanRegistryService.incrementPayments(
        account.publicKey,
        async (xdr: string) => {
          return await account.signTransaction(xdr);
        }
      );

      if (result.success) {
        toast.success('¡Contador incrementado exitosamente!');
        logger.log('✅ Payment counter incremented, TX hash:', result.txHash);

        // Recargar datos del contrato
        await loadContractData();

        // Check for first sale
        await checkForFirstSale();
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch (error: any) {
      logger.error('Error incrementing payments:', error);
      toast.error('Error al incrementar contador');
    } finally {
      setLoading(false);
    }
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
    <>
      <FirstSaleModal
        isOpen={showFirstSaleModal}
        onClose={() => setShowFirstSaleModal(false)}
        onViewMap={() => {
          setShowFirstSaleModal(false);
          navigate('/map');
        }}
      />

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
                {userInfo?.name?.[0] || 'A'}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                {userInfo?.name || 'Artesano'}
                {contractData?.verified && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                {isRegisteredOnChain && !contractData?.verified && (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
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
            <div className="space-y-2">
              <p className="text-sm opacity-70">Saldo disponible</p>
              <p className="text-5xl font-bold">{balance}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm opacity-70">XLM</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${account.publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
                >
                  Ver en Stellar Expert
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </Card>

          {/* QR Display or Generation Button */}
          {!qrDataUrl ? (
            !showQRForm ? (
              <PrimaryButton
                variant="primary"
                onClick={() => setShowQRForm(true)}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-3">
                  <QrCode className="w-6 h-6" />
                  <span>Generar QR de pago</span>
                </div>
              </PrimaryButton>
            ) : (
              <Card>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Crear QR de Pago</h2>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                        Monto (XLM)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="10.00"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">
                        Descripción (opcional)
                      </Label>
                      <Input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Artesanía hecha a mano"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <PrimaryButton
                        onClick={generateQR}
                        disabled={loading}
                        variant="primary"
                        className="flex-1"
                      >
                        {loading ? 'Generando...' : 'Generar QR'}
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => setShowQRForm(false)}
                        variant="secondary"
                        className="flex-1"
                      >
                        Cancelar
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </Card>
            )
          ) : (
            <Card>
              <div className="flex flex-col items-center space-y-4">
                <h2 className="text-xl font-bold text-foreground text-center">
                  ¡Muestra este QR al cliente!
                </h2>

                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-4 border-border rounded-2xl"
                />

                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{amount} XLM</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <PrimaryButton
                    onClick={clearQR}
                    variant="primary"
                    className="w-full"
                  >
                    Generar Nuevo QR
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={clearQR}
                    variant="secondary"
                    className="w-full"
                  >
                    Ocultar QR
                  </PrimaryButton>
                </div>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Resumen</h2>

            <div className="grid grid-cols-2 gap-4">
              {isRegisteredOnChain && contractData && (
                <Card padding="md" className="bg-secondary">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pagos verificados</p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-3xl font-bold text-foreground">{contractData.total_payments}</p>
                      <button
                        onClick={loadContractData}
                        disabled={loadingContract}
                        className="p-1 hover:bg-background/50 rounded-lg transition-colors disabled:opacity-50"
                        title="Actualizar"
                      >
                        <RefreshCw className={`w-4 h-4 text-muted-foreground ${loadingContract ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">On-chain (Soroban)</p>
                    <button
                      onClick={handleIncrementPayments}
                      disabled={loading}
                      className="w-full mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Incrementando...' : '+ Registrar pago'}
                    </button>
                  </div>
                </Card>
              )}

              <Card padding="md" className="bg-secondary">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="text-lg font-bold text-foreground">
                    {contractData?.verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-5 h-5" />
                        Verificado
                      </span>
                    ) : isRegisteredOnChain ? (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No registrado</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Verificación admin</p>
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
              <h2 className="text-lg font-bold text-foreground">Transacciones recientes</h2>
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
        </div>
      </div>
    </MobileLayout>
    </>
  );
}
