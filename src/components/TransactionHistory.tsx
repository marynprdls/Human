import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Transaction {
  id: string;
  type: 'received' | 'sent';
  hash: string;
  created_at: string;
  from: string;
  to: string;
  amount: number;
  asset_code: string;
  memo: string;
  successful: boolean;
}

interface TransactionHistoryProps {
  address: string;
  limit?: number;
}

export default function TransactionHistory({ address, limit = 10 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [address, limit]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/api/transactions/${address}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar transacciones');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message);
      toast.error('Error al cargar historial de transacciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de Transacciones</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de Transacciones</h3>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button
            onClick={loadTransactions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de Transacciones</h3>
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No hay transacciones aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Historial de Transacciones</h3>
        <button
          onClick={loadTransactions}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {tx.type === 'received' ? (
                  <span className="text-2xl">⬇️</span>
                ) : (
                  <span className="text-2xl">⬆️</span>
                )}
                <div>
                  <p className="font-semibold text-gray-800">
                    {tx.type === 'received' ? 'Recibido' : 'Enviado'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'received' ? 'text-green-600' : 'text-gray-600'}`}>
                  {tx.type === 'received' ? '+' : '-'}{(tx.amount || 0).toFixed(2)} {tx.asset_code}
                </p>
                {tx.successful ? (
                  <span className="text-xs text-green-500">✓ Confirmado</span>
                ) : (
                  <span className="text-xs text-red-500">✗ Fallido</span>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">De:</span>
                <span className="font-mono">{truncateAddress(tx.from)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Para:</span>
                <span className="font-mono">{truncateAddress(tx.to)}</span>
              </div>
              {tx.memo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Memo:</span>
                  <span className="font-mono">{tx.memo}</span>
                </div>
              )}
              <div className="mt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Ver en explorador →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length >= limit && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Mostrando las últimas {limit} transacciones
          </p>
        </div>
      )}
    </div>
  );
}
