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
import BillingCyclesSection, {
  BillingCyclesConfig,
  buildDefaultBillingConfig,
} from "@/components/views/forms/BillingCyclesSection";
import { useWallets } from "@/contexts/WalletsContext";
import { useBillingCyclesService } from "@/lib/database/billingCyclesService";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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

export default function AddWalletScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { createWallet } = useWallets();
  const billingCyclesService = useBillingCyclesService();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<WalletKind>("debit");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [iconName, setIconName] = useState("Bank");
  const [color, setColor] = useState("#0A84FF");
  const [pickerOpen, setPickerOpen] = useState<PickerKey>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingConfig, setBillingConfig] = useState<BillingCyclesConfig>(
    buildDefaultBillingConfig(0)
  );

  const cur = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0],
    [currency]
  );

  const balanceNum = useMemo(() => {
    const n = parseFloat(balance);
    return isNaN(n) ? 0 : n;
  }, [balance]);

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

  const handleSave = async () => {
    if (!canSave) return;
    setIsSubmitting(true);
    try {
      const walletId = await createWallet({
        name: name.trim(),
        balance: balanceNum,
        icon: ICON_NAME_TO_EMOJI[iconName] || "🏦",
        color,
        currency,
        type: "regular",
        bank: kind !== "cash" ? bank || undefined : undefined,
        last_four_digits: kind === "debit" ? last4 || undefined : undefined,
      });

      if (billingConfig.enabled && billingConfig.cycles.length > 0) {
        const startDate = new Date(billingConfig.startYear, billingConfig.startMonth, 1);
        await billingCyclesService.bulkCreateCycles(
          walletId,
          startDate,
          1,
          billingConfig.count,
          billingConfig.interestRate,
          billingConfig.cycles
        );
      }

      Toast.success("¡Cuenta creada!", "La cuenta se creó correctamente.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormShell
        title="Nueva cuenta"
        subtitle="Débito, efectivo o wallet"
        saveLabel="Crear cuenta"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        {/* Live preview */}
        <View
          style={[
            styles.preview,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.previewIcon,
              { backgroundColor: `${color}22` },
            ]}
          >
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

        <BillingCyclesSection
          value={billingConfig}
          onChange={setBillingConfig}
          initialBalance={balanceNum}
          currencySymbol={cur.symbol}
        />
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
});
