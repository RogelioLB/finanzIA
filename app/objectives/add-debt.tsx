import { Toast } from "@/components/ui/Toast";
import FormShell from "@/components/views/forms/FormShell";
import {
  FormGroup,
  SegmentedField,
  TextField,
} from "@/components/views/forms/FormFields";
import { useObjectives } from "@/contexts/ObjectivesContext";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type DebtKind = "loan" | "msi" | "other";

const KIND_PREFIX: Record<DebtKind, string> = {
  loan: "Préstamo",
  msi: "MSI",
  other: "Deuda",
};

export default function AddDebtScreen() {
  const router = useRouter();
  const { theme, accent } = useTheme();
  const { createObjective } = useObjectives();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<DebtKind>("loan");
  const [creditor, setCreditor] = useState("");
  const [original, setOriginal] = useState("");
  const [paid, setPaid] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [apr, setApr] = useState("");
  const [dueMonth, setDueMonth] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orig = parseFloat(original) || 0;
  const paidN = parseFloat(paid) || 0;
  const remaining = Math.max(0, orig - paidN);
  const pct = orig > 0 ? (paidN / orig) * 100 : 0;
  const monthsLeft =
    parseFloat(monthly) > 0 ? Math.ceil(remaining / parseFloat(monthly)) : 0;

  const canSave = name.trim().length > 0 && orig > 0 && !isSubmitting;

  const parseDueDate = (text: string): number | undefined => {
    const months: Record<string, number> = {
      ene: 0, enero: 0,
      feb: 1, febrero: 1,
      mar: 2, marzo: 2,
      abr: 3, abril: 3,
      may: 4, mayo: 4,
      jun: 5, junio: 5,
      jul: 6, julio: 6,
      ago: 7, agosto: 7,
      sep: 8, septiembre: 8,
      oct: 9, octubre: 9,
      nov: 10, noviembre: 10,
      dic: 11, diciembre: 11,
    };
    const m = text.trim().toLowerCase().match(/^([a-záéíóú]+)\s+(\d{4})$/);
    if (!m) return undefined;
    const monthIdx = months[m[1]];
    const year = parseInt(m[2], 10);
    if (monthIdx === undefined || isNaN(year)) return undefined;
    return new Date(year, monthIdx, 28).getTime();
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSubmitting(true);
    try {
      const fullName = name.includes(KIND_PREFIX[kind])
        ? name.trim()
        : name.trim();
      await createObjective({
        title: fullName,
        amount: orig,
        current_amount: paidN,
        type: "debt",
        due_date: dueMonth ? parseDueDate(dueMonth) : undefined,
      });
      Toast.success("¡Deuda creada!", "La deuda se registró correctamente.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo crear la deuda. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormShell
        title="Nueva deuda"
        saveLabel="Crear deuda"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        {/* Hero */}
        <View
          style={[
            styles.hero,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.heroLabel, { color: theme.textTer }]}>RESTANTE</Text>
          <Text
            style={[
              styles.heroAmount,
              { color: theme.text, fontVariant: ["tabular-nums"] },
            ]}
          >
            ${remaining.toLocaleString("es-MX")}
          </Text>
          <View style={[styles.barTrack, { backgroundColor: theme.surfaceAlt }]}>
            <View
              style={[
                styles.barFill,
                { width: `${pct}%`, backgroundColor: accent },
              ]}
            />
          </View>
          <View style={styles.heroFoot}>
            <Text style={[styles.heroFootText, { color: theme.textTer }]}>
              {pct.toFixed(0)}% pagado
            </Text>
            {monthsLeft > 0 ? (
              <Text style={[styles.heroFootText, { color: theme.textTer }]}>
                {monthsLeft} pagos restantes
              </Text>
            ) : null}
          </View>
        </View>

        <SegmentedField
          label="Tipo de deuda"
          value={kind}
          onChange={(v) => setKind(v as DebtKind)}
          options={[
            { id: "loan", label: "Préstamo" },
            { id: "msi", label: "MSI" },
            { id: "other", label: "Otra" },
          ]}
        />

        <FormGroup>
          <TextField
            label="Nombre"
            placeholder="Ej. Préstamo familiar"
            value={name}
            onChange={setName}
          />
          <TextField
            label="Acreedor"
            placeholder="A quién le debes"
            value={creditor}
            onChange={setCreditor}
          />
        </FormGroup>

        <FormGroup label="Montos">
          <TextField
            label="Monto original"
            placeholder="25,000"
            value={original}
            onChange={(v) => setOriginal(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            keyboardType="decimal-pad"
            mono
          />
          <TextField
            label="Ya pagado"
            placeholder="0"
            value={paid}
            onChange={(v) => setPaid(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            keyboardType="decimal-pad"
            mono
          />
          <TextField
            label="Pago mensual"
            placeholder="2,000"
            value={monthly}
            onChange={(v) => setMonthly(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="/mes"
            keyboardType="decimal-pad"
            mono
          />
        </FormGroup>

        <FormGroup label="Términos">
          <TextField
            label="Tasa anual (CAT)"
            placeholder="12.5"
            value={apr}
            onChange={(v) => setApr(v.replace(/[^0-9.]/g, ""))}
            suffix="%"
            keyboardType="decimal-pad"
            mono
          />
          <TextField
            label="Mes de liquidación"
            placeholder="Sep 2026"
            value={dueMonth}
            onChange={setDueMonth}
            autoCapitalize="none"
          />
        </FormGroup>
      </FormShell>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  barFill: { height: "100%" },
  heroFoot: { flexDirection: "row", justifyContent: "space-between" },
  heroFootText: { fontSize: 11 },
});
