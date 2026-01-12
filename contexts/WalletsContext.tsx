import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface WalletsContextType {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  refreshWallets: () => Promise<void>;
  createWallet: (params: {
    name: string;
    balance?: number;
    icon: string;
    color: string;
    currency?: string;
    type?: 'regular' | 'credit';
    // Credit wallet fields
    bank?: string;
    last_four_digits?: string;
    credit_limit?: number;
    cut_off_day?: number;
    payment_due_day?: number;
    interest_rate?: number;
  }) => Promise<string>;
  updateWallet: (
    id: string,
    params: {
      name?: string;
      balance?: number;
      icon?: string;
      color?: string;
      currency?: string;
      type?: 'regular' | 'credit';
      bank?: string;
      last_four_digits?: string;
      credit_limit?: number;
      cut_off_day?: number;
      payment_due_day?: number;
      interest_rate?: number;
    }
  ) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  getWalletById: (id: string) => Wallet | undefined;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

export const useWallets = () => {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error("useWallets must be used within a WalletsProvider");
  }
  return context;
};

interface WalletsProviderProps {
  children: React.ReactNode;
}

export const WalletsProvider: React.FC<WalletsProviderProps> = ({
  children,
}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sqliteService = useSQLiteService();

  // Cargar wallets desde la base de datos
  const refreshWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const walletsData = await sqliteService.getWallets();
      setWallets(walletsData);
    } catch (err) {
      console.error("Error loading wallets:", err);
      setError("Error al cargar las cuentas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear nueva wallet
  const createWallet = useCallback(
    async (params: {
      name: string;
      balance?: number;
      icon: string;
      color: string;
      currency?: string;
    }) => {
      try {
        setError(null);
        const id = await sqliteService.createWallet(params);
        await refreshWallets(); // Actualizar la lista
        return id;
      } catch (err) {
        console.error("Error creating wallet:", err);
        setError("Error al crear la cuenta");
        throw err;
      }
    },
    [refreshWallets]
  );

  // Actualizar wallet existente
  const updateWallet = useCallback(
    async (
      id: string,
      params: {
        name?: string;
        balance?: number;
        icon?: string;
        color?: string;
        currency?: string;
      }
    ) => {
      try {
        setError(null);
        await sqliteService.updateWallet(id, params);
        await refreshWallets(); // Actualizar la lista
      } catch (err) {
        console.error("Error updating wallet:", err);
        setError("Error al actualizar la cuenta");
        throw err;
      }
    },
    [refreshWallets]
  );

  // Eliminar wallet
  const deleteWallet = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await sqliteService.deleteWallet(id);
        await refreshWallets(); // Actualizar la lista
      } catch (err) {
        console.error("Error deleting wallet:", err);
        setError("Error al eliminar la cuenta");
        throw err;
      }
    },
    [refreshWallets]
  );

  // Obtener wallet por ID
  const getWalletById = useCallback(
    (id: string): Wallet | undefined => {
      return wallets.find((wallet) => wallet.id === id);
    },
    [wallets]
  );

  // Cargar wallets al montar el componente
  useEffect(() => {
    refreshWallets();
  }, [refreshWallets]);

  const value: WalletsContextType = {
    wallets,
    isLoading,
    error,
    refreshWallets,
    createWallet,
    updateWallet,
    deleteWallet,
    getWalletById,
  };

  return (
    <WalletsContext.Provider value={value}>{children}</WalletsContext.Provider>
  );
};
