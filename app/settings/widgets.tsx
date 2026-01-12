import { useUser, WidgetSetting } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const WIDGET_INFO: Record<string, { name: string; description: string; icon: string; color: string }> = {
  accounts: {
    name: "Cuentas",
    description: "Muestra tus wallets y balances",
    icon: "wallet-outline",
    color: "#2196F3",
  },
  balance: {
    name: "Balance Total",
    description: "Resumen de ingresos y gastos",
    icon: "stats-chart-outline",
    color: "#4CAF50",
  },
  quick_actions: {
    name: "Acciones Rápidas",
    description: "Botones de acceso rápido",
    icon: "flash-outline",
    color: "#FF9800",
  },
  credit_cards: {
    name: "Tarjetas de Crédito",
    description: "Saldos y disponible de tarjetas",
    icon: "card-outline",
    color: "#9C27B0",
  },
  objectives: {
    name: "Objetivos",
    description: "Metas de ahorro y deudas",
    icon: "flag-outline",
    color: "#E91E63",
  },
  transactions: {
    name: "Transacciones",
    description: "Últimos movimientos",
    icon: "list-outline",
    color: "#607D8B",
  },
};

export default function WidgetsSettingsScreen() {
  const router = useRouter();
  const { widgets, toggleWidget, updateWidgets } = useUser();
  const [localWidgets, setLocalWidgets] = useState<WidgetSetting[]>([]);

  useEffect(() => {
    setLocalWidgets([...widgets].sort((a, b) => a.position - b.position));
  }, [widgets]);

  const handleToggle = async (widgetType: string, enabled: boolean) => {
    // Update local state immediately for responsive UI
    setLocalWidgets((prev) =>
      prev.map((w) =>
        w.widget_type === widgetType ? { ...w, is_enabled: enabled ? 1 : 0 } : w
      )
    );
    // Persist to database
    await toggleWidget(widgetType, enabled);
  };

  const moveWidget = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localWidgets.length) return;

    const newWidgets = [...localWidgets];
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];

    // Update positions
    newWidgets.forEach((w, i) => {
      w.position = i;
    });

    setLocalWidgets(newWidgets);
    await updateWidgets(newWidgets);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Widgets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Activa o desactiva widgets y reorganiza el orden en que aparecen en la pantalla de inicio.
        </Text>

        <View style={styles.widgetList}>
          {localWidgets.map((widget, index) => {
            const info = WIDGET_INFO[widget.widget_type];
            if (!info) return null;

            return (
              <Animated.View
                key={widget.id}
                entering={FadeInDown.delay(index * 50)}
                style={styles.widgetCard}
              >
                <View style={styles.widgetMain}>
                  <View style={[styles.widgetIcon, { backgroundColor: `${info.color}15` }]}>
                    <Ionicons name={info.icon as any} size={24} color={info.color} />
                  </View>
                  <View style={styles.widgetInfo}>
                    <Text style={styles.widgetName}>{info.name}</Text>
                    <Text style={styles.widgetDescription}>{info.description}</Text>
                  </View>
                  <Switch
                    value={widget.is_enabled === 1}
                    onValueChange={(value) => handleToggle(widget.widget_type, value)}
                    trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
                    thumbColor={widget.is_enabled === 1 ? "#7952FC" : "#9CA3AF"}
                  />
                </View>

                {widget.is_enabled === 1 && (
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        index === 0 && styles.reorderButtonDisabled,
                      ]}
                      onPress={() => moveWidget(index, "up")}
                      disabled={index === 0}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={index === 0 ? "#D1D5DB" : "#6B7280"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.positionText}>Posición {index + 1}</Text>
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        index === localWidgets.length - 1 && styles.reorderButtonDisabled,
                      ]}
                      onPress={() => moveWidget(index, "down")}
                      disabled={index === localWidgets.length - 1}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={index === localWidgets.length - 1 ? "#D1D5DB" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={24} color="#7952FC" />
          <Text style={styles.tipText}>
            Los widgets desactivados no aparecerán en tu pantalla de inicio. Puedes reactivarlos en cualquier momento.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  widgetList: {
    gap: 12,
  },
  widgetCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  widgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  widgetDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  reorderButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 16,
  },
  reorderButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButtonDisabled: {
    backgroundColor: "#F9FAFB",
  },
  positionText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F3F0FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#5B21B6",
    lineHeight: 20,
  },
});
