import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 0 && name.trim()) {
      setStep(1);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await completeOnboarding(name.trim(), currency);
      router.replace("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <Animated.View
              entering={FadeIn.duration(500)}
              style={styles.stepContainer}
            >
              {/* Logo/Icon */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={styles.logoContainer}
              >
                <View style={styles.logoCircle}>
                  <Text style={styles.logoEmoji}>💰</Text>
                </View>
              </Animated.View>

              {/* Welcome Text */}
              <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                style={styles.textContainer}
              >
                <Text style={styles.title}>Bienvenido a FinanzIA</Text>
                <Text style={styles.subtitle}>
                  Tu asistente inteligente para administrar tus finanzas personales
                </Text>
              </Animated.View>

              {/* Name Input */}
              <Animated.View
                entering={FadeInUp.delay(600).duration(600)}
                style={styles.inputContainer}
              >
                <Text style={styles.label}>¿Cómo te llamas?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                />
              </Animated.View>

              {/* Next Button */}
              <Animated.View
                entering={FadeInUp.delay(800).duration(600)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !name.trim() && styles.buttonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!name.trim()}
                >
                  <Text style={styles.primaryButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View
              entering={SlideInRight.duration(400)}
              style={styles.stepContainerCurrency}
            >
              {/* Header */}
              <View style={styles.stepHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(0)}
                >
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {/* Greeting */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={styles.greetingContainer}
              >
                <Text style={styles.greeting}>Hola, {name} 👋</Text>
                <Text style={styles.greetingSubtitle}>
                  Selecciona tu moneda principal
                </Text>
              </Animated.View>

              {/* Currency Grid */}
              <View style={styles.currencyGrid}>
                {CURRENCIES.map((curr, index) => (
                  <Animated.View
                    key={curr.code}
                    entering={FadeInUp.delay(300 + index * 50).duration(400)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.currencyCard,
                        currency === curr.code && styles.currencyCardSelected,
                      ]}
                      onPress={() => setCurrency(curr.code)}
                    >
                      <Text style={styles.currencyFlag}>{curr.flag}</Text>
                      <Text
                        style={[
                          styles.currencyCode,
                          currency === curr.code && styles.currencyCodeSelected,
                        ]}
                      >
                        {curr.code}
                      </Text>
                      <Text
                        style={[
                          styles.currencyName,
                          currency === curr.code && styles.currencyNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {curr.name}
                      </Text>
                      {currency === curr.code && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {/* Complete Button */}
              <Animated.View
                entering={FadeInUp.delay(700).duration(600)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={handleComplete}
                  disabled={isSubmitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? "Configurando..." : "Comenzar"}
                  </Text>
                  <Ionicons name="rocket" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
  },
  stepContainerCurrency: {
    flex: 1,
    paddingTop: 16,
  },
  stepHeader: {
    flexDirection: "row",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#7952FC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 56,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  buttonContainer: {
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#7952FC",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  greetingContainer: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  currencyCard: {
    width: (width - 48 - 24) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  currencyCardSelected: {
    borderColor: "#7952FC",
    backgroundColor: "#F3F0FF",
  },
  currencyFlag: {
    fontSize: 28,
    marginBottom: 8,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  currencyCodeSelected: {
    color: "#7952FC",
  },
  currencyName: {
    fontSize: 12,
    color: "#6B7280",
  },
  currencyNameSelected: {
    color: "#7952FC",
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7952FC",
    alignItems: "center",
    justifyContent: "center",
  },
});
