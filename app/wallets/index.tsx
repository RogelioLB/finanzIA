import { useWallets } from "@/contexts/WalletsContext";
import { Wallet } from "@/lib/database/sqliteService";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { MXN } from "@/theme/format";
import AddAccountSheet, {
  AccountKind,
} from "@/components/views/forms/AddAccountSheet";

type GroupKey = "debit" | "credit" | "cash" | "wallet";

const GROUP_LABELS: Record<GroupKey, string> = {
  debit: "Débito",
  credit: "Crédito",
  cash: "Efectivo",
  wallet: "Billeteras",
};

function inferGroup(w: Wallet): GroupKey {
  if (w.type === "credit") return "credit";
  if (w.last_four_digits) return "debit";
  if (w.bank) return "debit";
  if (w.icon === "👛" || w.icon === "📱") return "wallet";
  if (w.icon === "💰" || w.icon === "🏧") return "cash";
  return "debit";
}

function pickIconComponent(group: GroupKey) {
  switch (group) {
    case "credit":
      return DesignIcon.Card;
    case "cash":
      return DesignIcon.Cash;
    case "wallet":
      return DesignIcon.Wallet;
    default:
      return DesignIcon.Bank;
  }
}

interface AccountCardProps {
  wallet: Wallet;
  group: GroupKey;
  hide: boolean;
  onPress: () => void;
}

function AccountCard({ wallet, group, hide, onPress }: AccountCardProps) {
  const { theme } = useTheme();
  const Ico = pickIconComponent(group);
  const isCredit = group === "credit";
  const balance = wallet.net_balance ?? wallet.balance;
  const absBal = Math.abs(balance);
  const limit = wallet.credit_limit || 0;
  const pct = isCredit && limit > 0 ? Math.min(1, absBal / limit) : null;
  const color = wallet.color || "#0A84FF";

  const display = hide ? "••••••" : MXN(absBal);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.cardRow}>
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: `${color}22` },
          ]}
        >
          <Ico size={18} color={color} strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
            {wallet.name}
          </Text>
          <Text style={[styles.cardSub, { color: theme.textTer }]} numberOfLines={1}>
            {wallet.last_four_digits
              ? `•••• ${wallet.last_four_digits}`
              : wallet.bank || (group === "cash" ? "Sin banco" : "")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.cardAmount,
              {
                color: isCredit ? theme.bad : theme.text,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {isCredit && !hide ? "−" : ""}
            {display}
          </Text>
          {isCredit && limit > 0 ? (
            <Text style={[styles.cardLimit, { color: theme.textTer }]}>
              de {hide ? "•••••" : MXN(limit)}
            </Text>
          ) : null}
        </View>
      </View>
      {isCredit && pct !== null ? (
        <View style={[styles.barTrack, { backgroundColor: theme.surfaceAlt }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct * 100}%`,
                backgroundColor: pct > 0.7 ? theme.bad : color,
              },
            ]}
          />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function WalletsScreen() {
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const { wallets, isLoading, refreshWallets } = useWallets();
  const [hideBalances, setHideBalances] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshWallets();
    }, [refreshWallets])
  );

  const compact = density === "compact";
  const pad = compact ? 16 : 20;

  const grouped = useMemo(() => {
    const groups: Record<GroupKey, Wallet[]> = {
      debit: [],
      credit: [],
      cash: [],
      wallet: [],
    };
    wallets.forEach((w) => {
      const g = inferGroup(w);
      groups[g].push(w);
    });
    return groups;
  }, [wallets]);

  const liquid = useMemo(
    () =>
      wallets
        .filter((w) => w.type !== "credit")
        .reduce((s, w) => s + (w.net_balance ?? w.balance), 0),
    [wallets]
  );
  const creditUsed = useMemo(
    () =>
      wallets
        .filter((w) => w.type === "credit")
        .reduce((s, w) => s + Math.abs(w.net_balance ?? w.balance), 0),
    [wallets]
  );
  const creditLimit = useMemo(
    () =>
      wallets
        .filter((w) => w.type === "credit")
        .reduce((s, w) => s + (w.credit_limit || 0), 0),
    [wallets]
  );

  const masked = (v: string) => (hideBalances ? "••••••" : v);

  const handlePick = (kind: AccountKind) => {
    setAddSheetOpen(false);
    setTimeout(() => {
      switch (kind) {
        case "wallet":
          router.push("/wallets/add-wallet");
          break;
        case "credit":
          router.push("/credit-cards/add");
          break;
        case "debt":
          router.push("/objectives/add-debt");
          break;
        case "invest":
          router.push("/investments/add");
          break;
      }
    }, 220);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.bg }]}
      edges={["top"]}
    >
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}
        >
          <DesignIcon.Back size={18} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cuentas</Text>
        <TouchableOpacity
          onPress={() => setHideBalances((h) => !h)}
          style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt }]}
        >
          {hideBalances ? (
            <DesignIcon.EyeOff size={16} color={theme.text} strokeWidth={1.7} />
          ) : (
            <DesignIcon.Eye size={16} color={theme.text} strokeWidth={1.7} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: pad, paddingTop: 8, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View
          style={[
            styles.summary,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              padding: compact ? 16 : 20,
            },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: theme.textSec }]}>
            LÍQUIDO DISPONIBLE
          </Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: theme.text, fontVariant: ["tabular-nums"] },
            ]}
          >
            {masked(MXN(liquid))}
          </Text>
          <View style={styles.summarySplit}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summarySubLabel, { color: theme.textTer }]}>
                Crédito usado
              </Text>
              <Text
                style={[
                  styles.summarySubValue,
                  { color: theme.text, fontVariant: ["tabular-nums"] },
                ]}
              >
                {masked(MXN(creditUsed))}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summarySubLabel, { color: theme.textTer }]}>
                Disponible
              </Text>
              <Text
                style={[
                  styles.summarySubValue,
                  { color: theme.textSec, fontVariant: ["tabular-nums"] },
                ]}
              >
                {masked(MXN(Math.max(0, creditLimit - creditUsed)))}
              </Text>
            </View>
          </View>
        </View>

        {/* Loading state */}
        {isLoading && wallets.length === 0 ? (
          <View style={styles.loading}>
            <Text style={[styles.loadingText, { color: theme.textSec }]}>
              Cargando cuentas...
            </Text>
          </View>
        ) : null}

        {/* Groups */}
        {(Object.keys(grouped) as GroupKey[]).map((g) =>
          grouped[g].length > 0 ? (
            <View key={g} style={{ marginBottom: 16 }}>
              <Text style={[styles.groupLabel, { color: theme.textTer }]}>
                {GROUP_LABELS[g]}
              </Text>
              <View style={{ gap: 8 }}>
                {grouped[g].map((w) => (
                  <AccountCard
                    key={w.id}
                    wallet={w}
                    group={g}
                    hide={hideBalances}
                    onPress={() =>
                      router.push(
                        g === "credit"
                          ? `/credit-cards/edit/${w.id}`
                          : `/wallets/${w.id}`
                      )
                    }
                  />
                ))}
              </View>
            </View>
          ) : null
        )}

        {/* Add new */}
        <TouchableOpacity
          onPress={() => setAddSheetOpen(true)}
          style={[styles.addBtn, { borderColor: theme.borderStrong }]}
          activeOpacity={0.7}
        >
          <DesignIcon.Plus size={18} color={theme.text} strokeWidth={2} />
          <Text style={[styles.addBtnText, { color: theme.text }]}>
            Agregar cuenta
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddAccountSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onPick={handlePick}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  summary: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: -1.4,
    marginBottom: 14,
  },
  summarySplit: { flexDirection: "row", gap: 14 },
  summarySubLabel: { fontSize: 11, marginBottom: 3 },
  summarySubValue: { fontSize: 14, fontWeight: "500" },
  divider: { width: 1 },
  groupLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 8,
    fontWeight: "500",
  },
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2 },
  cardSub: { fontSize: 11, marginTop: 1 },
  cardAmount: { fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
  cardLimit: { fontSize: 10, marginTop: 2 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%" },
  addBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: "500" },
  loading: { padding: 20, alignItems: "center" },
  loadingText: { fontSize: 14 },
});
