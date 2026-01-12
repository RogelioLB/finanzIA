import { useWallets } from "@/contexts/WalletsContext";
import { useCallback, useEffect, useState } from "react";

interface WalletBalance {
  id: string;
  name: string;
  balance: string;
  currency: string;
  icon?: string;
  color?: string;
}

interface CurrencyBalance {
  currency: string;
  balance: string;
  totalWallets: number;
}

export default function useBalance() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Map<string, CurrencyBalance>>(
    new Map()
  );
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);

  const loadBalances = useCallback(async () => {
    try {
      setLoading(true);

      // Si no hay wallets, establecer un balance vacío
      if (!wallets || wallets.length === 0) {
        setBalances(new Map());
        setWalletBalances([]);
        return;
      }
      
      // Crear balances individuales de wallets (excluyendo tarjetas de crédito)
      const individualWallets: WalletBalance[] = wallets
        .filter(wallet => wallet.type !== 'credit')
        .map(wallet => {
        const currency = wallet.currency || 'USD';
        // Usar el net_balance en lugar del balance principal
        const balance = Number(wallet.net_balance !== undefined ? wallet.net_balance : wallet.balance) || 0;
        
        let locale = "en-US";
        if (currency === "MXN") {
          locale = "es-MX";
        }
        
        try {
          const format = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            currencyDisplay: "code",
          });
          return {
            id: wallet.id,
            name: wallet.name,
            balance: format.format(balance),
            currency: currency,
            icon: wallet.icon,
            color: wallet.color,
          };
        } catch (formatError) {
          console.warn(`Error formatting currency ${currency}:`, formatError);
          return {
            id: wallet.id,
            name: wallet.name,
            balance: `${currency} ${balance.toFixed(2)}`,
            currency: currency,
            icon: wallet.icon,
            color: wallet.color,
          };
        }
      });
      
      // Crear balances agrupados por moneda (excluyendo tarjetas de crédito)
      const currencyBalances = new Map<string, { currency: string; balance: number; count: number }>();

      for (const wallet of wallets.filter(w => w.type !== 'credit')) {
        const currency = wallet.currency || 'USD';
        // Usar el net_balance en lugar del balance principal
        const balance = Number(wallet.net_balance !== undefined ? wallet.net_balance : wallet.balance) || 0;
        
        const existing = currencyBalances.get(currency);
        currencyBalances.set(currency, {
          currency: currency,
          balance: balance + (existing?.balance || 0),
          count: (existing?.count || 0) + 1,
        });
      }
      
      const formattedBalances = Array.from(currencyBalances.values()).map((balance) => {
        let locale = "en-US";
        if (balance.currency === "MXN") {
          locale = "es-MX";
        }
        
        try {
          const format = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: balance.currency,
            currencyDisplay: "code",
          });
          return {
            currency: balance.currency,
            balance: format.format(balance.balance),
            totalWallets: balance.count,
          };
        } catch (formatError) {
          console.warn(`Error formatting currency ${balance.currency}:`, formatError);
          return {
            currency: balance.currency,
            balance: `${balance.currency} ${balance.balance.toFixed(2)}`,
            totalWallets: balance.count,
          };
        }
      });
      
      setWalletBalances(individualWallets);
      setBalances(
        new Map(formattedBalances.map((balance) => [balance.currency, balance]))
      );
    } catch (err) {
      console.error("Error loading balances:", err);
      setError("Failed to load balance information");
    } finally {
      setLoading(false);
    }
  }, [wallets]);

  useEffect(() => {
    loadBalances();
  }, [wallets, loadBalances]);

  return {
    balances,
    walletBalances,
    loading,
    error,
  };
}
