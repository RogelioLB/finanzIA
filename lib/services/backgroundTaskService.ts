import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as SQLite from "expo-sqlite";
import { executeSubscriptionTasks } from "./subscriptionProcessor";

// Nombre de la tarea en segundo plano
const SUBSCRIPTION_TASK_NAME = "subscription-background-task";

/**
 * Define la tarea que se ejecutará en segundo plano
 * Esta tarea procesa suscripciones y envía notificaciones
 */
TaskManager.defineTask(SUBSCRIPTION_TASK_NAME, async () => {
  try {
    console.log("[Background Task] Ejecutando tarea de suscripciones...");

    // Abrir conexión a la base de datos
    const db = await SQLite.openDatabaseAsync("financeapp.db");

    // Ejecutar tareas de suscripción
    await executeSubscriptionTasks(db);

    console.log("[Background Task] Tarea completada exitosamente");
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background Task] Error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registra la tarea en segundo plano
 * Se ejecutará automáticamente incluso cuando la app esté cerrada
 */
export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    // Verificar si la tarea ya está registrada
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      SUBSCRIPTION_TASK_NAME
    );

    if (isRegistered) {
      console.log("[Background Task] Ya está registrada");
      return true;
    }

    // Registrar la tarea con un intervalo mínimo de 15 minutos
    // El sistema operativo decide cuándo ejecutarla basándose en este intervalo
    await BackgroundFetch.registerTaskAsync(SUBSCRIPTION_TASK_NAME, {
      minimumInterval: 60 * 60 * 12, // 12 horas (recomendado para tareas diarias)
      stopOnTerminate: false, // Continuar después de cerrar la app
      startOnBoot: true, // Iniciar cuando el dispositivo se reinicia
    });

    console.log("[Background Task] Registrada exitosamente");
    return true;
  } catch (error) {
    console.error("[Background Task] Error al registrar:", error);
    return false;
  }
};

/**
 * Cancela la tarea en segundo plano
 */
export const unregisterBackgroundTask = async (): Promise<boolean> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(SUBSCRIPTION_TASK_NAME);
    console.log("[Background Task] Desregistrada exitosamente");
    return true;
  } catch (error) {
    console.error("[Background Task] Error al desregistrar:", error);
    return false;
  }
};

/**
 * Verifica si la tarea está registrada
 */
export const isBackgroundTaskRegistered = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(SUBSCRIPTION_TASK_NAME);
  } catch (error) {
    console.error("[Background Task] Error al verificar registro:", error);
    return false;
  }
};

/**
 * Obtiene el estado de la tarea
 */
export const getBackgroundTaskStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const statusNames = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: "Restringido",
      [BackgroundFetch.BackgroundFetchStatus.Denied]: "Denegado",
      [BackgroundFetch.BackgroundFetchStatus.Available]: "Disponible",
    };

    console.log(
      `[Background Task] Estado: ${statusNames[status] || "Desconocido"}`
    );
    return status;
  } catch (error) {
    console.error("[Background Task] Error al obtener estado:", error);
    return null;
  }
};
