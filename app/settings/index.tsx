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
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";

const CURRENCIES = [
  { code: "MXN", symbol: "$", name: "Peso Mexicano", flag: "🇲🇽" },
  { code: "USD", symbol: "$", name: "Dólar Estadounidense", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
];

export default function SettingsScreen() {
  const { theme, accent, density } = useTheme();
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

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

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
      if (success) triggerSuccess();
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
      if (success) triggerSuccess();
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
      if (success) triggerSuccess();
    } catch (error) {
      Alert.alert("Error", "No se pudieron exportar las categorías");
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
      if (success) triggerSuccess();
    } catch (error) {
      Alert.alert("Error", "No se pudieron exportar los objetivos");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const success = await exportDatabase();
      if (success) triggerSuccess();
      else Alert.alert("Error", "No se pudo encontrar el archivo de base de datos");
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ajustes</Text>
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
          contentContainerStyle={{ padding: pad, paddingBottom: 40 }}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Perfil</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.textTer }]}>Tu nombre</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                placeholder="Ingresa tu nombre"
                placeholderTextColor={theme.textTer}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Moneda</Text>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            >
              <View style={styles.currencySelector}>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyFlag}>{selectedCurrency?.flag}</Text>
                  <View>
                    <Text style={[styles.currencyCode, { color: theme.text }]}>{selectedCurrency?.code}</Text>
                    <Text style={[styles.currencyName, { color: theme.textSec }]}>{selectedCurrency?.name}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textTer}
                />
              </View>
            </TouchableOpacity>

            {showCurrencyPicker && (
              <View style={[styles.currencyList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyOption,
                      currency === curr.code && [styles.currencyOptionSelected, { backgroundColor: `${accent}12` }],
                      { borderBottomColor: theme.border }
                    ]}
                    onPress={() => {
                      setCurrency(curr.code);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    <Text style={styles.currencyFlag}>{curr.flag}</Text>
                    <View style={styles.currencyOptionInfo}>
                      <Text
                        style={[
                          styles.currencyOptionCode,
                          { color: theme.text },
                          currency === curr.code && { color: accent },
                        ]}
                      >
                        {curr.code}
                      </Text>
                      <Text style={[styles.currencyOptionName, { color: theme.textSec }]}>{curr.name}</Text>
                    </View>
                    {currency === curr.code && (
                      <DesignIcon.Check size={18} color={accent} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accent }, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: "#fff" }]}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Inteligencia Artificial</Text>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/settings/ai')}
            >
              <View style={styles.currencySelector}>
                <View style={styles.currencyInfo}>
                  <Ionicons name="sparkles" size={22} color={accent} />
                  <View>
                    <Text style={[styles.currencyCode, { color: theme.text }]}>Configuración de IA</Text>
                    <Text style={[styles.currencyName, { color: theme.textSec }]}>API keys para Whisper y Chat</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTer} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Exportar Datos</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.exportDescription, { color: theme.textSec }]}>
                Exporta tus datos financieros en formato CSV para usarlos en Excel u otras aplicaciones.
              </Text>

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.border }, isExporting && { opacity: 0.6 }]}
                onPress={handleExportTransactions}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <Ionicons name="download-outline" size={18} color={accent} />
                )}
                <Text style={[styles.exportButtonText, { color: accent }]}>
                  Exportar Transacciones ({transactions.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.border }, isExporting && { opacity: 0.6 }]}
                onPress={handleExportWallets}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <DesignIcon.Wallet size={18} color={accent} strokeWidth={1.6} />
                )}
                <Text style={[styles.exportButtonText, { color: accent }]}>
                  Exportar Wallets ({wallets.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.border }, isExporting && { opacity: 0.6 }]}
                onPress={handleExportCategories}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <DesignIcon.List size={18} color={accent} strokeWidth={1.6} />
                )}
                <Text style={[styles.exportButtonText, { color: accent }]}>
                  Exportar Categorías ({categories.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.border }, isExporting && { opacity: 0.6 }]}
                onPress={handleExportObjectives}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <DesignIcon.Envelope size={18} color={accent} strokeWidth={1.6} />
                )}
                <Text style={[styles.exportButtonText, { color: accent }]}>
                  Exportar Objetivos ({objectives.length})
                </Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={[styles.exportButton, { borderColor: theme.border }, isExporting && { opacity: 0.6 }]}
                onPress={handleExportDatabase}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color={accent} />
                )}
                <Text style={[styles.exportButtonText, { color: accent }]}>
                  Copia de Seguridad (Base de Datos)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  content: { flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  label: { fontSize: 12, marginBottom: 8 },
  input: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currencyInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  currencyFlag: { fontSize: 28 },
  currencyCode: { fontSize: 16, fontWeight: "600" },
  currencyName: { fontSize: 13, marginTop: 2 },
  currencyList: { marginTop: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  currencyOptionSelected: {},
  currencyOptionInfo: { flex: 1 },
  currencyOptionCode: { fontSize: 14, fontWeight: "600" },
  currencyOptionName: { fontSize: 12, marginTop: 2 },
  saveButton: { borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 24 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 15, fontWeight: "600" },
  exportDescription: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  exportButtonDisabled: { opacity: 0.6 },
  exportButtonText: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, marginVertical: 8 },
});