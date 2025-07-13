import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  calculateNextPaymentDate,
  createSubscription,
  deleteSubscription,
  getSubscriptionById,
  getSubscriptions,
  getUpcomingSubscriptions,
  updateSubscription,
} from "../lib/database/subscriptionService";
import { Subscription, SubscriptionFrequency } from "../lib/models/types";

type SubscriptionsContextType = {
  subscriptions: Subscription[];
  loadingSubscriptions: boolean;
  getSubscription: (id: string) => Promise<Subscription | null>;
  addSubscription: (subscription: Omit<
    Subscription,
    "id" | "created_at" | "updated_at" | "is_deleted" | "sync_status" | "last_synced_at"
  >) => Promise<Subscription>;
  updateSubscription: (
    id: string,
    subscription: Partial<
      Omit<
        Subscription,
        "id" | "created_at" | "updated_at" | "is_deleted" | "sync_status" | "last_synced_at"
      >
    >
  ) => Promise<Subscription>;
  removeSubscription: (id: string) => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  calculateNextPaymentDate: (frequency: SubscriptionFrequency, fromDate?: Date) => number;
  getUpcomingSubscriptions: (daysAhead?: number) => Promise<Subscription[]>;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(
  undefined
);

export const SubscriptionsProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const refreshSubscriptions = useCallback(async () => {
    try {
      setLoadingSubscriptions(true);
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  const getSubscription = useCallback(async (id: string) => {
    return getSubscriptionById(id);
  }, []);

  const addSubscription = useCallback(async (data: Omit<Subscription, "id" | "created_at" | "updated_at" | "is_deleted" | "sync_status" | "last_synced_at">) => {
    const newSubscription = await createSubscription(data);
    await refreshSubscriptions();
    return newSubscription;
  }, [refreshSubscriptions]);

  const modifySubscription = useCallback(async (id: string, data: Partial<Omit<Subscription, "id" | "created_at" | "updated_at" | "is_deleted" | "sync_status" | "last_synced_at">>) => {
    const updatedSubscription = await updateSubscription(id, data);
    await refreshSubscriptions();
    return updatedSubscription;
  }, [refreshSubscriptions]);

  const removeSubscription = useCallback(async (id: string) => {
    await deleteSubscription(id);
    await refreshSubscriptions();
  }, [refreshSubscriptions]);

  const value = {
    subscriptions,
    loadingSubscriptions,
    getSubscription,
    addSubscription,
    updateSubscription: modifySubscription,
    removeSubscription,
    refreshSubscriptions,
    calculateNextPaymentDate,
    getUpcomingSubscriptions,
  };

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionsContext);
  if (context === undefined) {
    throw new Error("useSubscriptions must be used within a SubscriptionsProvider");
  }
  return context;
};
