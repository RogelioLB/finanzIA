import { useSQLiteContext } from "expo-sqlite";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UserSettings {
  id: string;
  user_name: string | null;
  default_currency: string;
  onboarding_completed: number;
  created_at: number;
  updated_at: number;
}

export interface WidgetSetting {
  id: string;
  widget_type: string;
  is_enabled: number;
  position: number;
}

interface UserContextType {
  settings: UserSettings | null;
  widgets: WidgetSetting[];
  isLoading: boolean;
  isOnboardingComplete: boolean;
  userName: string;
  defaultCurrency: string;
  refreshSettings: () => Promise<void>;
  updateSettings: (params: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: (name: string, currency: string) => Promise<void>;
  updateWidgets: (widgets: WidgetSetting[]) => Promise<void>;
  toggleWidget: (widgetType: string, enabled: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [widgets, setWidgets] = useState<WidgetSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Obtener configuración del usuario
      const userSettings = await db.getFirstAsync<UserSettings>(
        "SELECT * FROM user_settings WHERE id = 'main'"
      );
      setSettings(userSettings || null);

      // Obtener configuración de widgets
      const widgetSettings = await db.getAllAsync<WidgetSetting>(
        "SELECT * FROM widget_settings ORDER BY position ASC"
      );
      setWidgets(widgetSettings);
    } catch (error) {
      console.error("Error loading user settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const updateSettings = useCallback(
    async (params: Partial<UserSettings>) => {
      try {
        const updates: string[] = [];
        const values: any[] = [];

        if (params.user_name !== undefined) {
          updates.push("user_name = ?");
          values.push(params.user_name);
        }
        if (params.default_currency !== undefined) {
          updates.push("default_currency = ?");
          values.push(params.default_currency);
        }
        if (params.onboarding_completed !== undefined) {
          updates.push("onboarding_completed = ?");
          values.push(params.onboarding_completed);
        }

        updates.push("updated_at = ?");
        values.push(Date.now());
        values.push("main");

        await db.runAsync(
          `UPDATE user_settings SET ${updates.join(", ")} WHERE id = ?`,
          values
        );

        await refreshSettings();
      } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
      }
    },
    [db, refreshSettings]
  );

  const completeOnboarding = useCallback(
    async (name: string, currency: string) => {
      try {
        await db.runAsync(
          `UPDATE user_settings SET user_name = ?, default_currency = ?, onboarding_completed = 1, updated_at = ? WHERE id = 'main'`,
          [name, currency, Date.now()]
        );

        // Update the default "Bank" wallet with the selected currency
        await db.runAsync(
          `UPDATE wallets SET currency = ?, updated_at = ? WHERE name = 'Bank'`,
          [currency, Date.now()]
        );

        await refreshSettings();
      } catch (error) {
        console.error("Error completing onboarding:", error);
        throw error;
      }
    },
    [db, refreshSettings]
  );

  const updateWidgets = useCallback(
    async (newWidgets: WidgetSetting[]) => {
      try {
        for (let i = 0; i < newWidgets.length; i++) {
          const widget = newWidgets[i];
          await db.runAsync(
            `UPDATE widget_settings SET position = ?, is_enabled = ?, updated_at = ? WHERE id = ?`,
            [i, widget.is_enabled, Date.now(), widget.id]
          );
        }
        // Update local state directly without triggering isLoading
        const widgetSettings = await db.getAllAsync<WidgetSetting>(
          "SELECT * FROM widget_settings ORDER BY position ASC"
        );
        setWidgets(widgetSettings);
      } catch (error) {
        console.error("Error updating widgets:", error);
        throw error;
      }
    },
    [db]
  );

  const toggleWidget = useCallback(
    async (widgetType: string, enabled: boolean) => {
      try {
        await db.runAsync(
          `UPDATE widget_settings SET is_enabled = ?, updated_at = ? WHERE widget_type = ?`,
          [enabled ? 1 : 0, Date.now(), widgetType]
        );
        // Update local state directly without triggering isLoading
        const widgetSettings = await db.getAllAsync<WidgetSetting>(
          "SELECT * FROM widget_settings ORDER BY position ASC"
        );
        setWidgets(widgetSettings);
      } catch (error) {
        console.error("Error toggling widget:", error);
        throw error;
      }
    },
    [db]
  );

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const isOnboardingComplete = settings?.onboarding_completed === 1;
  const userName = settings?.user_name || "";
  const defaultCurrency = settings?.default_currency || "MXN";

  const value: UserContextType = {
    settings,
    widgets,
    isLoading,
    isOnboardingComplete,
    userName,
    defaultCurrency,
    refreshSettings,
    updateSettings,
    completeOnboarding,
    updateWidgets,
    toggleWidget,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
