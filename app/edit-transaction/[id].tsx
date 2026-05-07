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
import ClockTimePicker from "@/components/views/forms/ClockTimePicker";
import { Category } from "@/contexts/CategoriesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useCategories } from "@/hooks/useCategories";
import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import { useTheme } from "@/theme/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, accent } = useTheme();
  const { wallets, refreshWallets } = useWallets();
  const { expenseCategories, incomeCategories } = useCategories();
  const { updateTransaction, getTransactionById, deleteTransaction } =
    useSQLiteService();
  const { refreshTransactions } = useTransactions();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState<Category | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCategories = useMemo(
    () => [...expenseCategories, ...incomeCategories],
    [expenseCategories, incomeCategories]
  );
  const filteredCategories = type === "expense" ? expenseCategories : incomeCategories;
  const wallet = wallets.find((w) => w.id === walletId);

  // Cargar datos
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const tx = await getTransactionById(id);
        if (!tx) {
          Toast.error("Error", "Transacción no encontrada.");
          router.back();
          return;
        }
        setType(tx.type as "expense" | "income");
        setTitle(tx.title || "");
        setNote(tx.note || "");
        setAmount(tx.amount.toString());
        setTimestamp(tx.timestamp || Date.now());
        setWalletId(tx.wallet_id);
        if (tx.category_id) {
          const found = allCategories.find((c) => c.id === tx.category_id);
          if (found) setCategory(found);
        }
      } catch (e) {
        Toast.error("Error", "No se pudo cargar la transacción.");
      } finally {
        setIsLoading(false);
      }
    };
    if (allCategories.length > 0 && wallets.length > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, allCategories.length, wallets.length]);

  const canSave =
    !!walletId &&
    !!category &&
    parseFloat(amount) > 0 &&
    !isSubmitting;

  const handleSave = async () => {
    if (!canSave || !walletId || !category) {
      Toast.warn("Campos incompletos", "Completa los campos requeridos.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateTransaction(id!, {
        title: title.trim() || category.name,
        note: note.trim() || undefined,
        amount: parseFloat(amount),
        type,
        category_id: category.id,
        wallet_id: walletId,
        timestamp,
      });
      await refreshWallets();
      await refreshTransactions();
      Toast.success("¡Actualizado!", "Los cambios se guardaron.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo actualizar la transacción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteTransaction(id!);
      await refreshWallets();
      await refreshTransactions();
      Toast.success("Eliminada", "La transacción se eliminó.");
      router.back();
    } catch (e) {
      Toast.error("Error", "No se pudo eliminar la transacción.");
    } finally {
      setIsSubmitting(false);
      setShowDelete(false);
    }
  };

  const walletOptions = wallets.map((w: Wallet) => {
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

  const isIncome = type === "income";
  const dateStr = new Date(timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(timestamp).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <FormShell
        title="Editar transacción"
        subtitle={isIncome ? "Ingreso" : "Gasto"}
        saveLabel="Guardar cambios"
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
            <Text
              style={[styles.previewName, { color: theme.text }]}
              numberOfLines={1}
            >
              {title || category?.name || "Sin título"}
            </Text>
            <Text
              style={[styles.previewSub, { color: theme.textTer }]}
              numberOfLines={1}
            >
              {dateStr} · {timeStr}
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
            {isIncome ? "+" : "−"}${amount || "0"}
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
            placeholder={isIncome ? "Ej. Salario" : "Ej. Mercado Roma"}
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
            {filteredCategories.map((c) => {
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

        <FormGroup label="Cuenta">
          <PickerRow
            label={
              wallet?.last_four_digits
                ? `•••• ${wallet.last_four_digits}`
                : wallet?.bank ||
                  (wallet?.type === "credit" ? "Crédito" : "Cuenta")
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
                  <DesignIcon.Card
                    size={14}
                    color={wallet.color || "#0A84FF"}
                    strokeWidth={1.7}
                  />
                ) : (
                  <DesignIcon.Wallet
                    size={14}
                    color={wallet?.color || "#0A84FF"}
                    strokeWidth={1.7}
                  />
                )}
              </View>
            }
            onPress={() => setWalletPickerOpen(true)}
          />
        </FormGroup>

        <FormGroup label="Fecha y hora">
          <View style={styles.row2}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              activeOpacity={0.85}
            >
              <DesignIcon.Settings
                size={14}
                color={theme.textTer}
                strokeWidth={1.7}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textTer }]}>
                  Fecha
                </Text>
                <Text
                  style={[
                    styles.dateValue,
                    { color: theme.text, fontVariant: ["tabular-nums"] },
                  ]}
                  numberOfLines={1}
                >
                  {dateStr}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowClock(true)}
              style={[
                styles.dateBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              activeOpacity={0.85}
            >
              <DesignIcon.Settings
                size={14}
                color={theme.textTer}
                strokeWidth={1.7}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.textTer }]}>
                  Hora
                </Text>
                <Text
                  style={[
                    styles.dateValue,
                    { color: theme.text, fontVariant: ["tabular-nums"] },
                  ]}
                >
                  {timeStr}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </FormGroup>

        <FormGroup label="Nota (opcional)">
          <TextField
            placeholder="Detalles adicionales..."
            value={note}
            onChange={setNote}
          />
        </FormGroup>

        <InfoBox>
          Al actualizar, el saldo de la cuenta se ajustará en consecuencia.
        </InfoBox>

        <TouchableOpacity
          onPress={() => setShowDelete(true)}
          style={[styles.deleteBtn, { borderColor: theme.bad }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.deleteText, { color: theme.bad }]}>
            Eliminar transacción
          </Text>
        </TouchableOpacity>
      </FormShell>

      <ListPickerSheet
        visible={walletPickerOpen}
        title="Cuenta"
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
          value={new Date(timestamp)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            setShowDatePicker(Platform.OS === "ios");
            if (d) {
              const next = new Date(timestamp);
              next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setTimestamp(next.getTime());
            }
          }}
        />
      ) : null}

      <ClockTimePicker
        visible={showClock}
        initialDate={timestamp}
        onClose={() => setShowClock(false)}
        onConfirm={(ts) => setTimestamp(ts)}
      />

      <Modal visible={showDelete} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowDelete(false)}
          />
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              ¿Eliminar transacción?
            </Text>
            <Text style={[styles.modalText, { color: theme.textSec }]}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowDelete(false)}
                style={[
                  styles.modalBtn,
                  { backgroundColor: theme.surfaceAlt },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.modalBtn, { backgroundColor: theme.bad }]}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Eliminar
                </Text>
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
  row2: {
    flexDirection: "row",
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldLabel: { fontSize: 11 },
  dateValue: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  deleteBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
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
