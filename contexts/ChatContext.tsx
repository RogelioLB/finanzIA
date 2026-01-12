import { API_CONFIG } from "@/constants/Config";
import { parseMessageMetadata, removeMarkers } from "@/lib/chat/messageParser";
import { ChatMessage } from "@/lib/database/sqliteService";
import { useSQLiteContext } from "expo-sqlite";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import uuid from "react-native-uuid";
import { useCreditCards } from "./CreditCardsContext";
import { useObjectives } from "./ObjectivesContext";
import { useTransactions } from "./TransactionsContext";
import { useWallets } from "./WalletsContext";

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const db = useSQLiteContext();
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { objectives } = useObjectives();
  const { creditCards } = useCreditCards();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGeneratedGreeting, setHasGeneratedGreeting] = useState(false);

  // Cargar historial de mensajes al iniciar
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Cargar mensajes existentes de la BD
        const history = await db.getAllAsync<ChatMessage>("SELECT * FROM chat_messages ORDER BY timestamp ASC");
        setMessages(history);

        // Si no hay historial, generar saludo (ya no hay mínimo)
        if (history.length === 0 && !hasGeneratedGreeting) {
          await generateGreeting();
          setHasGeneratedGreeting(true);
        }
      } catch (err) {
        console.error("[ChatContext] Error loading history:", err);
      }
    };

    // Solo inicializar una vez
    if (!hasGeneratedGreeting && transactions.length > 0) {
      initializeChat();
    }
  }, [transactions.length]);

  /**
   * Genera un saludo automático de la IA
   */
  const generateGreeting = async () => {
    try {
      const greetingPrompt = `Saluda brevemente al usuario (máximo 2-3 oraciones). Menciona:
1. Un dato interesante de su situación financiera actual
2. Su próximo pago importante (si hay alguno en los próximos 7 días)
3. Una pregunta para iniciar la conversación

Sé amigable, conversacional y específico. Usa datos reales del usuario.`;

      const response = await sendMessage(greetingPrompt, true);
      return response;
    } catch (err) {
      console.error("[ChatContext] Error generating greeting:", err);
    }
  };

  /**
   * Envía un mensaje a la API y recibe respuesta streaming
   */
  const sendMessage = async (content: string, isGreeting: boolean = false): Promise<void> => {
    if (!content.trim() && !isGreeting) return;
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      // 1. Crear y guardar mensaje del usuario (solo si no es saludo automático)
      if (!isGreeting) {
        const userMessage: ChatMessage = {
          id: uuid.v4() as string,
          role: "user",
          content: content.trim(),
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        await saveChatMessageToDB(userMessage);
      }

      // 2. Preparar request a la API
      const apiMessages = messages
        .filter((m) => !isGreeting) // Excluir mensaje del usuario si es saludo automático
        .map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

      if (!isGreeting) {
        apiMessages.push({
          role: "user",
          content: content.trim(),
        });
      } else {
        // Para saludo, pasar una instrucción especial
        apiMessages.push({
          role: "system",
          content,
        });
      }

      // 3. Hacer request con streaming
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.CHAT_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          financialContext: {
            transactions,
            wallets,
            objectives,
            creditCards,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en la respuesta de la API");
      }

      // 4. Procesar streaming - Leer el texto completo
      const text = await response.text();

      let assistantMessage: ChatMessage = {
        id: uuid.v4() as string,
        role: "assistant",
        content: text,
        timestamp: Date.now(),
        isStreaming: true,
      };

      // Simular streaming mostrando el contenido completo
      setMessages((prev) => [...prev, assistantMessage]);

      // Para dar efecto de "streaming", procesamos gradualmente si el texto es muy largo
      if (text.length > 500) {
        // Actualizar en chunks para dar sensación de streaming
        const chunkSize = Math.ceil(text.length / 10);
        for (let i = chunkSize; i <= text.length; i += chunkSize) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          assistantMessage.content = text.substring(0, i);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMessage,
              isStreaming: true,
            };
            return updated;
          });
        }
      }

      // Mostrar contenido completo
      assistantMessage.content = text;

      // 5. Parsear metadata y finalizar mensaje
      assistantMessage.isStreaming = false;
      assistantMessage.metadata = parseMessageMetadata(assistantMessage.content);

      // Debug: Log si se encontraron gráficos/tablas
      if (assistantMessage.metadata?.charts?.length) {
        console.log("[ChatContext] Found charts:", assistantMessage.metadata.charts.length);
      }
      if (assistantMessage.metadata?.tables?.length) {
        console.log("[ChatContext] Found tables:", assistantMessage.metadata.tables.length);
      }
      if (assistantMessage.metadata?.actionButtons?.length) {
        console.log("[ChatContext] Found actions:", assistantMessage.metadata.actionButtons.length);
      }

      assistantMessage.content = removeMarkers(assistantMessage.content);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = assistantMessage;
        return updated;
      });

      // 6. Guardar en BD
      await saveChatMessageToDB(assistantMessage);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido en el chat";
      console.error("[ChatContext] Error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Guarda un mensaje en la base de datos
   */
  const saveChatMessageToDB = async (message: ChatMessage): Promise<void> => {
    try {
      await (db as any).runAsync(
        `INSERT INTO chat_messages (id, role, content, timestamp, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.role,
          message.content,
          message.timestamp,
          message.metadata ? JSON.stringify(message.metadata) : null,
          Date.now(),
        ]
      );
    } catch (err) {
      console.error("[ChatContext] Error saving message:", err);
      // No lanzar error, solo loguear
    }
  };

  /**
   * Limpia el historial de chat
   */
  const clearHistory = async (): Promise<void> => {
    try {
      await (db as any).runAsync("DELETE FROM chat_messages");
      setMessages([]);
      setError(null);
      setHasGeneratedGreeting(false);
    } catch (err) {
      console.error("[ChatContext] Error clearing history:", err);
      setError("Error al limpiar el historial");
    }
  };

  const value: ChatContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
