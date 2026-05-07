import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { getFabContrast } from "@/theme/tokens";

interface FormShellProps {
  title: string;
  subtitle?: string;
  saveLabel?: string;
  canSave?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}

export default function FormShell({
  title,
  subtitle,
  saveLabel = "Guardar",
  canSave = true,
  isSubmitting = false,
  onClose,
  onSave,
  children,
}: FormShellProps) {
  const { theme, accent } = useTheme();
  const disabled = !canSave || isSubmitting;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.headerBtn, { backgroundColor: theme.surfaceAlt }]}
              hitSlop={8}
            >
              <DesignIcon.Close size={16} color={theme.text} strokeWidth={1.7} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.headerSub, { color: theme.textTer }]}>{subtitle}</Text>
              )}
            </View>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.divider }]}>
            <TouchableOpacity
              disabled={disabled}
              onPress={onSave}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: disabled ? theme.surfaceAlt : accent,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.saveText,
                  { color: disabled ? theme.textTer : getFabContrast(accent) },
                ]}
              >
                {isSubmitting ? "Guardando..." : saveLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "600", letterSpacing: -0.4 },
  headerSub: { fontSize: 11, marginTop: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
});
