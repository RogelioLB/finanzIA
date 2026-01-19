import { useSQLiteContext } from "expo-sqlite";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAllSubscriptions } from "../lib/database/subscriptionService";
import { Subscription } from "../lib/models/types";

type SubscriptionsContextType = {
  subscriptions: Subscription[];
  isLoading: boolean;
  refreshSubscriptions: () => Promise<void>;
};

const SubscriptionsContext = createContext<
  SubscriptionsContextType | undefined
>(undefined);

export const SubscriptionsProvider = ({ children }: { children: ReactNode }) => {
  const db = useSQLiteContext();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const subs = await getAllSubscriptions(db);
      setSubscriptions(subs);
    } catch (error) {
      console.error("Error al obtener suscripciones:", error);
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  const value = useMemo<SubscriptionsContextType>(
    () => ({
      subscriptions,
      isLoading,
      refreshSubscriptions,
    }),
    [subscriptions, isLoading, refreshSubscriptions]
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext);
  if (context === undefined) {
    throw new Error(
      "useSubscriptions must be used within a SubscriptionsProvider"
    );
  }
  return context;
};
