import { Toast } from "@/components/ui/Toast";
import { DesignIcon } from "@/components/ui/Icon";
import FormShell from "@/components/views/forms/FormShell";
import {
  FormGroup,
  InfoBox,
  PickerRow,
  TextField,
} from "@/components/views/forms/FormFields";
import { ListPickerSheet } from "@/components/views/forms/PickerSheets";
import { useObjectives } from "@/contexts/ObjectivesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import { useTheme } from "@/theme/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type DebtTarget =
  | { kind: "credit"; wallet: Wallet }
  | { kind: "objective"; objective: any };

export default function PayDebtScreen() {
  const router = useRouter();
  const { debtId, kind: targetKind } = useLocalSearchParams<{
    debtId?: string;
    kind?: "credit" | "objective";
  }>();
  const { theme, accent } = useTheme();
  const { wallets, refreshWallets } = useWallets();
  const { objectives, refreshObjectives, addProgress } = useObjectives();
  const { refreshTransactions } = useTransactions();
  const {
    createTransaction,
    getObjectiveByCreditWallet,
    updateObjective,
  } = useSQLiteService();

  const debts = useMemo<DebtTarget[]>(() => {
    const list: DebtTarget[] = [];
    wallets
      .filter((w) => w.type === "credit")
      .forEach((w) => {
        const bal = w.net_balance ?? w.balance;
        if (bal > 0) list.push({ kind: "credit", wallet: w });
      });
    objectives
      .filter((o) => o.type === "debt" && !o.is_archived)
      .forEach((o) => {
        if (o.amount - o.current_amount > 0) {
          list.push({ kind: "objective", objective: o });
        }
      });
    return list;
  }, [wallets, objectives]);

  const sourceWallets = useMemo(
    () => wallets.filter((w) => w.type !== "credit"),
    [wallets]
  );

  const [debtIndex, setDebtIndex] = useState<string>("");
  const [sourceId, setSourceId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [debtPickerOpen, setDebtPickerOpen] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Init
  useEffect(() => {
    if (!debtIndex && debts.length > 0) {
      // Pre-select if route param indicates which debt
      if (debtId && targetKind) {
        const idx = debts.findIndex((d) =>
          targetKind === "credit"
            ? d.kind === "credit" && d.wallet.id === debtId
            : d.kind === "objective" && d.objective.id === debtId
        );
        if (idx >= 0) {
          setDebtIndex(String(idx));
          return;
        }
      }
      setDebtIndex("0");
    }
  }, [debts, debtIndex, debtId, targetKind]);

  useEffect(() => {
    if (!sourceId && sourceWallets.length > 0) {
      setSourceId(sourceWallets[0].id);
    }
  }, [sourceWallets, sourceId]);

  const debt = debts[parseInt(debtIndex || "0", 10)];
  const source = sourceWallets.find((w) => w.id === sourceId);

  const debtName =
    debt?.kind === "credit" ? debt.wallet.name : debt?.objective?.title || "—";
  const debtRemaining =
    debt?.kind === "credit"
      ? debt.wallet.net_balance ?? debt.wallet.balance
      : debt?.kind === "objective"
      ? Math.max(0, debt.objective.amount - debt.objective.current_amount)
      : 0;

  const amountNum = parseFloat(amount) || 0;
  const sourceBal = source ? source.net_balance ?? source.balance : 0;
  const newSourceBal = sourceBal - amountNum;
  const newDebtRemaining = Math.max(0, debtRemaining - amountNum);

  const canSave =
    !!debt &&
    !!source &&
    amountNum > 0 &&
    amountNum <= debtRemaining + 0.001 &&
    !isSubmitting;

  const handleSave = async () => {
    if (!canSave || !debt || !source) {
      Toast.warn("Verifica los datos", "Completa cuenta, deuda y monto válido.");
      return;
    }
    setIsSubmitting(true);
    try {
      const ts = Date.now();
      const debtTitle = debt.kind === "credit" ? debt.wallet.name : debt.objective.title;

      // Salida desde la cuenta origen
      await createTransaction({
        wallet_id: source.id,
        amount: amountNum,
        type: "expense",
        title: `Pago a ${debtTitle}`,
        note: note.trim() || undefined,
        timestamp: ts,
        to_wallet_id: debt.kind === "credit" ? debt.wallet.id : undefined,
      });

      if (debt.kind === "credit") {
        // Pago en la tarjeta = ingreso (reduce deuda y libera crédito disponible)
        await createTransaction({
          wallet_id: debt.wallet.id,
          amount: amountNum,
          type: "income",
          title: `Pago desde ${source.name}`,
          note: note.trim() || undefined,
          timestamp: ts,
          to_wallet_id: source.id,
        });

        // Actualiza el objetivo de deuda asociado a la tarjeta (si existe)
        const linkedObj = await getObjectiveByCreditWallet(debt.wallet.id);
        if (linkedObj) {
          await updateObjective(linkedObj.id, {
            current_amount: Math.min(
              linkedObj.amount,
              linkedObj.current_amount + amountNum
            ),
          });
        }
      } else {
        // Objetivo de deuda: aumentar progreso
        await addProgress(debt.objective.id, amountNum);
      }

      await refreshWallets();
      await refreshTransactions();
      await refreshObjectives();

      Toast.success(
        "Pago registrado",
        `Pagaste $${amountNum.toLocaleString("es-MX")} a ${debtTitle}.`
      );
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo registrar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const debtOptions = debts.map((d, i) => {
    if (d.kind === "credit") {
      const bal = d.wallet.net_balance ?? d.wallet.balance;
      const limit = d.wallet.credit_limit || 0;
      return {
        id: String(i),
        label: d.wallet.name,
        sub: `Tarjeta · Deuda $${bal.toLocaleString("es-MX")}${
          limit > 0 ? ` de $${limit.toLocaleString("es-MX")}` : ""
        }`,
        color: d.wallet.color || theme.bad,
      };
    }
    const remaining = Math.max(
      0,
      d.objective.amount - d.objective.current_amount
    );
    return {
      id: String(i),
      label: d.objective.title,
      sub: `Deuda · Restante $${remaining.toLocaleString("es-MX")}`,
      color: theme.bad,
    };
  });

  const sourceOptions = sourceWallets.map((w) => {
    const bal = w.net_balance ?? w.balance;
    return {
      id: w.id,
      label: w.name,
      sub: `${w.last_four_digits ? "•••• " + w.last_four_digits + " · " : ""}$${bal.toLocaleString("es-MX")}`,
      color: w.color || "#0A84FF",
    };
  });

  if (debts.length === 0) {
    return (
      <FormShell
        title="Pagar deuda"
        saveLabel="Registrar pago"
        canSave={false}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        <View style={styles.empty}>
          <DesignIcon.Debt size={56} color={theme.textTer} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Sin deudas activas
          </Text>
          <Text style={[styles.emptySub, { color: theme.textTer }]}>
            Cuando registres una tarjeta de crédito con saldo o una deuda manual aparecerán aquí.
          </Text>
        </View>
      </FormShell>
    );
  }

  return (
    <>
      <FormShell
        title="Pagar deuda"
        subtitle={debt?.kind === "credit" ? "Tarjeta de crédito" : "Deuda"}
        saveLabel="Registrar pago"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        {/* Hero card */}
        <View
          style={[
            styles.hero,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.heroRow}>
            <Text style={[styles.heroLabel, { color: theme.textTer }]}>
              SE PAGARÁ
            </Text>
            <Text
              style={[
                styles.heroAmount,
                { color: theme.text, fontVariant: ["tabular-nums"] },
              ]}
            >
              $
              {amountNum.toLocaleString("es-MX", {
                minimumFractionDigits: amountNum % 1 === 0 ? 0 : 2,
              })}
            </Text>
          </View>
          <View style={styles.heroDivider}>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          </View>
          <View style={styles.heroSplit}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: theme.textTer }]}>
                Deuda actual
              </Text>
              <Text
                style={[
                  styles.miniVal,
                  { color: theme.bad, fontVariant: ["tabular-nums"] },
                ]}
              >
                ${debtRemaining.toLocaleString("es-MX")}
              </Text>
              <Text style={[styles.miniMeta, { color: theme.textTer }]}>
                → ${newDebtRemaining.toLocaleString("es-MX")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: theme.textTer }]}>
                Saldo cuenta
              </Text>
              <Text
                style={[
                  styles.miniVal,
                  { color: theme.text, fontVariant: ["tabular-nums"] },
                ]}
              >
                ${sourceBal.toLocaleString("es-MX")}
              </Text>
              <Text
                style={[
                  styles.miniMeta,
                  {
                    color: newSourceBal < 0 ? theme.bad : theme.textTer,
                    fontVariant: ["tabular-nums"],
                  },
                ]}
              >
                → ${newSourceBal.toLocaleString("es-MX")}
              </Text>
            </View>
          </View>
        </View>

        <FormGroup label="Deuda a pagar">
          <PickerRow
            label={debt?.kind === "credit" ? "Tarjeta" : "Deuda"}
            value={debtName}
            onPress={() => setDebtPickerOpen(true)}
            valueColor={theme.bad}
          />
        </FormGroup>

        <FormGroup label="Pagar desde">
          <PickerRow
            label={
              source?.last_four_digits
                ? `•••• ${source.last_four_digits}`
                : source?.bank || "Cuenta"
            }
            value={source?.name || "Seleccionar"}
            icon={
              <View
                style={[
                  styles.dot,
                  { backgroundColor: `${source?.color || "#0A84FF"}22` },
                ]}
              >
                <DesignIcon.Wallet
                  size={14}
                  color={source?.color || "#0A84FF"}
                  strokeWidth={1.7}
                />
              </View>
            }
            onPress={() => setSourcePickerOpen(true)}
          />
        </FormGroup>

        <FormGroup label="Monto a pagar">
          <TextField
            placeholder="0.00"
            value={amount}
            onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
          <View style={styles.quickAmounts}>
            {[
              { label: "Mín. sugerido", val: Math.min(debtRemaining, 500) },
              { label: "10%", val: Math.round(debtRemaining * 0.1) },
              { label: "50%", val: Math.round(debtRemaining * 0.5) },
              { label: "Total", val: debtRemaining },
            ].map((q) => (
              <View
                key={q.label}
                style={[styles.qChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text
                  onPress={() => setAmount(q.val.toString())}
                  style={{ color: theme.text, fontSize: 11, padding: 8 }}
                >
                  {q.label}
                </Text>
              </View>
            ))}
          </View>
        </FormGroup>

        <FormGroup label="Nota (opcional)">
          <TextField
            placeholder="Pago de mes..."
            value={note}
            onChange={setNote}
          />
        </FormGroup>

        <InfoBox>
          {debt?.kind === "credit"
            ? "El pago aumentará el crédito disponible de la tarjeta y reducirá la deuda."
            : "El pago se sumará al progreso de la deuda y reducirá tu saldo restante."}
        </InfoBox>
      </FormShell>

      <ListPickerSheet
        visible={debtPickerOpen}
        title="Selecciona la deuda"
        options={debtOptions}
        value={debtIndex}
        onPick={(v) => {
          setDebtIndex(v);
          setDebtPickerOpen(false);
        }}
        onClose={() => setDebtPickerOpen(false)}
      />
      <ListPickerSheet
        visible={sourcePickerOpen}
        title="Cuenta de origen"
        options={sourceOptions}
        value={sourceId}
        onPick={(v) => {
          setSourceId(v);
          setSourcePickerOpen(false);
        }}
        onClose={() => setSourcePickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroRow: { marginBottom: 12 },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: -1.4,
  },
  heroDivider: { marginBottom: 12 },
  divider: { height: 1 },
  heroSplit: { flexDirection: "row", gap: 14 },
  miniLabel: { fontSize: 10, marginBottom: 3 },
  miniVal: { fontSize: 16, fontWeight: "600" },
  miniMeta: { fontSize: 11, marginTop: 2 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  qChip: { borderRadius: 100, borderWidth: 1 },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySub: { fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 18 },
});
