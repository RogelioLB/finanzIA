import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChatMessage as ChatMessageType } from "@/lib/database/sqliteService";
import ChatChart from "./ChatChart";
import ChatTable from "./ChatTable";
import ActionButton from "./ActionButton";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";

  const hasCharts = useMemo(() => {
    return message.metadata?.charts && message.metadata.charts.length > 0;
  }, [message.metadata]);

  const hasTables = useMemo(() => {
    return message.metadata?.tables && message.metadata.tables.length > 0;
  }, [message.metadata]);

  const hasActions = useMemo(() => {
    return message.metadata?.actionButtons && message.metadata.actionButtons.length > 0;
  }, [message.metadata]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {/* Texto del mensaje */}
        {message.content && (
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {message.content}
          </Text>
        )}

        {/* Indicador de streaming */}
        {message.isStreaming && (
          <Text style={[styles.messageText, styles.streamingIndicator]}>▌</Text>
        )}
      </View>

      {/* Gráficos embebidos */}
      {hasCharts &&
        message.metadata?.charts?.map((chart, chartIndex) => (
          <ChatChart
            key={`chart-${chartIndex}`}
            type={chart.type}
            title={chart.title}
            data={chart.data}
          />
        ))}

      {/* Tablas embebidas */}
      {hasTables &&
        message.metadata?.tables?.map((table, tableIndex) => (
          <ChatTable
            key={`table-${tableIndex}`}
            headers={table.headers}
            rows={table.rows}
          />
        ))}

      {/* Botones de acción */}
      {hasActions &&
        message.metadata?.actionButtons?.map((action, actionIndex) => (
          <ActionButton
            key={`action-${actionIndex}`}
            type={action.type}
            data={action.data}
            label={action.label}
          />
        ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  assistantContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#7952FC",
  },
  assistantBubble: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#1F2937",
  },
  streamingIndicator: {
    fontSize: 16,
    color: "#7952FC",
    marginTop: 4,
  },
});
