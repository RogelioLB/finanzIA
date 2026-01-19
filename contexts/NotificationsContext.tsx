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
import { Subscription } from "../lib/models/types";
import {
  cancelAllSubscriptionNotifications,
  cancelSubscriptionNotification,
  listScheduledNotifications,
  rescheduleForNextPayment,
  scheduleSubscriptionNotification,
  sendTestNotification,
  setupNotifications,
  simulateSubscriptionNotification,
} from "../lib/services/notificationService";
import {
  addToNotificationQueue,
  clearNotificationQueue,
  getNotificationQueue,
  isNotificationScheduled,
  needsReschedule,
  removeFromNotificationQueue,
  syncNotificationQueue,
} from "../lib/services/notificationQueueService";
import { useSubscriptions } from "./SubscriptionsContext";

type NotificationsContextType = {
  permissionsGranted: boolean;
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (subscription: Subscription) => Promise<string | null>;
  cancelNotification: (subscriptionId: string) => Promise<boolean>;
  cancelAllNotifications: () => Promise<boolean>;
  // Funciones de testing (solo en __DEV__)
  sendTestNotification: () => Promise<string | null>;
  simulateSubscriptionNotification: (name: string, amount: number) => Promise<string | null>;
  listScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);
  const { subscriptions } = useSubscriptions();

  // Usar refs para evitar re-renders innecesarios
  const subscriptionsRef = useRef<Subscription[]>([]);
  const hasScheduledRef = useRef(false);
  const isSchedulingRef = useRef(false);

  // Inicializar el sistema de notificaciones
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await setupNotifications();
      setPermissionsGranted(granted);

      // Configurar listener para cuando se recibe una notificación
      const subscription = Notifications.addNotificationReceivedListener(
        async (notification) => {
          console.log("¡Notificación recibida!", notification);

          // Comprobar si es una notificación de suscripción
          const subscriptionId =
            notification.request.content.data?.subscriptionId;
          if (subscriptionId && typeof subscriptionId === "string") {
            console.log(
              "Notificación de suscripción recibida. ID:",
              subscriptionId
            );

            // Reprogramar para el siguiente período de pago
            await rescheduleForNextPayment(subscriptionId);
          }
        }
      );

      // Configurar listener para cuando se interactúa con una notificación
      const responseSubscription =
        Notifications.addNotificationResponseReceivedListener(
          async (response) => {
            console.log("¡Usuario interactuó con notificación!", response);

            // Comprobar si es una notificación de suscripción
            const subscriptionId =
              response.notification.request.content.data?.subscriptionId;
            if (subscriptionId && typeof subscriptionId === "string") {
              console.log(
                "Interacción con notificación de suscripción. ID:",
                subscriptionId
              );

              // Reprogramar para el siguiente período de pago
              await rescheduleForNextPayment(subscriptionId);

              // Aquí se podría agregar navegación a la pantalla de suscripción
              console.log("Navegar a suscripción:", subscriptionId);
            }
          }
        );

      // Limpiar listeners al desmontar
      return () => {
        subscription.remove();
        responseSubscription.remove();
      };
    };

    initNotifications();
  }, []);

  // Función para programar notificaciones (memoizada) - usa sistema de colas
  const scheduleAllNotifications = useCallback(async () => {
    if (!permissionsGranted || subscriptions.length === 0 || isSchedulingRef.current) {
      return;
    }

    isSchedulingRef.current = true;
    console.log("Verificando notificaciones para suscripciones...");

    try {
      // Sincronizar cola con notificaciones realmente programadas
      await syncNotificationQueue();

      const subsWithNotifications = subscriptions.filter(s => s.allow_notifications);
      let scheduledCount = 0;
      let skippedCount = 0;

      for (const subscription of subsWithNotifications) {
        // Verificar si necesita reprogramar (fecha de pago cambió o no está programada)
        const shouldSchedule = await needsReschedule(
          subscription.id,
          subscription.next_payment_date
        );

        if (shouldSchedule) {
          // Cancelar notificación anterior si existe
          await cancelSubscriptionNotification(subscription.id);
          await removeFromNotificationQueue(subscription.id);

          // Programar nueva notificación
          const notificationId = await scheduleSubscriptionNotification(subscription);

          if (notificationId) {
            await addToNotificationQueue(
              subscription.id,
              notificationId,
              subscription.next_payment_date
            );
            scheduledCount++;
          }
        } else {
          skippedCount++;
        }
      }

      // Limpiar notificaciones de suscripciones que ya no tienen notificaciones habilitadas
      const subsWithoutNotifications = subscriptions.filter(s => !s.allow_notifications);
      for (const subscription of subsWithoutNotifications) {
        const wasScheduled = await isNotificationScheduled(subscription.id, 0);
        if (wasScheduled) {
          await cancelSubscriptionNotification(subscription.id);
          await removeFromNotificationQueue(subscription.id);
        }
      }

      console.log(`Notificaciones: ${scheduledCount} programadas, ${skippedCount} ya existentes`);
      subscriptionsRef.current = subscriptions;
      hasScheduledRef.current = true;
    } catch (error) {
      console.error("Error programando notificaciones:", error);
    } finally {
      isSchedulingRef.current = false;
    }
  }, [permissionsGranted, subscriptions]);

  // Programar notificaciones solo cuando sea necesario
  useEffect(() => {
    scheduleAllNotifications();
  }, [scheduleAllNotifications]);

  // Solicitar permisos de notificaciones
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
    // Funciones de testing
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
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};
