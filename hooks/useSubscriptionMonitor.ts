import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { registerBackgroundTask } from "../lib/services/backgroundTaskService";
import { executeSubscriptionTasks } from "../lib/services/subscriptionProcessor";

/**
 * Hook para monitorear y procesar suscripciones automáticamente
 * Ejecuta verificaciones cuando:
 * - La app se inicia
 * - La app vuelve del background
 * - Periódicamente cada hora mientras la app está activa
 */
export const useSubscriptionMonitor = () => {
  const db = useSQLiteContext();
  const appState = useRef(AppState.currentState);
  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si han pasado al menos 30 minutos desde la última verificación
  const shouldCheck = (): boolean => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return now - lastCheckRef.current >= thirtyMinutes;
  };

  // Ejecutar verificación de suscripciones
  const checkSubscriptions = async () => {
    if (!shouldCheck()) {
      console.log("Verificación de suscripciones omitida (muy reciente)");
      return;
    }

    console.log("Ejecutando verificación de suscripciones...");
    lastCheckRef.current = Date.now();

    try {
      await executeSubscriptionTasks(db);
    } catch (error) {
      console.error("Error en verificación de suscripciones:", error);
    }
  };

  useEffect(() => {
    // Ejecutar verificación inicial al montar
    checkSubscriptions();

    // Registrar tarea en segundo plano
    registerBackgroundTask().catch((error) => {
      console.error("Error registrando tarea en segundo plano:", error);
    });

    // Configurar intervalo para verificación periódica cada hora
    intervalRef.current = setInterval(() => {
      if (AppState.currentState === "active") {
        checkSubscriptions();
      }
    }, 60 * 60 * 1000); // Cada hora

    // Listener para cambios de estado de la app
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        // Si la app vuelve a foreground desde background
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App volvió a foreground, verificando suscripciones...");
          checkSubscriptions();
        }
        appState.current = nextAppState;
      }
    );

    // Limpiar al desmontar
    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    checkSubscriptions,
  };
};
