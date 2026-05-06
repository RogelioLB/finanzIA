import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { Subscription } from "../lib/models/types";
import {
  cancelAllSubscriptionNotifications,
  cancelSubscriptionNotification,
  listScheduledNotifications,
  scheduleSubscriptionNotification,
  sendTestNotification,
  setupNotifications,
  simulateSubscriptionNotification,
  syncNotificationQueue,
  addToNotificationQueue,
  removeFromNotificationQueue,
  isNotificationScheduled,
  needsReschedule,
} from "../lib/services/notificationService";
import { useSubscriptions } from "./SubscriptionsContext";

type NotificationsContextType = {
  permissionsGranted: boolean;
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (subscription: Subscription) => Promise<string | null>;
  cancelNotification: (subscriptionId: string) => Promise<boolean>;
  cancelAllNotifications: () => Promise<boolean>;
  sendTestNotification: () => Promise<string | null>;
  simulateSubscriptionNotification: (name: string, amount: number) => Promise<string | null>;
  listScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);
  const { subscriptions } = useSubscriptions();
  const isSchedulingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      const granted = await setupNotifications();
      setPermissionsGranted(granted);
      await syncNotificationQueue();

      const receivedSub = Notifications.addNotificationReceivedListener(async (notification) => {
        console.log("¡Notificación recibida!", notification);
      });

      const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
        console.log("¡Usuario interactuó con notificación!", response);
      });

      return () => {
        receivedSub.remove();
        responseSub.remove();
      };
    };

    initNotifications();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const recheck = async () => {
          console.log("[Notifications] App foregrounded - rechecking permissions and sync");
          const granted = await setupNotifications();
          setPermissionsGranted(granted);
          await syncNotificationQueue();
        };
        recheck();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Ref para leer subscriptions sin incluirlas en las deps del useCallback
  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  const scheduleAllNotifications = useCallback(async () => {
    const subs = subscriptionsRef.current;
    if (!permissionsGranted || subs.length === 0 || isSchedulingRef.current) {
      return;
    }

    isSchedulingRef.current = true;
    console.log("Verificando notificaciones para suscripciones...");

    try {
      await syncNotificationQueue();

      const startOfTomorrow = new Date();
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);

      const subsWithNotifications = subs.filter(
        s => s.allow_notifications && s.next_payment_date >= startOfTomorrow.getTime()
      );
      let scheduledCount = 0;
      let skippedCount = 0;

      for (const subscription of subsWithNotifications) {
        const shouldSchedule = await needsReschedule(subscription.id, subscription.next_payment_date);

        if (shouldSchedule) {
          await cancelSubscriptionNotification(subscription.id);
          await removeFromNotificationQueue(subscription.id);
          const notificationId = await scheduleSubscriptionNotification(subscription);

          if (notificationId) {
            await addToNotificationQueue(subscription.id, notificationId, subscription.next_payment_date);
            scheduledCount++;
          }
        } else {
          skippedCount++;
        }
      }

      const subsWithoutNotifications = subs.filter(s => !s.allow_notifications);
      for (const subscription of subsWithoutNotifications) {
        const wasScheduled = await isNotificationScheduled(subscription.id);
        if (wasScheduled) {
          await cancelSubscriptionNotification(subscription.id);
          await removeFromNotificationQueue(subscription.id);
        }
      }

      console.log(`Notificaciones: ${scheduledCount} programadas, ${skippedCount} ya existentes`);
    } catch (error) {
      console.error("Error programando notificaciones:", error);
    } finally {
      isSchedulingRef.current = false;
    }
  }, [permissionsGranted]); // estable — subscriptions se lee del ref

  useEffect(() => {
    scheduleAllNotifications();
  }, [scheduleAllNotifications, subscriptions.length]); // subscriptions.length es un número, no una referencia

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await setupNotifications();
    setPermissionsGranted(granted);
    return granted;
  };

  const value: NotificationsContextType = {
    permissionsGranted,
    requestPermissions,
    scheduleNotification: scheduleSubscriptionNotification,
    cancelNotification: cancelSubscriptionNotification,
    cancelAllNotifications: cancelAllSubscriptionNotifications,
    sendTestNotification,
    simulateSubscriptionNotification,
    listScheduledNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};