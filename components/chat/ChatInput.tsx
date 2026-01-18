import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  isDisabled = false,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !isLoading && !isDisabled;

  return (
    <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Pregúntame sobre tus finanzas..."
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
            editable={!isLoading && !isDisabled}
            scrollEnabled
            maxHeight={100}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLoading ? "hourglass" : "send"}
            size={20}
            color={canSend ? "#7952FC" : "#D1D5DB"}
          />
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    maxHeight: 100,
    justifyContent: "center",
  },
  input: {
    fontSize: 14,
    color: "#1F2937",
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
