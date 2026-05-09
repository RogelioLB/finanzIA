import React, { useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import FormShell from "@/components/views/forms/FormShell";
import {
  FormGroup,
  PickerRow,
  TextField,
} from "@/components/views/forms/FormFields";
import { ListPickerSheet } from "@/components/views/forms/PickerSheets";
import { Toast } from "@/components/ui/Toast";

const MONTHS_OPTIONS = [
  { id: "3", label: "3 meses" },
  { id: "6", label: "6 meses" },
  { id: "9", label: "9 meses" },
  { id: "12", label: "12 meses" },
  { id: "18", label: "18 meses" },
  { id: "24", label: "24 meses" },
];

export default function AddInstallmentScreen() {
  const { walletId } = useLocalSearchParams<{ walletId: string }>();
  const router = useRouter();
  const { createInstallment, getCreditCardById } = useCreditCards();

  const card = walletId ? getCreditCardById(walletId) : undefined;

  const [title, setTitle] = useState("");
  const [store, setStore] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [months, setMonths] = useState("12");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalN = parseFloat(totalAmount) || 0;
  const monthsN = parseInt(months) || 12;
  const autoMonthly = monthsN > 0 && totalN > 0 ? totalN / monthsN : 0;
  const monthlyN = parseFloat(monthlyAmount) || autoMonthly;

  const canSave =
    title.trim().length > 0 &&
    totalN > 0 &&
    monthsN > 0 &&
    monthlyN > 0 &&
    !!walletId &&
    !isSubmitting;

  const handleMonthsChange = (val: string) => {
    setMonths(val);
    // Auto-calculate monthly when months changes, only if monthly wasn't manually set
    if (!monthlyAmount) return;
    const n = parseInt(val) || 12;
    const t = parseFloat(totalAmount) || 0;
    if (t > 0) setMonthlyAmount((t / n).toFixed(2));
  };

  const handleTotalChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    setTotalAmount(cleaned);
    // Auto-fill monthly if not manually edited
    const t = parseFloat(cleaned) || 0;
    if (t > 0) {
      setMonthlyAmount((t / monthsN).toFixed(2));
    }
  };

  const handleSave = async () => {
    if (!canSave || !walletId) return;
    setIsSubmitting(true);
    try {
      await createInstallment({
        wallet_id: walletId,
        title: title.trim(),
        store: store.trim() || undefined,
        total_amount: totalN,
        monthly_amount: monthlyN,
        total_installments: monthsN,
        start_date: Date.now(),
        notes: notes.trim() || undefined,
      });
      Toast.success("Compra registrada", `${title.trim()} en ${monthsN} cuotas de $${monthlyN.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mes.`);
      router.back();
    } catch {
      Toast.error("Error", "No se pudo registrar la compra a meses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormShell
        title={card ? `MSI — ${card.name}` : "Compra a meses"}
        saveLabel="Registrar compra"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        <FormGroup label="Compra">
          <TextField
            label="Descripción"
            placeholder="Ej. MacBook Pro"
            value={title}
            onChange={setTitle}
            autoCapitalize="words"
          />
          <TextField
            label="Tienda (opcional)"
            placeholder="Ej. BestBuy, Liverpool"
            value={store}
            onChange={setStore}
            autoCapitalize="words"
          />
        </FormGroup>

        <FormGroup label="Monto">
          <TextField
            label="Total de la compra"
            placeholder="0"
            value={totalAmount}
            onChange={handleTotalChange}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
          <PickerRow
            label="Número de meses"
            value={MONTHS_OPTIONS.find((o) => o.id === months)?.label ?? `${months} meses`}
            onPress={() => setPickerOpen(true)}
          />
          <TextField
            label="Mensualidad"
            placeholder={autoMonthly > 0 ? autoMonthly.toFixed(2) : "0"}
            value={monthlyAmount}
            onChange={(v) => setMonthlyAmount(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN/mes"
            keyboardType="decimal-pad"
            mono
          />
        </FormGroup>

        <FormGroup label="Notas">
          <TextField
            label="Notas (opcional)"
            placeholder="Información adicional"
            value={notes}
            onChange={setNotes}
            multiline
          />
        </FormGroup>

        {totalN > 0 && monthlyN > 0 ? (
          <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginBottom: 8 }}>
            {`${monthsN} cuotas de $${monthlyN.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} = $${(monthlyN * monthsN).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total`}
          </Text>
        ) : null}
      </FormShell>

      <ListPickerSheet
        visible={pickerOpen}
        title="Número de meses"
        options={MONTHS_OPTIONS}
        value={months}
        onPick={(v) => {
          handleMonthsChange(v);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
