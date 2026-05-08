import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Investment, useInvestmentService } from "../lib/database/investmentService";
import { shouldRefreshMarketPrices, refreshAllMarketPrices, getLastMarketUpdate, formatLastUpdate } from "../lib/services/marketService";

const LAST_MARKET_UPDATE_KEY = 'lastMarketUpdate';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export type InvestmentRange = '1S' | '1M' | '3M' | '6M' | '1A' | 'Todo';

export interface PortfolioPoint {
  date: number;
  value: number;
}

type InvestmentsContextType = {
  investments: Investment[];
  isLoading: boolean;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPct: number;
  lastMarketUpdate: number | null;
  lastMarketUpdateFormatted: string;
  refreshInvestments: () => Promise<void>;
  refreshMarketPrices: () => Promise<void>;
  getHistoryForRange: (range: InvestmentRange) => Promise<PortfolioPoint[]>;
  addToInvestment: (investmentId: string, amount: number, walletId: string) => Promise<void>;
  withdrawFromInvestment: (investmentId: string, amount: number, walletId: string) => Promise<void>;
};

const InvestmentsContext = createContext<InvestmentsContextType | undefined>(undefined);

const RANGE_DAYS: Record<InvestmentRange, number | null> = {
  '1S': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
  'Todo': null,
};

export const InvestmentsProvider = ({ children }: { children: ReactNode }) => {
  const service = useInvestmentService();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMarketUpdate, setLastMarketUpdate] = useState<number | null>(null);

  const lastMarketUpdateFormatted = useMemo(() => {
    if (!lastMarketUpdate) return 'Nunca';
    return formatLastUpdate(lastMarketUpdate);
  }, [lastMarketUpdate]);

  const refreshMarketPrices = useCallback(async () => {
    try {
      const shouldRefresh = await shouldRefreshMarketPrices();
      
      if (shouldRefresh) {
        const result = await refreshAllMarketPrices(investments);
        if (result.success) {
          const timestamp = await getLastMarketUpdate();
          setLastMarketUpdate(timestamp);
        }
      } else {
        const timestamp = await getLastMarketUpdate();
        setLastMarketUpdate(timestamp);
      }
    } catch (error) {
      console.error("[InvestmentsContext] Error al refrescar precios de mercado:", error);
    }
  }, [investments]);

  const refreshInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      await service.runDailyCompoundForAll();
      const active = await service.getActiveInvestments();
      setInvestments(active);
      
      const shouldRefresh = await shouldRefreshMarketPrices();
      if (shouldRefresh && active.length > 0) {
        await refreshAllMarketPrices(active);
        const timestamp = Date.now();
        await AsyncStorage.setItem(LAST_MARKET_UPDATE_KEY, timestamp.toString());
        setLastMarketUpdate(timestamp);
      } else {
        const timestamp = await getLastMarketUpdate();
        setLastMarketUpdate(timestamp);
      }
    } catch (error) {
      console.error("[InvestmentsContext] Error al refrescar inversiones:", error);
      setInvestments([]);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const addToInvestment = useCallback(async (investmentId: string, amount: number, walletId: string) => {
    await service.addToInvestment(investmentId, amount, walletId);
    const active = await service.getActiveInvestments();
    setInvestments(active);
  }, [service]);

  const withdrawFromInvestment = useCallback(async (investmentId: string, amount: number, walletId: string) => {
    await service.withdrawFromInvestment(investmentId, amount, walletId);
    const active = await service.getActiveInvestments();
    setInvestments(active);
  }, [service]);

  useEffect(() => {
    refreshInvestments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHistoryForRange = useCallback(async (range: InvestmentRange): Promise<PortfolioPoint[]> => {
    try {
      const days = RANGE_DAYS[range];
      const active = await service.getActiveInvestments();

      const dayMapMs = new Map<number, number>();

      for (const inv of active) {
        const history = await service.getInvestmentHistory(inv.id, days ?? undefined);
        for (const point of history) {
          const existing = dayMapMs.get(point.date) ?? 0;
          dayMapMs.set(point.date, existing + point.value);
        }
      }

      return Array.from(dayMapMs.entries())
        .sort(([a], [b]) => a - b)
        .map(([date, value]) => ({ date, value }));
    } catch (error) {
      console.error("[InvestmentsContext] Error al obtener historial:", error);
      return [];
    }
  }, [service]);

  const { totalValue, totalCost, totalGain, gainPct } = useMemo(() => {
    const totalValue = investments.reduce((acc, inv) => acc + inv.current_value, 0);
    const totalCost = investments.reduce((acc, inv) => acc + inv.principal, 0);
    const totalGain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalGain, gainPct };
  }, [investments]);

  const value = useMemo<InvestmentsContextType>(
    () => ({
      investments,
      isLoading,
      totalValue,
      totalCost,
      totalGain,
      gainPct,
      lastMarketUpdate,
      lastMarketUpdateFormatted,
      refreshInvestments,
      refreshMarketPrices,
      getHistoryForRange,
      addToInvestment,
      withdrawFromInvestment,
    }),
    [investments, isLoading, totalValue, totalCost, totalGain, gainPct, lastMarketUpdate, lastMarketUpdateFormatted, refreshInvestments, refreshMarketPrices, getHistoryForRange, addToInvestment, withdrawFromInvestment]
  );

  return (
    <InvestmentsContext.Provider value={value}>
      {children}
    </InvestmentsContext.Provider>
  );
};

export const useInvestments = () => {
  const context = useContext(InvestmentsContext);
  if (context === undefined) {
    throw new Error("useInvestments must be used within an InvestmentsProvider");
  }
  return context;
};
