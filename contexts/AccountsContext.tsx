import { Account } from "@/lib/models/types";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import {
  createAccount,
  deleteAccount as delAccount,
  getAccounts,
} from "@/lib/database/accountService";

// Tipo para una nueva cuenta (sin los campos automáticos)
export type NewAccount = Omit<
  Account,
  "id" | "created_at" | "updated_at" | "is_deleted" | "sync_status" | "last_synced_at"
>;

// Define the context type
interface AccountsContextType {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  deleteAccount: (id: string) => Promise<boolean>;
  addAccount: (account: NewAccount) => Promise<boolean>;
  refresh: () => void;
}

// Create the context with a default value
export const AccountsContext = createContext<AccountsContextType>({
  accounts: [],
  loading: false,
  error: null,
  deleteAccount: async () => false,
  addAccount: async () => false,
  refresh: () => {},
});

// Provider props type
interface AccountsProviderProps {
  children: ReactNode;
}

// Create the provider component
export function AccountsProvider({ children }: AccountsProviderProps) {
  // States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Function to load accounts
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAccounts();
      if (result.success) {
        setAccounts(result.data || []);
      } else {
        setError(result.error || "Error al cargar las cuentas");
      }
    } catch (err) {
      setError("Error inesperado al cargar las cuentas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await delAccount(id);
      if (result.success) {
        setAccounts((prev) => prev.filter((account) => account.id !== id));
        return true;
      } else {
        setError(result.error || "Error al eliminar la cuenta");
        return false;
      }
    } catch (err) {
      setError("Error inesperado al eliminar la cuenta");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add account
  const addAccount = useCallback(async (account: NewAccount) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createAccount(account);
      if (result.success && result.data) {
        setAccounts((prev) => [...prev, result.data!]);
        return true;
      } else {
        setError(result.error || "Error al crear la cuenta");
        return false;
      }
    } catch (err) {
      setError("Error inesperado al crear la cuenta");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to force a manual refresh
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Effect to load accounts at the beginning or when a refresh is requested
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, refreshTrigger]);

  // Create the context value object
  const value: AccountsContextType = {
    accounts,
    loading,
    error,
    deleteAccount,
    addAccount,
    refresh
  };

  // Return the provider with the value
  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}
