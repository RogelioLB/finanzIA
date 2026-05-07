import { Toast } from "@/components/ui/Toast";
import { DesignIcon } from "@/components/ui/Icon";
import FormShell from "@/components/views/forms/FormShell";
import {
  AnimatedChip,
  FormGroup,
  InfoBox,
  PickerRow,
  SegmentedField,
  TextField,
} from "@/components/views/forms/FormFields";
import { ListPickerSheet } from "@/components/views/forms/PickerSheets";
import { CategoryIcon } from "@/components/views/forms/categoryIcon";
import { Category } from "@/contexts/CategoriesContext";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useCategories } from "@/hooks/useCategories";
import { useTheme } from "@/theme/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Transaction, useSQLiteService } from "../../../lib/database/sqliteService";

type FrequencyType = "weekly" | "monthly" | "yearly";
type DurationKey = "1m" | "2m" | "6m" | "1y" | "forever";

interface SubscriptionFormProps {
  mode: "add" | "edit";
  subscriptionId?: string;
}

const FREQ_LABELS: Record<FrequencyType, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

const DURATION_LABELS: Record<DurationKey, string> = {
  "1m": "1 mes",
  "2m": "2 meses",
  "6m": "6 meses",
  "1y": "1 año",
  forever: "Para siempre",
};

function durationToTimes(d: DurationKey, freq: FrequencyType): number | null {
  if (d === "forever") return null;
  const months: Record<DurationKey, number> = {
    "1m": 1,
    "2m": 2,
    "6m": 6,
    "1y": 12,
    forever: 0,
  };
  const m = months[d];
  if (freq === "weekly") return Math.max(1, Math.round(m * 4.345));
  if (freq === "yearly") return Math.max(1, Math.round(m / 12));
  return m;
}

export default function SubscriptionForm({
  mode,
  subscriptionId,
}: SubscriptionFormProps) {
  const router = useRouter();
  const { theme, accent } = useTheme();
  const { wallets, refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();
  const { refreshSubscriptions } = useSubscriptions();
  const { expenseCategories, incomeCategories } = useCategories();
  const {
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useSQLiteService();

  const [subscription, setSubscription] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");

  const [type, setType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<string | null>(
    wallets.length > 0 ? wallets[0].id : null
  );
  const [category, setCategory] = useState<Category | null>(null);
  const [frequency, setFrequency] = useState<FrequencyType>("monthly");
  const [duration, setDuration] = useState<DurationKey>("forever");
  const [nextPaymentDate, setNextPaymentDate] = useState(Date.now());

  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === "expense" ? expenseCategories : incomeCategories;
  const isIncome = type === "income";
  const wallet = wallets.find((w) => w.id === walletId);

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  useEffect(() => {
    if (mode === "edit" && subscriptionId) {
      loadSubscription();
    } else if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, subscriptionId, categories.length]);

  const loadSubscription = async () => {
    if (!subscriptionId) return;
    setIsLoading(true);
    try {
      const sub = await getTransactionById(subscriptionId);
      if (!sub || sub.is_subscription !== 1) {
        Toast.error("Error", "Suscripción no encontrada.");
        return;
      }
      setSubscription(sub);
      setType(sub.type as "expense" | "income");
      setTitle(sub.title);
      setAmount(sub.amount.toString());
      setWalletId(sub.wallet_id);
      const freq = (sub.subscription_frequency as FrequencyType) || "monthly";
      setFrequency(freq);
      const cat = [...expenseCategories, ...incomeCategories].find(
        (c) => c.id === sub.category_id
      );
      if (cat) setCategory(cat);
      if (sub.next_payment_date) setNextPaymentDate(sub.next_payment_date);
      if (sub.end_date) {
        const now = Date.now();
        const diff = sub.end_date - now;
        const ms =
          freq === "weekly"
            ? 7 * 86400000
            : freq === "yearly"
            ? 365 * 86400000
            : 30 * 86400000;
        const months = Math.max(1, Math.round(diff / ms));
        if (months <= 1) setDuration("1m");
        else if (months <= 2) setDuration("2m");
        else if (months <= 6) setDuration("6m");
        else if (months <= 12) setDuration("1y");
        else setDuration("forever");
      } else {
        setDuration("forever");
      }
    } catch (e) {
      Toast.error("Error", "No se pudo cargar la suscripción.");
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = useMemo(
    () =>
      title.trim().length > 0 &&
      parseFloat(amount) > 0 &&
      !!walletId &&
      !!category &&
      !isSubmitting,
    [title, amount, walletId, category, isSubmitting]
  );

  const handleSave = async () => {
    if (!canSave || !walletId || !category) return;
    setIsSubmitting(true);
    try {
      const amountNum = parseFloat(amount);
      let endDate: number | undefined;
      const times = durationToTimes(duration, frequency);
      if (times !== null) {
        const ms =
          frequency === "weekly"
            ? times * 7 * 86400000
            : frequency === "yearly"
            ? times * 365 * 86400000
            : times * 30 * 86400000;
        endDate = nextPaymentDate + ms;
      }
      const data = {
        wallet_id: walletId,
        amount: amountNum,
        type,
        title: title.trim(),
        category_id: category.id,
        is_subscription: 1,
        subscription_frequency: frequency,
        next_payment_date: nextPaymentDate,
        end_date: endDate,
        is_excluded: 1,
        timestamp: nextPaymentDate,
      };
      if (mode === "add") {
        await createTransaction(data);
      } else if (subscription) {
        await updateTransaction(subscription.id, data);
      }
      await refreshWallets();
      await refreshTransactions();
      await refreshSubscriptions();
      Toast.success(
        mode === "add" ? "¡Suscripción creada!" : "¡Actualizado!",
        mode === "add"
          ? "La suscripción se creó correctamente."
          : "Los cambios se guardaron correctamente."
      );
      router.back();
    } catch (e) {
      Toast.error(
        "Error",
        `No se pudo ${mode === "add" ? "crear" : "actualizar"} la suscripción.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subscription) return;
    setIsSubmitting(true);
    try {
      await deleteTransaction(subscription.id);
      await refreshWallets();
      await refreshTransactions();
      await refreshSubscriptions();
      Toast.success("Eliminada", "La suscripción se eliminó.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo eliminar la suscripción.");
    } finally {
      setIsSubmitting(false);
      setShowDelete(false);
    }
  };

  const walletOptions = wallets.map((w) => {
    const bal = w.net_balance ?? w.balance;
    const balStr =
      w.type === "credit"
        ? `−$${Math.abs(bal).toLocaleString("es-MX")}`
        : `$${bal.toLocaleString("es-MX")}`;
    return {
      id: w.id,
      label: w.name,
      sub: `${w.last_four_digits ? "•••• " + w.last_four_digits + " · " : ""}${balStr}`,
      color: w.color || "#0A84FF",
    };
  });

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  const previewAmount = amount || "0";

  return (
    <>
      <FormShell
        title={mode === "add" ? "Nueva suscripción" : "Editar suscripción"}
        subtitle={isIncome ? "Ingreso recurrente" : "Pago recurrente"}
        saveLabel={mode === "add" ? "Crear suscripción" : "Guardar cambios"}
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
              {
                backgroundColor: isIncome ? `${theme.good}22` : `${accent}22`,
              },
            ]}
          >
            <CategoryIcon
              category={category || undefined}
              size={20}
              color={isIncome ? theme.good : accent}
              strokeWidth={1.6}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.previewName, { color: theme.text }]} numberOfLines={1}>
              {title || "Título"}
            </Text>
            <Text style={[styles.previewSub, { color: theme.textTer }]} numberOfLines={1}>
              {FREQ_LABELS[frequency]} · {DURATION_LABELS[duration]} · {wallet?.name || "—"}
            </Text>
          </View>
          <Text
            style={[
              styles.previewAmount,
              {
                color: isIncome ? theme.good : theme.text,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {isIncome ? "+" : "−"}${previewAmount}
          </Text>
        </View>

        <SegmentedField
          label="Tipo"
          value={type}
          onChange={(v) => {
            setType(v as "expense" | "income");
            setCategory(null);
          }}
          options={[
            { id: "expense", label: "Gasto" },
            { id: "income", label: "Ingreso" },
          ]}
        />

        <FormGroup>
          <TextField
            label="Título"
            placeholder={isIncome ? "Ej. Salario" : "Ej. Spotify Premium"}
            value={title}
            onChange={setTitle}
          />
          <TextField
            label="Monto"
            placeholder="0.00"
            value={amount}
            onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
            prefix="$"
            suffix="MXN"
            keyboardType="decimal-pad"
            mono
          />
        </FormGroup>

        <FormGroup label="Categoría">
          <View style={styles.chipsWrap}>
            {categories.map((c) => {
              const active = category?.id === c.id;
              return (
                <AnimatedChip
                  key={c.id}
                  active={active}
                  onPress={() => setCategory(c)}
                >
                  <CategoryIcon
                    category={c}
                    size={14}
                    color={active ? accent : theme.text}
                    strokeWidth={1.7}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? accent : theme.text },
                    ]}
                  >
                    {c.name}
                  </Text>
                </AnimatedChip>
              );
            })}
          </View>
        </FormGroup>

        <FormGroup label={isIncome ? "Cuenta destino" : "Cuenta de pago"}>
          <PickerRow
            label={
              wallet?.last_four_digits
                ? `•••• ${wallet.last_four_digits}`
                : wallet?.bank || (wallet?.type === "credit" ? "Crédito" : "Cuenta")
            }
            value={wallet?.name || "Seleccionar"}
            icon={
              <View
                style={[
                  styles.walletDot,
                  { backgroundColor: `${wallet?.color || "#0A84FF"}22` },
                ]}
              >
                {wallet?.type === "credit" ? (
                  <DesignIcon.Card size={14} color={wallet.color || "#0A84FF"} strokeWidth={1.7} />
                ) : (
                  <DesignIcon.Wallet size={14} color={wallet?.color || "#0A84FF"} strokeWidth={1.7} />
                )}
              </View>
            }
            onPress={() => setWalletPickerOpen(true)}
          />
        </FormGroup>

        <SegmentedField
          label="Frecuencia"
          value={frequency}
          onChange={(v) => setFrequency(v as FrequencyType)}
          options={[
            { id: "weekly", label: "Sem" },
            { id: "monthly", label: "Mes" },
            { id: "yearly", label: "Año" },
          ]}
        />

        <FormGroup label="Duración">
          <View style={[styles.chipsWrap, { gap: 6 }]}>
            {(Object.keys(DURATION_LABELS) as DurationKey[]).map((d) => {
              const active = duration === d;
              return (
                <AnimatedChip
                  key={d}
                  active={active}
                  onPress={() => setDuration(d)}
                  activeBg={accent}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? "#fff" : theme.text },
                    ]}
                  >
                    {DURATION_LABELS[d]}
                  </Text>
                </AnimatedChip>
              );
            })}
          </View>
        </FormGroup>

        <FormGroup>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.fieldLabel, { color: theme.textTer }]}>
              Próximo pago
            </Text>
            <Text
              style={[
                styles.dateValue,
                { color: theme.text, fontVariant: ["tabular-nums"] },
              ]}
            >
              {new Date(nextPaymentDate).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>
        </FormGroup>

        <InfoBox>
          {isIncome
            ? `Se sumará automáticamente a ${wallet?.name || "la cuenta"} en cada fecha de pago.`
            : `Se descontará de ${wallet?.name || "la cuenta"} en cada fecha de pago.${
                wallet?.type === "credit"
                  ? " Como es tarjeta de crédito, aumentará tu deuda."
                  : ""
              }`}
        </InfoBox>

        {mode === "edit" ? (
          <TouchableOpacity
            onPress={() => setShowDelete(true)}
            style={[styles.deleteBtn, { borderColor: theme.bad }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.deleteText, { color: theme.bad }]}>
              Eliminar suscripción
            </Text>
          </TouchableOpacity>
        ) : null}
      </FormShell>

      <ListPickerSheet
        visible={walletPickerOpen}
        title={isIncome ? "Cuenta destino" : "Cuenta de pago"}
        options={walletOptions}
        value={walletId || ""}
        onPick={(v) => {
          setWalletId(v);
          setWalletPickerOpen(false);
        }}
        onClose={() => setWalletPickerOpen(false)}
      />

      {showDatePicker ? (
        <DateTimePicker
          value={new Date(nextPaymentDate)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            setShowDatePicker(Platform.OS === "ios");
            if (d) setNextPaymentDate(d.getTime());
          }}
        />
      ) : null}

      <Modal visible={showDelete} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDelete(false)} />
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              ¿Eliminar suscripción?
            </Text>
            <Text style={[styles.modalText, { color: theme.textSec }]}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowDelete(false)}
                style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.modalBtn, { backgroundColor: theme.bad }]}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: { fontSize: 14, fontWeight: "600" },
  previewSub: { fontSize: 11, marginTop: 2 },
  previewAmount: { fontSize: 16, fontWeight: "600" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipText: { fontSize: 12, fontWeight: "500" },
  walletDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  fieldLabel: { fontSize: 11, marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: "500" },
  deleteBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  deleteText: { fontSize: 14, fontWeight: "600" },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  modalText: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { fontSize: 14, fontWeight: "600" },
});
