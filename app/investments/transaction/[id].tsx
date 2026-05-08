import { Toast } from "@/components/ui/Toast";
import { DesignIcon } from "@/components/ui/Icon";
import FormShell from "@/components/views/forms/FormShell";
import { FormGroup, PickerRow } from "@/components/views/forms/FormFields";
import { ListPickerSheet } from "@/components/views/forms/PickerSheets";
import { useWallets } from "@/contexts/WalletsContext";
import { useInvestments } from "@/contexts/InvestmentsContext";
import { useTheme } from "@/theme/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Investment } from "@/lib/database/investmentService";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const INVESTMENT_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  bond: DesignIcon.Bond,
  bank: DesignIcon.Bank,
  piggy: DesignIcon.PiggyBank,
  wallet: DesignIcon.Wallet,
  trend: DesignIcon.TrendUp,
  cash: DesignIcon.Cash,
};

function InvestmentIcon({ iconId, size, color }: { iconId: string; size: number; color: string }) {
  const IconComponent = INVESTMENT_ICON_MAP[iconId] ?? DesignIcon.TrendUp;
  return <IconComponent size={size} color={color} strokeWidth={1.7} />;
}

export default function InvestmentTransactionScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: string }>();
  const router = useRouter();
  const { theme, accent } = useTheme();
  const { wallets, refreshWallets } = useWallets();
  const { investments, addToInvestment, withdrawFromInvestment, refreshInvestments } = useInvestments();

  const investment = investments.find(inv => inv.id === id);
  const isAdd = mode === "add";

  const [amount, setAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eligibleWallets = wallets.filter(w => w.type !== "credit");
  const targetWallet = investment?.wallet_id
    ? wallets.find(w => w.id === investment.wallet_id)
    : eligibleWallets.find(w => w.id === selectedWalletId);

  useEffect(() => {
    if (investment?.wallet_id) {
      setSelectedWalletId(investment.wallet_id);
    } else if (eligibleWallets.length === 1) {
      setSelectedWalletId(eligibleWallets[0].id);
    }
  }, [investment]);

  const amountNum = parseFloat(amount) || 0;
  const canSave = amountNum > 0 && (!investment?.wallet_id ? !!selectedWalletId : true) && !isSubmitting;

  const handleSave = async () => {
    if (!canSave) return;

    const walletId = investment?.wallet_id || selectedWalletId;
    if (!walletId) {
      Toast.warn("Selecciona una cuenta", "Elige la cuenta para la operacion.");
      return;
    }

    if (!isAdd && amountNum > (investment?.current_value || 0)) {
      Toast.warn("Saldo insuficiente", "No puedes retirar mas de lo disponible.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[InvestmentTransaction] addToInvestment:', typeof addToInvestment, 'withdrawFromInvestment:', typeof withdrawFromInvestment);
      console.log('[InvestmentTransaction] id:', id, 'amount:', amountNum, 'walletId:', walletId);
      if (isAdd) {
        await addToInvestment(id!, amountNum, walletId);
        Toast.success("Deposito exitoso", `Se agregaron $${amountNum.toLocaleString("es-MX")} a ${investment?.name}`);
      } else {
        await withdrawFromInvestment(id!, amountNum, walletId);
        Toast.success("Retiro exitoso", `Se retiraron $${amountNum.toLocaleString("es-MX")} de ${investment?.name}`);
      }
      await refreshWallets();
      await refreshInvestments();
      router.back();
    } catch (e: any) {
      console.error('[InvestmentTransaction] Error:', e);
      Toast.error("Error", e?.message || "No se pudo completar la operacion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!investment) {
    return (
      <FormShell
        title="Inversion no encontrada"
        saveLabel=""
        canSave={false}
        onClose={() => router.back()}
        onSave={() => {}}
      >
        <View style={styles.notFound}>
          <DesignIcon.Wallet size={48} color={theme.textTer} strokeWidth={1} />
          <Text style={{ color: theme.textSec, marginTop: 16 }}>No se encontro la inversion</Text>
        </View>
      </FormShell>
    );
  }

  const walletOptions = eligibleWallets.map(w => ({
    id: w.id,
    label: w.name,
    sub: `$${(w.net_balance || w.balance).toLocaleString("es-MX")}`,
    color: w.color,
  }));

  return (
    <>
      <FormShell
        title={isAdd ? `Agregar a ${investment.name}` : `Retirar de ${investment.name}`}
        saveLabel={isAdd ? "Confirmar deposito" : "Confirmar retiro"}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onClose={() => router.back()}
        onSave={handleSave}
      >
        <View style={[styles.balanceCard, { backgroundColor: investment.color + "22", borderColor: investment.color + "44", borderRadius: 20, padding: 20, marginBottom: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.invIcon, { backgroundColor: investment.color }]}>
              <InvestmentIcon iconId={investment.icon} size={22} color="#fff" />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: theme.textSec, letterSpacing: 0.5, fontWeight: "500" }}>SALDO DISPONIBLE</Text>
              <Text style={{ fontSize: 28, fontWeight: "600", color: theme.text, marginTop: 2 }}>
                ${investment.current_value.toLocaleString("es-MX")}
              </Text>
            </View>
          </View>
        </View>

        <FormGroup label="Monto">
          <View style={[styles.amountInput, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14 }]}>
            <Text style={{ fontSize: 24, fontWeight: "600", color: theme.textSec, marginRight: 4 }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              placeholderTextColor={theme.textTer}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontSize: 24, fontWeight: "600", color: theme.text }}
            />
            <Text style={{ fontSize: 14, color: theme.textSec, fontWeight: "500" }}>MXN</Text>
          </View>
          {!isAdd && amountNum > investment.current_value && (
            <Text style={{ color: theme.bad, fontSize: 12, marginTop: 6 }}>
              El monto excede el saldo disponible
            </Text>
          )}
        </FormGroup>

        {investment.wallet_id ? (
          <FormGroup label="Cuenta destino">
            <View style={[styles.walletCard, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, padding: 14 }]}>
              <View style={[styles.walletIcon, { backgroundColor: targetWallet?.color || theme.textSec }]}>
                <DesignIcon.Wallet size={20} color="#fff" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: theme.textSec, fontWeight: "500" }}>CUENTA VINCULADA</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginTop: 1 }}>
                  {targetWallet?.name}
                </Text>
              </View>
              <DesignIcon.Check size={18} color={theme.good} strokeWidth={2.5} />
            </View>
          </FormGroup>
        ) : (
          <FormGroup label="Cuenta destino">
            <PickerRow
              label="Cuenta para la operacion"
              value={targetWallet?.name || "Seleccionar"}
              onPress={() => setPickerOpen(true)}
            />
          </FormGroup>
        )}

        {amountNum > 0 && (
          <View style={[styles.preview, { backgroundColor: theme.surfaceAlt, borderRadius: 14, padding: 16, marginTop: 8 }]}>
            <Text style={{ fontSize: 13, color: theme.textSec }}>
              {isAdd ? "Vas a depositar" : "Vas a retirar"}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text, marginTop: 4 }}>
              ${amountNum.toLocaleString("es-MX")} MXN
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
              <DesignIcon.Chevron size={14} color={theme.textSec} strokeWidth={1.7} />
              <Text style={{ fontSize: 13, color: theme.textSec }}>
                {isAdd ? "Se agregara a la inversion" : "Se transferira a la cuenta"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <DesignIcon.Wallet size={14} color={theme.textSec} strokeWidth={1.7} />
              <Text style={{ fontSize: 13, color: theme.textSec }}>
                {targetWallet?.name || "Cuenta vinculada"}
              </Text>
            </View>
          </View>
        )}
      </FormShell>

      {!investment.wallet_id && (
        <ListPickerSheet
          visible={pickerOpen}
          title="Seleccionar cuenta"
          options={walletOptions}
          value={selectedWalletId || ""}
          onPick={(wid) => {
            setSelectedWalletId(wid);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderWidth: 1,
  },
  invIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {},
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});