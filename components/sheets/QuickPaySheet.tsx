import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN } from '@/theme/format';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useSQLiteService } from '@/lib/database/sqliteService';
import {
  calculateNextPaymentDate,
  updateSubscription,
} from '@/lib/database/subscriptionService';
import { Subscription } from '@/lib/models/types';

interface QuickPaySheetProps {
  visible: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickPaySheet({ visible, subscription, onClose, onSuccess }: QuickPaySheetProps) {
  const { theme, accent, fabIconColor } = useTheme();
  const db = useSQLiteContext();
  const { createTransaction } = useSQLiteService();
  const { refreshSubscriptions } = useSubscriptions();
  const { refreshTransactions } = useTransactions();
  const { refreshWallets } = useWallets();

  const [isProcessing, setIsProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 260 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!subscription || isProcessing) return;
    setIsProcessing(true);
    try {
      const sub = subscription as any;
      const isIncome = subscription.type === 'income';

      await createTransaction({
        wallet_id: subscription.account_id,
        amount: subscription.amount,
        type: subscription.type as 'expense' | 'income',
        title: subscription.name,
        category_id: subscription.category_id,
        timestamp: Date.now(),
        is_subscription: 0,
        is_excluded: 0,
      });

      const nextDate = calculateNextPaymentDate(
        subscription.frequency,
        new Date(subscription.next_payment_date)
      );

      await updateSubscription(db, subscription.id, { next_payment_date: nextDate });

      await Promise.all([
        refreshWallets(),
        refreshTransactions(),
        refreshSubscriptions(),
      ]);

      onSuccess();
    } catch (e) {
      console.error('[QuickPaySheet] Error al registrar pago:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!subscription) return null;

  const sub = subscription as any;
  const isIncome = subscription.type === 'income';
  const accentColor = sub.wallet_color || accent;
  const nextDateStr = new Date(subscription.next_payment_date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            Registrar {isIncome ? 'ingreso' : 'pago'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <DesignIcon.Close size={20} color={theme.textSec} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Subscription info */}
        <View style={[styles.infoCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: `${accentColor}22` }]}>
            <DesignIcon.Bolt size={22} color={accentColor} strokeWidth={1.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subName, { color: theme.text }]} numberOfLines={1}>
              {subscription.name}
            </Text>
            <Text style={[styles.subMeta, { color: theme.textTer }]}>
              {sub.wallet_name || 'Sin cuenta'} · Próx. {nextDateStr}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: theme.textSec }]}>Monto a registrar</Text>
          <Text style={[styles.amountValue, { color: isIncome ? theme.good : theme.text }]}>
            {isIncome ? '+' : ''}{MXN(Math.abs(subscription.amount))}
          </Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: isIncome ? theme.good : accent, opacity: isProcessing ? 0.6 : 1 }]}
          onPress={handleConfirm}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: isIncome ? '#fff' : fabIconColor }]}>
            {isProcessing ? 'Registrando…' : isIncome ? 'Registrar ingreso' : 'Confirmar pago'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  subMeta: {
    fontSize: 12,
  },
  amountRow: {
    alignItems: 'center',
    marginBottom: 22,
    gap: 6,
  },
  amountLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -1.5,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
