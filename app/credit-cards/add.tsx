import { Toast } from "@/components/ui/Toast";
import { DesignIcon } from "@/components/ui/Icon";
import FormShell from "@/components/views/forms/FormShell";
import {
  ColorSwatches,
  FormGroup,
  InfoBox,
  PickerRow,
  TextField,
} from "@/components/views/forms/FormFields";
import { ListPickerSheet } from "@/components/views/forms/PickerSheets";
import { BANKS, COLOR_OPTIONS } from "@/components/views/forms/constants";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AddCreditCardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { createCreditCard } = useCreditCards();

  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [holder, setHolder] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [cutoffDay, setCutoffDay] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [cat, setCat] = useState("");
  const [color, setColor] = useState("#820AD1");
  const [pickerOpen, setPickerOpen] = useState<"bank" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const used = parseFloat(balance) || 0;
  const limitN = parseFloat(limit) || 0;
  const pct = limitN > 0 ? (used / limitN) * 100 : 0;
  const available = Math.max(0, limitN - used);
  const cutoffN = parseInt(cutoffDay) || 0;
  const paymentN = parseInt(paymentDay) || 0;

  const canSave =
    name.trim().length > 0 &&
    bank.length > 0 &&
    last4.length === 4 &&
    limitN > 0 &&
    cutoffN >= 1 &&
    cutoffN <= 31 &&
    paymentN >= 1 &&
    paymentN <= 31 &&
    !isSubmitting;

  const bankOptions = useMemo(
    () => BANKS.map((b) => ({ id: b, label: b })),
    []
  );

  const handleSave = async () => {
    if (!canSave) {
      Toast.warn("Campos incompletos", "Completa todos los campos requeridos.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCreditCard({
        name: name.trim(),
        bank: bank,
        last_four_digits: last4,
        credit_limit: limitN,
        current_balance: used,
        cut_off_day: cutoffN,
        payment_due_day: paymentN,
        interest_rate: cat ? parseFloat(cat) : undefined,
        previous_balance: parseFloat(previousBalance) || 0,
        color,
      });
      Toast.success("¡Tarjeta creada!", "La tarjeta de crédito se creó correctamente.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo crear la tarjeta. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormShell
        title="Nueva tarjeta de crédito"
        saveLabel="Crear tarjeta"
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        {/* Card preview */}
        <View
          style={[
            styles.cardPreview,
            { backgroundColor: color, shadowColor: color },
          ]}
        >
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardBank}>{(bank || "Banco").toUpperCase()}</Text>
              <Text style={styles.cardName}>{name || "Nombre tarjeta"}</Text>
            </View>
            <DesignIcon.Card size={26} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
          </View>
          <Text style={styles.cardNumber}>
            {`••••  ••••  ••••  ${last4 || "••••"}`}
          </Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>TITULAR</Text>
              <Text style={styles.cardValue}>
                {(holder || "Nombre Apellido").toUpperCase()}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>DISPONIBLE</Text>
              <Text style={[styles.cardValue, { fontVariant: ["tabular-nums"] }]}>
                ${available.toLocaleString("es-MX")}
              </Text>
            </View>
          </View>
        </View>

        {limitN > 0 ? (
          <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            <View style={styles.utilHead}>
              <Text style={[styles.utilLabel, { color: theme.textTer }]}>Utilización</Text>
              <Text
                style={[
                  styles.utilLabel,
                  {
                    color: pct > 70 ? theme.bad : theme.text,
                    fontVariant: ["tabular-nums"],
                  },
                ]}
              >
                {pct.toFixed(0)}%
              </Text>
            </View>
            <View style={[styles.utilTrack, { backgroundColor: theme.surfaceAlt }]}>
              <View
                style={[
                  styles.utilFill,
                  {
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: pct > 70 ? theme.bad : color,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        <FormGroup label="Identificación">
          <TextField
            label="Nombre / Alias"
            placeholder="Ej. Nu Morada"
            value={name}
            onChange={setName}
          />
          <PickerRow
            label="Banco emisor"
            value={bank || "Seleccionar"}
            onPress={() => setPickerOpen("bank")}
          />
          <TextField
            label="Últimos 4 dígitos"
            placeholder="1234"
            maxLength={4}
            keyboardType="number-pad"
            value={last4}
            onChange={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
            mono
          />
          <TextField
            label="Titular"
            placeholder="Nombre como en la tarjeta"
            value={holder}
            onChange={setHolder}
            autoCapitalize="words"
          />
        </FormGroup>

        <FormGroup label="Línea y saldo">
          <TextField
            label="Límite de crédito"
            placeholder="30,000"
            value={limit}
            onChange={(v) => setLimit(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
          <TextField
            label="Saldo del estado de cuenta actual"
            placeholder="0"
            value={previousBalance}
            onChange={(v) => setPreviousBalance(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
          <TextField
            label="Cargos acumulando (ciclo abierto)"
            placeholder="0"
            value={balance}
            onChange={(v) => setBalance(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
        </FormGroup>

        <FormGroup label="Fechas">
          <TextField
            label="Día de corte"
            placeholder="15"
            maxLength={2}
            keyboardType="number-pad"
            value={cutoffDay}
            onChange={(v) => setCutoffDay(v.replace(/\D/g, "").slice(0, 2))}
            suffix="del mes"
            mono
          />
          <TextField
            label="Día límite de pago"
            placeholder="3"
            maxLength={2}
            keyboardType="number-pad"
            value={paymentDay}
            onChange={(v) => setPaymentDay(v.replace(/\D/g, "").slice(0, 2))}
            suffix="del mes"
            mono
          />
        </FormGroup>

        <FormGroup label="Costo">
          <TextField
            label="CAT promedio anual"
            placeholder="34.9"
            value={cat}
            onChange={(v) => setCat(v.replace(/[^0-9.]/g, ""))}
            suffix="%"
            keyboardType="decimal-pad"
            mono
          />
        </FormGroup>

        <FormGroup label="Color de la tarjeta">
          <ColorSwatches
            colors={COLOR_OPTIONS}
            selected={color}
            onSelect={setColor}
          />
        </FormGroup>

        <InfoBox icon={<Text style={{ fontSize: 14 }}>🔒</Text>}>
          Solo guardamos los últimos 4 dígitos. Nunca pedimos el número completo, CVV ni fecha de vencimiento.
        </InfoBox>
      </FormShell>

      <ListPickerSheet
        visible={pickerOpen === "bank"}
        title="Banco emisor"
        options={bankOptions}
        value={bank}
        onPick={(v) => {
          setBank(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardPreview: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    minHeight: 150,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardBank: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  cardName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 4,
    color: "#fff",
    marginTop: 22,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  cardLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    marginTop: 1,
  },
  utilHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  utilLabel: { fontSize: 11 },
  utilTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  utilFill: { height: "100%" },
});
