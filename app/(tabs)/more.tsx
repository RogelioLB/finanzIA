import TransitionLayout from "@/components/ui/TransitionLayout";
import { useCategories } from "@/contexts/CategoriesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { initDatabase } from "@/lib/database/initDatabase";
import { Ionicons } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MoreScreen() {
  const router = useRouter();
  const { refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();
  const { refreshCategories } = useCategories();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = () => {
    Alert.alert(
      "⚠️ Reiniciar Base de Datos",
      "Esta acción eliminará TODOS tus datos de forma permanente:\n\n• Todas las transacciones\n• Todas las cuentas\n• Todas las categorías\n• Todos los presupuestos\n• Todos los objetivos\n• Todas las suscripciones\n\n¿Estás seguro de que deseas continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, eliminar todo",
          style: "destructive",
          onPress: confirmReset,
        },
      ]
    );
  };

  const confirmReset = () => {
    Alert.alert(
      "🚨 Última Confirmación",
      "Esta es tu última oportunidad para cancelar.\n\nTodos tus datos serán eliminados de forma PERMANENTE y NO se pueden recuperar.\n\n¿Realmente deseas continuar?",
      [
        {
          text: "No, cancelar",
          style: "cancel",
        },
        {
          text: "Sí, estoy seguro",
          style: "destructive",
          onPress: resetDatabase,
        },
      ]
    );
  };

  const resetDatabase = async () => {
    setIsResetting(true);
    try {
      // Abrir la base de datos
      const db = await SQLite.openDatabaseAsync("financeapp.db");
      
      // Eliminar todas las tablas
      await db.execAsync(`
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS wallets;
        DROP TABLE IF EXISTS categories;
        DROP TABLE IF EXISTS budgets;
        DROP TABLE IF EXISTS category_budget_limits;
        DROP TABLE IF EXISTS objectives;
        DROP TABLE IF EXISTS database_version;
      `);

        await db.execAsync(`PRAGMA user_version = ${0}`);

      // Reinicializar la base de datos con las tablas vacías
      await initDatabase(db);

      Alert.alert(
        "✅ Base de Datos Reiniciada",
        "Todos los datos han sido eliminados exitosamente y la base de datos ha sido reinicializada.",
        [
          {
            text: "OK",
            onPress: async ()=>{
              await reloadAppAsync()
            }
          },
        ]
      );
    } catch (error) {
      console.error("Error resetting database:", error);
      Alert.alert(
        "❌ Error",
        "No se pudo reiniciar la base de datos. Por favor, intenta de nuevo.\n\nError: " + 
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <TransitionLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={32} color="#7952FC" />
          </View>
          <Text style={styles.title}>Más Opciones</Text>
          <Text style={styles.subtitle}>Configuración y herramientas</Text>
        </View>

        {/* Herramientas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Herramientas</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/objectives")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="flag-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.toolTitle}>Objetivos</Text>
              <Text style={styles.toolSubtitle}>Metas y deudas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/wallets")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="wallet-outline" size={24} color="#2196F3" />
              </View>
              <Text style={styles.toolTitle}>Cuentas</Text>
              <Text style={styles.toolSubtitle}>Gestionar wallets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/subscriptions")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="repeat-outline" size={24} color="#FF9800" />
              </View>
              <Text style={styles.toolTitle}>Suscripciones</Text>
              <Text style={styles.toolSubtitle}>Pagos recurrentes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/wallets/transfer")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="swap-horizontal-outline" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.toolTitle}>Transferir</Text>
              <Text style={styles.toolSubtitle}>Entre cuentas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/credit-cards")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="card-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.toolTitle}>Tarjetas</Text>
              <Text style={styles.toolSubtitle}>Crédito y débito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/categories")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#F0F9FF" }]}>
                <Ionicons name="pricetags-outline" size={24} color="#0EA5E9" />
              </View>
              <Text style={styles.toolTitle}>Categorías</Text>
              <Text style={styles.toolSubtitle}>Crear y editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/settings")}
            >
              <View style={[styles.toolIcon, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="settings-outline" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.toolTitle}>Ajustes</Text>
              <Text style={styles.toolSubtitle}>Configuración</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Base de Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗄️ Base de Datos</Text>
          <Text style={styles.sectionDescription}>
            Administra los datos de la aplicación
          </Text>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              isResetting && styles.dangerButtonDisabled,
            ]}
            onPress={handleResetDatabase}
            disabled={isResetting}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonLeft}>
                <View style={styles.iconContainer}>
                  {isResetting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                  )}
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>
                    {isResetting ? "Reiniciando..." : "Reiniciar Base de Datos"}
                  </Text>
                  <Text style={styles.buttonSubtitle}>
                    Elimina todos los datos permanentemente
                  </Text>
                </View>
              </View>
              {!isResetting && (
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#FFA500" />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Advertencia</Text>
              <Text style={styles.warningText}>
                Esta acción es irreversible. Todos tus datos serán eliminados
                permanentemente y no se pueden recuperar.
              </Text>
            </View>
          </View>
        </View>

        {/* Información de la App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versión</Text>
              <Text style={styles.infoValue}>1.0.2</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base de Datos</Text>
              <Text style={styles.infoValue}>SQLite</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Framework</Text>
              <Text style={styles.infoValue}>React Native + Expo</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B45309",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  toolCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
});
