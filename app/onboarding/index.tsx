import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/theme/ThemeProvider";
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
  const { theme, accent } = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <Animated.View
              entering={FadeIn.duration(500)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={{ alignItems: "center", marginBottom: 32 }}
              >
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: accent,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Text style={{ fontSize: 56 }}>💰</Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                style={{ alignItems: "center", marginBottom: 40 }}
              >
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "800",
                    color: theme.text,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Bienvenido a FinanzIA
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.textSec,
                    textAlign: "center",
                    lineHeight: 24,
                    paddingHorizontal: 20,
                  }}
                >
                  Tu asistente inteligente para administrar tus finanzas personales
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(600).duration(600)}
                style={{ marginBottom: 32 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.textSec,
                    marginBottom: 12,
                  }}
                >
                  ¿Cómo te llamas?
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    padding: 20,
                    fontSize: 18,
                    color: theme.text,
                    borderWidth: 2,
                    borderColor: theme.border,
                  }}
                  placeholder="Tu nombre"
                  placeholderTextColor={theme.textTer}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                />
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(800).duration(600)}
                style={{ marginTop: 16 }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    backgroundColor: accent,
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                    opacity: !name.trim() ? 0.5 : 1,
                  }}
                  onPress={handleNext}
                  disabled={!name.trim()}
                >
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
                    Continuar
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View
              entering={SlideInRight.duration(400)}
              style={{ flex: 1, paddingTop: 16 }}
            >
              <View style={{ flexDirection: "row", marginBottom: 24 }}>
                <TouchableOpacity
                  style={{ padding: 8, marginLeft: -8 }}
                  onPress={() => setStep(0)}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={{ marginBottom: 32 }}
              >
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    color: theme.text,
                    marginBottom: 8,
                  }}
                >
                  Hola, {name} 👋
                </Text>
                <Text style={{ fontSize: 16, color: theme.textSec }}>
                  Selecciona tu moneda principal
                </Text>
              </Animated.View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {CURRENCIES.map((curr, index) => (
                  <Animated.View
                    key={curr.code}
                    entering={FadeInUp.delay(300 + index * 50).duration(400)}
                  >
                    <TouchableOpacity
                      style={{
                        width: (width - 48 - 24) / 2,
                        backgroundColor: theme.surface,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 2,
                        borderColor:
                          currency === curr.code ? accent : theme.border,
                        position: "relative",
                      }}
                      onPress={() => setCurrency(curr.code)}
                    >
                      <Text style={{ fontSize: 28, marginBottom: 8 }}>
                        {curr.flag}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: theme.text,
                          marginBottom: 4,
                        }}
                      >
                        {curr.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.textSec,
                        }}
                        numberOfLines={1}
                      >
                        {curr.name}
                      </Text>
                      {currency === curr.code && (
                        <View
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: accent,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              <Animated.View
                entering={FadeInUp.delay(700).duration(600)}
                style={{ marginTop: 16 }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    backgroundColor: accent,
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                  onPress={handleComplete}
                  disabled={isSubmitting}
                >
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
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
