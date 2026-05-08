import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { testTranscriptionApiKey } from "@/lib/services/voice/transcriptionService";
import { testLLMApiKey } from "@/lib/services/voice/transactionParserService";

const AI_CONFIG_KEY = 'ai_config';

interface AIConfig {
  openaiApiKey: string;
  anthropicApiKey: string;
  preferredModel: string;
  alphaVantageApiKey: string;
}

const MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Rápido)', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o (Más capaz)', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Rápido)', provider: 'Anthropic' },
];

export default function SettingsAIScreen() {
  const { theme, accent } = useTheme();
  const router = useRouter();
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [alphaVantageKey, setAlphaVantageKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('gpt-4o-mini');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(AI_CONFIG_KEY);
      if (stored) {
        const config: AIConfig = JSON.parse(stored);
        setOpenaiKey(config.openaiApiKey || '');
        setAnthropicKey(config.anthropicApiKey || '');
        setAlphaVantageKey(config.alphaVantageApiKey || '');
        setPreferredModel(config.preferredModel || 'gpt-4o-mini');
      }
    } catch (error) {
      console.error('[SettingsAI] Failed to load config:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const config: AIConfig = {
        openaiApiKey: openaiKey.trim(),
        anthropicApiKey: anthropicKey.trim(),
        alphaVantageApiKey: alphaVantageKey.trim(),
        preferredModel,
      };
      await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
      Alert.alert('Guardado', 'La configuración de IA ha sido guardada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const apiKey = openaiKey.trim() || anthropicKey.trim();
      if (!apiKey) {
        setTestResult({ success: false, message: 'Ingresa una API key de OpenAI o Anthropic' });
        setIsTesting(false);
        return;
      }

      const keyToTest = openaiKey.trim() ? openaiKey.trim() : anthropicKey.trim();
      const success = await testLLMApiKey(keyToTest);
      
      if (success) {
        setTestResult({ success: true, message: '¡Conexión exitosa! La API key es válida.' });
      } else {
        setTestResult({ success: false, message: 'Error de conexión. Verifica tu API key.' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error al probar la conexión.' });
    } finally {
      setIsTesting(false);
    }
  };

  const selectedModelData = MODELS.find(m => m.id === preferredModel);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Configuración de IA</Text>
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
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={accent} />
            <Text style={[styles.infoText, { color: theme.textSec }]}>
              Las API keys se almacenan localmente en tu dispositivo y nunca se envían a nuestros servidores.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>OpenAI API Key</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="sk-..."
              placeholderTextColor={theme.textTer}
              value={openaiKey}
              onChangeText={setOpenaiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Anthropic API Key (Opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="sk-ant-..."
              placeholderTextColor={theme.textTer}
              value={anthropicKey}
              onChangeText={setAnthropicKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Alpha Vantage API Key (Opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Tu API key de Alpha Vantage"
              placeholderTextColor={theme.textTer}
              value={alphaVantageKey}
              onChangeText={setAlphaVantageKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helperText, { color: theme.textTer }]}>
              Necesaria para precios de acciones en tiempo real. Obtén una gratis en alphavantage.co
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Modelo Preferido</Text>
            <TouchableOpacity
              style={[styles.modelSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowModelPicker(!showModelPicker)}
            >
              <View style={styles.modelInfo}>
                <Text style={[styles.modelName, { color: theme.text }]}>
                  {selectedModelData?.name || 'Seleccionar modelo'}
                </Text>
                <Text style={[styles.modelProvider, { color: theme.textTer }]}>
                  {selectedModelData?.provider || ''}
                </Text>
              </View>
              <Ionicons
                name={showModelPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textTer}
              />
            </TouchableOpacity>

            {showModelPicker && (
              <View style={[styles.modelList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelOption,
                      preferredModel === model.id && { backgroundColor: `${accent}12` },
                    ]}
                    onPress={() => {
                      setPreferredModel(model.id);
                      setShowModelPicker(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.modelOptionName, { color: theme.text }]}>{model.name}</Text>
                      <Text style={[styles.modelOptionProvider, { color: theme.textTer }]}>{model.provider}</Text>
                    </View>
                    {preferredModel === model.id && (
                      <DesignIcon.Check size={18} color={accent} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {testResult && (
            <View style={[
              styles.testResult,
              { backgroundColor: testResult.success ? `${theme.good}15` : `${theme.bad}15` }
            ]}>
              <Ionicons
                name={testResult.success ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={testResult.success ? theme.good : theme.bad}
              />
              <Text style={[styles.testResultText, { color: testResult.success ? theme.good : theme.bad }]}>
                {testResult.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.testButton, { borderColor: accent }]}
            onPress={testConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name="wifi" size={18} color={accent} />
            )}
            <Text style={[styles.testButtonText, { color: accent }]}>
              {isTesting ? "Probando..." : "Probar Conexión"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accent }, isSaving && { opacity: 0.6 }]}
            onPress={saveConfig}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: "#fff" }]}>
              {isSaving ? "Guardando..." : "Guardar Configuración"}
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Acerca de Voice Transaction</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardText, { color: theme.textSec }]}>
                Voice Transaction te permite grabar notas de voz para crear transacciones automáticamente.
                La grabación se transcribe usando Whisper API y se parsea con el modelo de IA que configures.
              </Text>
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(121, 82, 252, 0.08)",
    marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  input: {
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  helperText: { fontSize: 12, marginTop: 8 },
  modelSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modelInfo: {},
  modelName: { fontSize: 15, fontWeight: "500" },
  modelProvider: { fontSize: 12, marginTop: 2 },
  modelList: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  modelOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  modelOptionName: { fontSize: 14, fontWeight: "500" },
  modelOptionProvider: { fontSize: 12, marginTop: 2 },
  testResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  testResultText: { flex: 1, fontSize: 13 },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  testButtonText: { fontSize: 14, fontWeight: "600" },
  saveButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  saveButtonText: { fontSize: 15, fontWeight: "600" },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardText: { fontSize: 13, lineHeight: 18 },
});