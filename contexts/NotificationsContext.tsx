import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Subscription } from "../lib/models/types";
import {
  cancelAllSubscriptionNotifications,
  cancelSubscriptionNotification,
  rescheduleForNextPayment,
  scheduleSubscriptionNotification,
  setupNotifications,
} from "../lib/services/notificationService";
import { useSubscriptions } from "./SubscriptionsContext";

type NotificationsContextType = {
  permissionsGranted: boolean;
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (subscription: Subscription) => Promise<string | null>;
  cancelNotification: (subscriptionId: string) => Promise<boolean>;
  cancelAllNotifications: () => Promise<boolean>;
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

  // Programar notificaciones para todas las suscripciones existentes con notificaciones habilitadas
  useEffect(() => {
    const scheduleAllNotifications = async () => {
      console.log("permissionsGranted", permissionsGranted);

      if (permissionsGranted && subscriptions.length > 0) {
        console.log(
          "Programando notificaciones para suscripciones existentes..."
        );

        // Cancelar todas las notificaciones existentes primero
        await cancelAllSubscriptionNotifications();

        // Programar nuevas notificaciones para suscripciones con notificaciones habilitadas
        for (const subscription of subscriptions) {
          if (subscription.allow_notifications) {
            await scheduleSubscriptionNotification(subscription);
          }
        }
      }
    };

    scheduleAllNotifications();
  }, [permissionsGranted, subscriptions]);

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
