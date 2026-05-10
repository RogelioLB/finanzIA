import React, { useCallback, useEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { FormGroup } from "@/components/views/forms/FormFields";

export interface CycleInput {
  opening_balance: number;
  minimum_payment: number;
}

export interface BillingCyclesConfig {
  enabled: boolean;
  count: number;
  startYear: number;
  startMonth: number; // 0-indexed
  interestRate: number;
  cycles: CycleInput[];
}

interface Props {
  value: BillingCyclesConfig;
  onChange: (v: BillingCyclesConfig) => void;
  initialBalance: number;
  currencySymbol: string;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildDefaultCycles(count: number, initialBalance: number): CycleInput[] {
  return Array.from({ length: count }, (_, i) => ({
    opening_balance: i === 0 ? initialBalance : 0,
    minimum_payment: 0,
  }));
}

function recalcCycles(cycles: CycleInput[], interestRate: number): CycleInput[] {
  return cycles.map((c, i) => {
    if (i === 0) return c;
    const prev = cycles[i - 1];
    const interest = prev.opening_balance * (interestRate / 100);
    const nextOpening = Math.max(0, prev.opening_balance - prev.minimum_payment + interest);
    return { ...c, opening_balance: parseFloat(nextOpening.toFixed(2)) };
  });
}

export function buildDefaultBillingConfig(initialBalance: number): BillingCyclesConfig {
  const now = new Date();
  return {
    enabled: false,
    count: 3,
    startYear: now.getFullYear(),
    startMonth: now.getMonth(),
    interestRate: 0,
    cycles: buildDefaultCycles(3, initialBalance),
  };
}

export default function BillingCyclesSection({ value, onChange, initialBalance, currencySymbol }: Props) {
  const { theme, accent } = useTheme();

  // Sync first cycle opening_balance when initialBalance prop changes
  useEffect(() => {
    if (!value.enabled) return;
    const updated = value.cycles.map((c, i) =>
      i === 0 ? { ...c, opening_balance: initialBalance } : c
    );
    const recalced = recalcCycles(updated, value.interestRate);
    onChange({ ...value, cycles: recalced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBalance]);

  const toggleEnabled = useCallback(() => {
    const next = !value.enabled;
    if (next && value.cycles.length === 0) {
      onChange({
        ...value,
        enabled: true,
        cycles: buildDefaultCycles(value.count, initialBalance),
      });
    } else {
      onChange({ ...value, enabled: next });
    }
  }, [value, onChange, initialBalance]);

  const setCount = useCallback(
    (raw: string) => {
      const n = clamp(parseInt(raw || "1", 10), 1, 24);
      if (isNaN(n)) return;
      let cycles = value.cycles.slice(0, n);
      while (cycles.length < n) {
        cycles.push({ opening_balance: 0, minimum_payment: 0 });
      }
      if (cycles.length > 0) {
        cycles[0] = { ...cycles[0], opening_balance: initialBalance };
      }
      cycles = recalcCycles(cycles, value.interestRate);
      onChange({ ...value, count: n, cycles });
    },
    [value, onChange, initialBalance]
  );

  const setInterestRate = useCallback(
    (raw: string) => {
      const rate = parseFloat(raw || "0") || 0;
      const recalced = recalcCycles(value.cycles, rate);
      onChange({ ...value, interestRate: rate, cycles: recalced });
    },
    [value, onChange]
  );

  const prevMonth = useCallback(() => {
    let m = value.startMonth - 1;
    let y = value.startYear;
    if (m < 0) { m = 11; y -= 1; }
    onChange({ ...value, startMonth: m, startYear: y });
  }, [value, onChange]);

  const nextMonth = useCallback(() => {
    let m = value.startMonth + 1;
    let y = value.startYear;
    if (m > 11) { m = 0; y += 1; }
    onChange({ ...value, startMonth: m, startYear: y });
  }, [value, onChange]);

  const updateCycleMinPayment = useCallback(
    (index: number, raw: string) => {
      const amount = parseFloat(raw || "0") || 0;
      const updated = value.cycles.map((c, i) =>
        i === index ? { ...c, minimum_payment: amount } : c
      );
      const recalced = recalcCycles(updated, value.interestRate);
      onChange({ ...value, cycles: recalced });
    },
    [value, onChange]
  );

  const cycleLabel = useCallback(
    (index: number) => {
      const totalMonths = value.startMonth + index;
      const m = totalMonths % 12;
      const y = value.startYear + Math.floor(totalMonths / 12);
      const nextM = (m + 1) % 12;
      const nextY = m === 11 ? y + 1 : y;
      return `${MONTH_NAMES[m]} ${y} → ${MONTH_NAMES[nextM]} ${nextY}`;
    },
    [value.startMonth, value.startYear]
  );

  const fmt = useCallback(
    (n: number) => `${currencySymbol}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [currencySymbol]
  );

  return (
    <FormGroup label="Ciclos de facturación">
      {/* Toggle row */}
      <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <DesignIcon.List size={18} color={value.enabled ? accent : theme.textTer} strokeWidth={1.7} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Activar ciclos de pago</Text>
          <Text style={[styles.toggleSub, { color: theme.textTer }]}>
            Planifica pagos mensuales con intereses
          </Text>
        </View>
        <Switch
          value={value.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: theme.border, true: `${accent}55` }}
          thumbColor={value.enabled ? accent : theme.textTer}
        />
      </View>

      {value.enabled && (
        <View style={styles.configContainer}>
          {/* Month picker */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textTer }]}>Mes de inicio</Text>
            <View style={styles.monthPicker}>
              <Pressable onPress={prevMonth} style={styles.monthBtn}>
                <View style={{ transform: [{ rotate: "180deg" }] }}>
                  <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={2} />
                </View>
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text }]}>
                {MONTH_NAMES[value.startMonth]} {value.startYear}
              </Text>
              <Pressable onPress={nextMonth} style={styles.monthBtn}>
                <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* Number of cycles */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textTer }]}>Número de ciclos</Text>
            <View style={styles.counterRow}>
              <Pressable
                onPress={() => setCount(String(Math.max(1, value.count - 1)))}
                style={[styles.counterBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.counterBtnText, { color: theme.text }]}>−</Text>
              </Pressable>
              <Text style={[styles.counterValue, { color: theme.text }]}>{value.count}</Text>
              <Pressable
                onPress={() => setCount(String(Math.min(24, value.count + 1)))}
                style={[styles.counterBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.counterBtnText, { color: theme.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Interest rate */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textTer }]}>Interés mensual (%)</Text>
            <View style={[styles.smallInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                value={value.interestRate === 0 ? "" : String(value.interestRate)}
                onChangeText={setInterestRate}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textTer}
                style={[styles.smallInputText, { color: theme.text }]}
              />
              <Text style={[styles.smallInputSuffix, { color: theme.textTer }]}>%</Text>
            </View>
          </View>

          {/* Cycle list */}
          <View style={styles.cycleList}>
            {value.cycles.map((cycle, i) => {
              const interest = cycle.opening_balance * (value.interestRate / 100);
              const projectedEnd = Math.max(0, cycle.opening_balance - cycle.minimum_payment + interest);
              return (
                <View
                  key={i}
                  style={[styles.cycleCard, { backgroundColor: theme.surface, borderColor: i === 0 ? accent : theme.border }]}
                >
                  <View style={styles.cycleHeader}>
                    <View style={[styles.cycleBadge, { backgroundColor: i === 0 ? accent : theme.surfaceAlt }]}>
                      <Text style={[styles.cycleBadgeText, { color: i === 0 ? "#fff" : theme.textSec }]}>
                        Ciclo {i + 1}
                      </Text>
                    </View>
                    <Text style={[styles.cycleDateRange, { color: theme.textTer }]}>
                      {cycleLabel(i)}
                    </Text>
                  </View>

                  <View style={styles.cycleRow}>
                    <Text style={[styles.cycleRowLabel, { color: theme.textTer }]}>Saldo inicial</Text>
                    <Text style={[styles.cycleRowValue, { color: theme.text }]}>
                      {fmt(cycle.opening_balance)}
                    </Text>
                  </View>

                  <View style={styles.cyclePaymentRow}>
                    <Text style={[styles.cycleRowLabel, { color: theme.textTer }]}>Pago mínimo</Text>
                    <View style={[styles.paymentInput, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                      <Text style={[styles.paymentCurrency, { color: theme.textTer }]}>{currencySymbol}</Text>
                      <TextInput
                        value={cycle.minimum_payment === 0 ? "" : String(cycle.minimum_payment)}
                        onChangeText={(v: string) => updateCycleMinPayment(i, v.replace(/[^0-9.]/g, ""))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.textTer}
                        style={[styles.paymentInputText, { color: theme.text }]}
                      />
                    </View>
                  </View>

                  {value.interestRate > 0 && (
                    <View style={styles.cycleRow}>
                      <Text style={[styles.cycleRowLabel, { color: theme.textTer }]}>Interés estimado</Text>
                      <Text style={[styles.cycleRowValue, { color: "#FF9F1C" }]}>
                        +{fmt(interest)}
                      </Text>
                    </View>
                  )}

                  {i < value.count - 1 && (
                    <View style={[styles.cycleDivider, { borderColor: theme.border }]}>
                      <Text style={[styles.cycleProjected, { color: theme.textSec }]}>
                        Saldo al siguiente ciclo: {fmt(projectedEnd)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </FormGroup>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 2,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggleSub: { fontSize: 11, marginTop: 2 },
  configContainer: { marginTop: 12, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 13 },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  monthBtn: { padding: 6 },
  monthLabel: { fontSize: 13, fontWeight: "600", minWidth: 80, textAlign: "center" },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 18, lineHeight: 20 },
  counterValue: { fontSize: 16, fontWeight: "700", minWidth: 24, textAlign: "center" },
  smallInput: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    minWidth: 80,
  },
  smallInputText: { fontSize: 14, minWidth: 40, textAlign: "right" },
  smallInputSuffix: { fontSize: 13 },
  cycleList: { gap: 8, marginTop: 4 },
  cycleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cycleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cycleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cycleBadgeText: { fontSize: 11, fontWeight: "700" },
  cycleDateRange: { fontSize: 11 },
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cycleRowLabel: { fontSize: 12 },
  cycleRowValue: { fontSize: 13, fontWeight: "600" },
  cyclePaymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    height: 32,
    gap: 4,
  },
  paymentCurrency: { fontSize: 13 },
  paymentInputText: { fontSize: 13, minWidth: 60, textAlign: "right" },
  cycleDivider: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
  cycleProjected: { fontSize: 11 },
});
