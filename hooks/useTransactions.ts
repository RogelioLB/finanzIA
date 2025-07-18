import { useTransactions as useTransactionsContext } from '@/contexts/TransactionsContext';

export const useTransactions = () => {
  const context = useTransactionsContext();
  
  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
    
    return type === 'expense' ? `-${formattedAmount}` : `+${formattedAmount}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return {
    ...context,
    formatAmount,
    formatDate,
  };
};
