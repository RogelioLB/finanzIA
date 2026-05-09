import { Toast } from "@/components/ui/Toast";
import { DesignIcon } from "@/components/ui/Icon";
import FormShell from "@/components/views/forms/FormShell";
import {
  ColorSwatches,
  FormGroup,
  PickerRow,
  SegmentedField,
  TextField,
} from "@/components/views/forms/FormFields";
import {
  IconPickerSheet,
  ListPickerSheet,
} from "@/components/views/forms/PickerSheets";
import {
  BANKS,
  COLOR_OPTIONS,
  CURRENCIES,
  ICON_OPTIONS,
} from "@/components/views/forms/constants";
import { useWallets } from "@/contexts/WalletsContext";
import { useSQLiteService } from "@/lib/database/sqliteService";
import { useTheme } from "@/theme/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WalletKind = "debit" | "cash" | "wallet";
type PickerKey = "icon" | "currency" | "bank" | null;

const ICON_NAME_TO_EMOJI: Record<string, string> = {
  Bank: "🏦",
  Card: "💳",
  Cash: "💰",
  Wallet: "👛",
  PiggyBank: "🐷",
  Stocks: "📈",
  Crypto: "🪙",
  Bag: "🛍️",
  Bolt: "⚡",
  Home2: "🏠",
  Phone: "📱",
  Education: "🎓",
};

const EMOJI_TO_ICON_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_NAME_TO_EMOJI).map(([k, v]) => [v, k])
);

export default function EditWalletScreen() {
  const router = useRouter();
  const { theme, accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWalletById, updateWallet, deleteWallet, refreshWallets } = useWallets();
  const { createTransaction } = useSQLiteService();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<WalletKind>("debit");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [balance, setBalance] = useState("");
  const [originalBalance, setOriginalBalance] = useState(0);
  const [currency, setCurrency] = useState("MXN");
  const [iconName, setIconName] = useState("Bank");
  const [color, setColor] = useState("#0A84FF");
  const [pickerOpen, setPickerOpen] = useState<PickerKey>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const wallet = getWalletById(id);
    if (wallet) {
      setName(wallet.name);
      const bal = wallet.net_balance ?? 0;
      setBalance(bal.toString());
      setOriginalBalance(bal);
      setCurrency(wallet.currency || "MXN");
      setColor(wallet.color || "#0A84FF");
      setIconName(EMOJI_TO_ICON_NAME[wallet.icon || ""] || "Bank");
      setBank((wallet as any).bank || "");
      setLast4((wallet as any).last_four_digits || "");

      const hasBank = !!(wallet as any).bank;
      const hasLast4 = !!(wallet as any).last_four_digits;
      if (!hasBank) setKind("cash");
      else if (hasLast4) setKind("debit");
      else setKind("wallet");
    }
    setIsLoading(false);
  }, [id]);

  const cur = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0],
    [currency]
  );

  const Ico = (DesignIcon as any)[iconName] || DesignIcon.Bank;

  const canSave = name.trim().length > 0 && !isSubmitting;

  const iconOptions = useMemo(
    () =>
      ICON_OPTIONS.map((n) => ({
        name: n,
        component: (DesignIcon as any)[n],
      })).filter((i) => !!i.component),
    []
  );

  const currencyOptions = CURRENCIES.map((c) => ({
    id: c.code,
    label: `${c.flag}  ${c.code}`,
    sub: c.label,
  }));

  const bankOptions = BANKS.map((b) => ({ id: b, label: b }));

  const handleDelete = () => {
    Alert.alert(
      "Eliminar cuenta",
      `¿Eliminar "${name}"? Se borrarán también todas sus transacciones. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(id!);
              await refreshWallets();
              Toast.success("Cuenta eliminada", "La cuenta y sus transacciones fueron eliminadas.");
              router.back();
            } catch {
              Toast.error("Error", "No se pudo eliminar la cuenta.");
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!canSave || !id) return;
    setIsSubmitting(true);
    try {
      const newBalance = balance ? parseFloat(balance) : 0;
      const balanceNum = isNaN(newBalance) ? 0 : newBalance;
      const diff = balanceNum - originalBalance;

      await updateWallet(id, {
        name: name.trim(),
        icon: ICON_NAME_TO_EMOJI[iconName] || "🏦",
        color,
        currency,
        bank: kind !== "cash" ? bank || undefined : undefined,
        last_four_digits: kind === "debit" ? last4 || undefined : undefined,
      });

      if (diff !== 0) {
        await createTransaction({
          wallet_id: id,
          amount: Math.abs(diff),
          type: diff > 0 ? "income" : "expense",
          title: "Ajuste de balance",
          note: `Ajuste de ${originalBalance} a ${balanceNum}`,
          timestamp: Date.now(),
        });
      }

      await refreshWallets();
      Toast.success("¡Cuenta actualizada!", "Los cambios se guardaron correctamente.");
      router.back();
    } catch {
      Toast.error("Error", "No se pudo actualizar la cuenta. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: theme.bg }]} edges={["top"]}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={[styles.loadingText, { color: theme.textSec }]}>Cargando cuenta...</Text>
      </SafeAreaView>
    );
  }

  const balanceNum = parseFloat(balance) || 0;
  const diff = balanceNum - originalBalance;

  return (
    <>
      <FormShell
        title="Editar cuenta"
        subtitle="Modifica los datos de tu cuenta"
        saveLabel="Guardar cambios"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
        onDelete={handleDelete}
      >
        {/* Live preview */}
        <View
          style={[
            styles.preview,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[styles.previewIcon, { backgroundColor: `${color}22` }]}>
            <Ico size={20} color={color} strokeWidth={1.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewName, { color: theme.text }]}>
              {name || "Nombre de la cuenta"}
            </Text>
            <Text style={[styles.previewSub, { color: theme.textTer }]}>
              {bank || "—"}
              {last4 ? ` · •••• ${last4}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={[
                styles.previewAmount,
                { color: theme.text, fontVariant: ["tabular-nums"] },
              ]}
            >
              {cur.symbol}
              {balance || "0"}
            </Text>
            <Text style={[styles.previewCurrency, { color: theme.textTer }]}>
              {currency}
            </Text>
          </View>
        </View>

        {diff !== 0 && !isNaN(diff) && (
          <View style={[styles.adjustBanner, { backgroundColor: `${accent}15`, borderColor: `${accent}30` }]}>
            <DesignIcon.Alert size={15} color={accent} strokeWidth={1.7} />
            <Text style={[styles.adjustText, { color: accent }]}>
              Se creará un ajuste de {diff > 0 ? "ingreso" : "gasto"} por{" "}
              {cur.symbol}{Math.abs(diff).toFixed(2)}
            </Text>
          </View>
        )}

        <SegmentedField
          label="Tipo de cuenta"
          value={kind}
          onChange={(v) => setKind(v as WalletKind)}
          options={[
            { id: "debit", label: "Débito" },
            { id: "cash", label: "Efectivo" },
            { id: "wallet", label: "Wallet" },
          ]}
        />

        <FormGroup>
          <TextField
            label="Nombre"
            placeholder="Ej. BBVA Nómina"
            value={name}
            onChange={setName}
          />
        </FormGroup>

        {kind !== "cash" && (
          <FormGroup>
            <PickerRow
              label="Banco / Emisor"
              value={bank || "Seleccionar"}
              onPress={() => setPickerOpen("bank")}
            />
            {kind === "debit" && (
              <TextField
                label="Últimos 4 dígitos"
                placeholder="1234"
                maxLength={4}
                keyboardType="number-pad"
                value={last4}
                onChange={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
                mono
              />
            )}
          </FormGroup>
        )}

        <FormGroup label="Saldo y divisa">
          <TextField
            placeholder="0.00"
            value={balance}
            onChange={(v) => setBalance(v.replace(/[^0-9.]/g, ""))}
            prefix={cur.symbol}
            suffix={currency}
            keyboardType="decimal-pad"
            mono
          />
          <PickerRow
            label="Divisa"
            value={`${cur.flag} ${cur.code}`}
            onPress={() => setPickerOpen("currency")}
          />
        </FormGroup>

        <FormGroup label="Apariencia">
          <PickerRow
            label="Icono"
            value={iconName}
            icon={<Ico size={18} color={color} strokeWidth={1.7} />}
            onPress={() => setPickerOpen("icon")}
          />
          <ColorSwatches
            colors={COLOR_OPTIONS}
            selected={color}
            onSelect={setColor}
          />
        </FormGroup>
      </FormShell>

      <ListPickerSheet
        visible={pickerOpen === "currency"}
        title="Divisa"
        options={currencyOptions}
        value={currency}
        onPick={(v) => {
          setCurrency(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      <ListPickerSheet
        visible={pickerOpen === "bank"}
        title="Banco"
        options={bankOptions}
        value={bank}
        onPick={(v) => {
          setBank(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      <IconPickerSheet
        visible={pickerOpen === "icon"}
        icons={iconOptions}
        value={iconName}
        color={color}
        onPick={(v) => {
          setIconName(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 15 },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: { fontSize: 14, fontWeight: "600" },
  previewSub: { fontSize: 11, marginTop: 2 },
  previewAmount: { fontSize: 16, fontWeight: "600" },
  previewCurrency: { fontSize: 10, marginTop: 2 },
  adjustBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  adjustText: { flex: 1, fontSize: 13 },
});
