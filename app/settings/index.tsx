import { useCategories } from "@/contexts/CategoriesContext";
import { useObjectives } from "@/contexts/ObjectivesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { useWallets } from "@/contexts/WalletsContext";
import { triggerSuccess } from "@/hooks/useHaptics";
import {
  categoriesToCSV,
  exportDatabase,
  exportToCSV,
  generateFilename,
  objectivesToCSV,
  transactionsToCSV,
  walletsToCSV,
} from "@/utils/export";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENCIES = [
  { code: "MXN", symbol: "$", name: "Peso Mexicano", flag: "🇲🇽" },
  { code: "USD", symbol: "$", name: "Dólar Estadounidense", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "COP", symbol: "$", name: "Peso Colombiano", flag: "🇨🇴" },
  { code: "ARS", symbol: "$", name: "Peso Argentino", flag: "🇦🇷" },
  { code: "CLP", symbol: "$", name: "Peso Chileno", flag: "🇨🇱" },
  { code: "PEN", symbol: "S/", name: "Sol Peruano", flag: "🇵🇪" },
  { code: "BRL", symbol: "R$", name: "Real Brasileño", flag: "🇧🇷" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { userName, defaultCurrency, updateSettings } = useUser();
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { objectives } = useObjectives();
  const [name, setName] = useState(userName || "");
  const [currency, setCurrency] = useState(defaultCurrency || "MXN");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);

  const handleExportTransactions = async () => {
    if (transactions.length === 0) {
      Alert.alert("Sin datos", "No hay transacciones para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const csv = transactionsToCSV(transactions);
      const filename = generateFilename("transacciones_finanzia");
      const success = await exportToCSV(csv, filename);
      
      if (success) {
        triggerSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar las transacciones");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWallets = async () => {
    if (wallets.length === 0) {
      Alert.alert("Sin datos", "No hay wallets para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const csv = walletsToCSV(wallets);
      const filename = generateFilename("wallets_finanzia");
      const success = await exportToCSV(csv, filename);
      
      if (success) {
        triggerSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar las wallets");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCategories = async () => {
    if (categories.length === 0) {
      Alert.alert("Sin datos", "No hay categorías para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const csv = categoriesToCSV(categories);
      const filename = generateFilename("categorias_finanzia");
      const success = await exportToCSV(csv, filename);

      if (success) {
        triggerSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar las categorías");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportObjectives = async () => {
    if (objectives.length === 0) {
      Alert.alert("Sin datos", "No hay objetivos para exportar");
      return;
    }

    setIsExporting(true);
    try {
      const csv = objectivesToCSV(objectives);
      const filename = generateFilename("objetivos_finanzia");
      const success = await exportToCSV(csv, filename);

      if (success) {
        triggerSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar los objetivos");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const success = await exportDatabase();
      if (success) {
        triggerSuccess();
      } else {
        Alert.alert("Error", "No se pudo encontrar el archivo de base de datos");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar la base de datos");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({ user_name: name.trim(), default_currency: currency });
      Alert.alert("Guardado", "Tus ajustes han sido actualizados");
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los ajustes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Perfil */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perfil</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Tu nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Moneda */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Moneda</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            >
              <View style={styles.currencySelector}>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyFlag}>{selectedCurrency?.flag}</Text>
                  <View>
                    <Text style={styles.currencyCode}>{selectedCurrency?.code}</Text>
                    <Text style={styles.currencyName}>{selectedCurrency?.name}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#6B7280"
                />
              </View>
            </TouchableOpacity>

            {showCurrencyPicker && (
              <View style={styles.currencyList}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyOption,
                      currency === curr.code && styles.currencyOptionSelected,
                    ]}
                    onPress={() => {
                      setCurrency(curr.code);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    <Text style={styles.currencyOptionFlag}>{curr.flag}</Text>
                    <View style={styles.currencyOptionInfo}>
                      <Text
                        style={[
                          styles.currencyOptionCode,
                          currency === curr.code && styles.currencyOptionCodeSelected,
                        ]}
                      >
                        {curr.code}
                      </Text>
                      <Text style={styles.currencyOptionName}>{curr.name}</Text>
                    </View>
                    {currency === curr.code && (
                      <Ionicons name="checkmark-circle" size={24} color="#7952FC" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Guardar */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>

          {/* Exportar Datos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exportar Datos</Text>
            <View style={styles.card}>
              <Text style={styles.exportDescription}>
                Exporta tus datos financieros en formato CSV para usarlos en Excel u otras aplicaciones.
              </Text>
              
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportTransactions}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#7952FC" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#7952FC" />
                )}
                <Text style={styles.exportButtonText}>
                  Exportar Transacciones ({transactions.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportWallets}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#7952FC" />
                ) : (
                  <Ionicons name="wallet-outline" size={20} color="#7952FC" />
                )}
                <Text style={styles.exportButtonText}>
                  Exportar Wallets ({wallets.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportCategories}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#7952FC" />
                ) : (
                  <Ionicons name="list-outline" size={20} color="#7952FC" />
                )}
                <Text style={styles.exportButtonText}>
                  Exportar Categorías ({categories.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportObjectives}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#7952FC" />
                ) : (
                  <Ionicons name="flag-outline" size={20} color="#7952FC" />
                )}
                <Text style={styles.exportButtonText}>
                  Exportar Objetivos ({objectives.length})
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportDatabase}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#7952FC" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={20} color="#7952FC" />
                )}
                <Text style={styles.exportButtonText}>
                  Copia de Seguridad (Base de Datos)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencyFlag: {
    fontSize: 32,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  currencyName: {
    fontSize: 14,
    color: "#6B7280",
  },
  currencyList: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  currencyOptionSelected: {
    backgroundColor: "#F3F0FF",
  },
  currencyOptionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyOptionInfo: {
    flex: 1,
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  currencyOptionCodeSelected: {
    color: "#7952FC",
  },
  currencyOptionName: {
    fontSize: 13,
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#7952FC",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  exportDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8E0FF",
    borderRadius: 12,
    backgroundColor: "#F8F5FF",
    marginBottom: 12,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7952FC",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
});
