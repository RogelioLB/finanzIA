import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";

export type AccountKind = "wallet" | "credit" | "debt" | "invest";

interface AddAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: AccountKind) => void;
}

const TYPES: { id: AccountKind; label: string; sub: string; icon: keyof typeof DesignIcon }[] = [
  {
    id: "wallet",
    label: "Cuenta o Wallet",
    sub: "Débito, efectivo, billetera digital",
    icon: "Wallet",
  },
  {
    id: "credit",
    label: "Tarjeta de crédito",
    sub: "Línea revolvente con corte y pago",
    icon: "Card",
  },
  {
    id: "debt",
    label: "Deuda",
    sub: "Préstamo, MSI, deuda manual",
    icon: "Debt",
  },
  {
    id: "invest",
    label: "Inversión",
    sub: "CETES, ETF, cripto",
    icon: "Stocks",
  },
];

export default function AddAccountSheet({
  visible,
  onClose,
  onPick,
}: AddAccountSheetProps) {
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
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Agregar</Text>
            <Text style={[styles.subtitle, { color: theme.textSec }]}>
              ¿Qué quieres agregar?
            </Text>
          </View>
          <View style={styles.list}>
            {TYPES.map((t) => {
              const I = (DesignIcon as any)[t.icon] || DesignIcon.Bank;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => onPick(t.id)}
                  style={[
                    styles.row,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: theme.surfaceAlt },
                    ]}
                  >
                    <I size={18} color={theme.text} strokeWidth={1.6} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>
                      {t.label}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textTer }]}>
                      {t.sub}
                    </Text>
                  </View>
                  <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={1.7} />
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
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: 28,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 6 },
  title: { fontSize: 20, fontWeight: "600", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 16 },
  list: { paddingHorizontal: 16, gap: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSub: { fontSize: 11, marginTop: 2 },
});
