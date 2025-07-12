import { useEffect, useState } from "react";
import { useAccounts } from "./useAccounts";

export default function useBalance() {
  const { accounts } = useAccounts();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<
    Map<string, { currency: string; balance: string }>
  >(new Map());

  const loadBalances = async () => {
    try {
      setLoading(true);
      const balances = accounts.reduce<
        Map<string, { currency: string; balance: number }>
      >((acc, account) => {
        acc.set(account.currency, {
          currency: account.currency,
          balance:
            Number(account.balance) +
            Number(acc.get(account.currency)?.balance || 0),
        });
        return acc;
      }, new Map());
      const formattedBalances = Array.from(balances.values()).map((balance) => {
        let locale = "en-US";
        if (balance.currency === "MXN") {
          locale = "es-MX";
        }
        const format = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: balance.currency,
          currencyDisplay: "code",
        });
        return {
          currency: balance.currency,
          balance: format.format(balance.balance),
        };
      });
      setBalances(
        new Map(formattedBalances.map((balance) => [balance.currency, balance]))
      );
    } catch (err) {
      console.error("Error loading balances:", err);
      setError("Failed to load balance information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []); // Añadir accounts como dependencia para que se actualice cuando cambien

  useEffect(() => {
    loadBalances();
  }, [accounts]);

  return {
    balances,
    loading,
    error,
  };
}
