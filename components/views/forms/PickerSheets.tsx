import React, { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";

export interface PickerOption {
  id: string;
  label: string;
  sub?: string;
  color?: string;
  icon?: ReactNode;
}

interface ListPickerSheetProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function ListPickerSheet({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: ListPickerSheetProps) {
  const { theme, accent } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
            {options.map((o) => {
              const sel = o.id === value;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => onPick(o.id)}
                  style={[
                    styles.row,
                    { backgroundColor: sel ? theme.surfaceAlt : "transparent" },
                  ]}
                  activeOpacity={0.7}
                >
                  {o.color ? (
                    <View
                      style={[styles.colorDot, { backgroundColor: o.color }]}
                    />
                  ) : null}
                  {o.icon}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>
                      {o.label}
                    </Text>
                    {o.sub ? (
                      <Text style={[styles.rowSub, { color: theme.textTer }]}>
                        {o.sub}
                      </Text>
                    ) : null}
                  </View>
                  {sel ? (
                    <DesignIcon.Check size={16} color={accent} strokeWidth={2.5} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface IconPickerSheetProps {
  visible: boolean;
  icons: { name: string; component: React.ComponentType<any> }[];
  value: string;
  color: string;
  onPick: (name: string) => void;
  onClose: () => void;
}

export function IconPickerSheet({
  visible,
  icons,
  value,
  color,
  onPick,
  onClose,
}: IconPickerSheetProps) {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <Text style={[styles.title, { color: theme.text }]}>Icono</Text>
          <View style={styles.iconGrid}>
            {icons.map(({ name, component: I }) => {
              const sel = value === name;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => onPick(name)}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: sel ? `${color}22` : theme.surface,
                      borderColor: sel ? color : theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <I size={22} color={sel ? color : theme.text} strokeWidth={1.6} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: 28,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  scroll: { paddingHorizontal: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSub: { fontSize: 11, marginTop: 2 },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  iconCell: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
