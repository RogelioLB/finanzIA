import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSQLiteService } from '@/lib/database/sqliteService';

interface TransactionDisplay {
  id: string;
  title: string;
  amount: number;
  type: string;
  timestamp: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
}

interface TransactionsContextType {
  transactions: TransactionDisplay[];
  recentTransactions: TransactionDisplay[];
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

interface TransactionsProviderProps {
  children: ReactNode;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTransactions } = useSQLiteService();
  const getTransactionsRef = useRef(getTransactions);
  
  // Actualizar la referencia cuando cambie getTransactions
  useEffect(() => {
    getTransactionsRef.current = getTransactions;
  }, [getTransactions]);

  const refreshTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getTransactionsRef.current();
      const formattedTransactions = result.map(transaction => ({
        id: transaction.id,
        title: transaction.title || 'Sin título',
        amount: transaction.amount,
        type: transaction.type,
        timestamp: transaction.timestamp,
        category_name: transaction.category_name,
        category_icon: transaction.category_icon,
        category_color: transaction.category_color,
        wallet_name: transaction.wallet_name,
      }));
      
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTransactions();
  }, []);

  // Obtener las últimas 5 transacciones
  const recentTransactions = transactions.slice(0, 5);

  const value: TransactionsContextType = {
    transactions,
    recentTransactions,
    loading,
    error,
    refreshTransactions,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
