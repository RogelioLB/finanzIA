export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  title: string;
  note?: string;
  timestamp: number;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  is_excluded: number;
}

export interface WalletStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
  categoryStats: {
    [key: string]: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
}
