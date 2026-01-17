import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import TransitionLayout from "@/components/ui/TransitionLayout";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { useChatContext } from "@/contexts/ChatContext";
import { useTransactions } from "@/contexts/TransactionsContext";

export default function AiPlanScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isLoading, sendMessage, clearHistory, error } = useChatContext();
  const { transactions } = useTransactions();
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const flatListRef = useRef<FlatList>(null);

  // Monitorear conexión a internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !isConnected) return;

    const message = inputText.trim();
    setInputText("");

    try {
      await sendMessage(message);
    } catch (err) {
      console.error("[AiPlanScreen] Error sending message:", err);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "¿Limpiar historial?",
      "Esto eliminará todos tus mensajes del chat. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Limpiar",
          onPress: async () => {
            await clearHistory();
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="chatbubbles" size={24} color="#7952FC" />
              </View>
              <View>
                <Text style={styles.title}>Chat Financiero IA</Text>
                <Text style={styles.subtitle}>Tu asistente personal</Text>
              </View>
            </View>

            {messages.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Messages */}
          {messages.length === 0 && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="chatbubble-ellipses" size={48} color="#DDD6FE" />
              <Text style={styles.emptyStateTitle}>
                Bienvenido al Chat Financiero
              </Text>
              <Text style={styles.emptyStateText}>
                Soy tu asistente IA personal. Puedo ayudarte con:
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#7952FC" />
                  <Text style={styles.featureText}>Analizar tus gastos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#7952FC" />
                  <Text style={styles.featureText}>
                    Crear planes de pago
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#7952FC" />
                  <Text style={styles.featureText}>
                    Responder preguntas específicas
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#7952FC" />
                  <Text style={styles.featureText}>
                    Sugerir objetivos
                  </Text>
                </View>
              </View>
              <Text style={styles.startPrompt}>
                ¿Cómo puedo ayudarte?
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item, index }) => (
                <ChatMessage message={item} index={index} />
              )}
              keyExtractor={(item) => item.id}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoading ? <TypingIndicator /> : <View style={{ height: 16 }} />
              }
              scrollEnabled
              scrollEventThrottle={16}
            />
          )}

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Offline indicator */}
          {!isConnected && (
            <View style={styles.offlineContainer}>
              <Ionicons name="cloud-offline" size={16} color="#92400E" />
              <Text style={styles.offlineText}>Estás desconectado. Revisa tu conexión a internet.</Text>
            </View>
          )}

          {/* Input */}
          <ChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            isLoading={isLoading}
            isDisabled={!isConnected}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  featuresList: {
    marginTop: 24,
    width: "100%",
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#6B40DC",
    fontWeight: "500",
  },
  startPrompt: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: "600",
    color: "#7952FC",
  },
  addTransactionButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#7952FC",
    borderRadius: 10,
  },
  addTransactionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
  },
  offlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
  },
});
