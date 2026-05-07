import { DesignIcon } from "@/components/ui/Icon";
import { useTheme } from "@/theme/ThemeProvider";
import { getFabContrast } from "@/theme/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { currencies, Currency } from "@/constants/currencies";
import { Wallet } from "@/lib/database/sqliteService";

interface WalletInfoHeaderProps {
  wallet: Wallet;
}

const EMOJI_TO_ICON: Record<string, keyof typeof import("@/components/ui/Icon").DesignIcon> = {
  "🏦": "Bank", "💳": "Card", "💰": "Cash", "👛": "Wallet",
  "🐷": "PiggyBank", "📈": "Stocks", "🪙": "Crypto", "🛍️": "Bag",
  "⚡": "Bolt", "🏠": "Home2", "📱": "Phone", "🎓": "Education",
};

export default function WalletInfoHeader({ wallet }: WalletInfoHeaderProps) {
  const router = useRouter();
  const { theme, accent } = useTheme();

  const sym = currencies.find((c: Currency) => c.code === wallet.currency)?.symbol || "$";
  const balance = wallet.net_balance ?? wallet.balance;
  const balanceColor = balance >= 0 ? theme.good : theme.bad;

  const iconKey = EMOJI_TO_ICON[wallet.icon || ""] as string | undefined;
  const Ico = iconKey ? (DesignIcon as any)[iconKey] : null;
  const cardContrast = getFabContrast(wallet.color || accent);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={["top"]}>
      {/* Nav bar */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <DesignIcon.Back size={18} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Detalles de cuenta</Text>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => router.push(`/wallets/edit-wallet/${wallet.id}` as any)}
          hitSlop={8}
        >
          <DesignIcon.Settings size={18} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={[styles.heroCard, { backgroundColor: wallet.color || accent }]}>
        <View style={styles.heroTop}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            {Ico ? (
              <Ico size={26} color={cardContrast} strokeWidth={1.5} />
            ) : (
              <Text style={styles.iconEmoji}>{wallet.icon || "🏦"}</Text>
            )}
          </View>
          <View style={styles.heroMeta}>
            <Text style={[styles.heroName, { color: cardContrast }]} numberOfLines={1}>
              {wallet.name}
            </Text>
            {(wallet as any).bank && (
              <Text style={[styles.heroBank, { color: `${cardContrast}99` }]}>
                {(wallet as any).bank}
                {(wallet as any).last_four_digits ? ` · •••• ${(wallet as any).last_four_digits}` : ""}
              </Text>
            )}
          </View>
          <View style={[styles.currencyBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Text style={[styles.currencyText, { color: cardContrast }]}>{wallet.currency}</Text>
          </View>
        </View>

        <Text style={[styles.heroBalance, { color: cardContrast }]}>
          {sym}{Math.abs(balance).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.heroBalanceLabel, { color: `${cardContrast}80` }]}>
          Balance actual
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { zIndex: 10 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: { fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 26 },
  heroMeta: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: "700", letterSpacing: -0.4 },
  heroBank: { fontSize: 12, marginTop: 2 },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  currencyText: { fontSize: 12, fontWeight: "600" },
  heroBalance: { fontSize: 36, fontWeight: "700", letterSpacing: -1 },
  heroBalanceLabel: { fontSize: 12, marginTop: 2 },
});
