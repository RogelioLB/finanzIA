import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useAddTransaction } from '@/hooks/useAddTransaction';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/contexts/WalletsContext';
import { useTheme } from '@/theme/ThemeProvider';
import { useTransactions } from '@/contexts/TransactionsContext';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN, MXN_decimal } from '@/theme/format';
import { Wallet } from '@/lib/database/sqliteService';

function CategoryIcon({ name, size, color }: { name?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  const n = (name || '').toLowerCase();
  if (n.includes('comida') || n.includes('restaurante') || n.includes('food')) return <DesignIcon.Food {...props} />;
  if (n.includes('transporte') || n.includes('auto') || n.includes('uber')) return <DesignIcon.Transport {...props} />;
  if (n.includes('entrete') || n.includes('ocio') || n.includes('fun')) return <DesignIcon.Fun {...props} />;
  if (n.includes('compra') || n.includes('ropa') || n.includes('tienda')) return <DesignIcon.Bag {...props} />;
  if (n.includes('servicio') || n.includes('luz') || n.includes('electric')) return <DesignIcon.Bolt {...props} />;
  if (n.includes('salud') || n.includes('médico') || n.includes('farmac')) return <DesignIcon.Health {...props} />;
  if (n.includes('casa') || n.includes('rent') || n.includes('hogar')) return <DesignIcon.Home2 {...props} />;
  if (n.includes('educ') || n.includes('escuela') || n.includes('curso')) return <DesignIcon.Education {...props} />;
  if (n.includes('mascot') || n.includes('pet')) return <DesignIcon.Pet {...props} />;
  if (n.includes('salario') || n.includes('sueldo') || n.includes('pago')) return <DesignIcon.Cash {...props} />;
  if (n.includes('freelance') || n.includes('trabajo') || n.includes('proyecto')) return <DesignIcon.Phone {...props} />;
  if (n.includes('inversi') || n.includes('bolsa') || n.includes('acciones')) return <DesignIcon.TrendUp {...props} />;
  if (n.includes('regalo') || n.includes('gift')) return <DesignIcon.Health {...props} />;
  if (n.includes('reembolso') || n.includes('devoluci')) return <DesignIcon.Cash {...props} />;
  return <DesignIcon.List {...props} />;
}

function WalletIcon({ type, size, color }: { type?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  return type === 'credit' ? <DesignIcon.Card {...props} /> : <DesignIcon.Wallet {...props} />;
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const { theme, accent, fabIconColor, numpadStyle } = useTheme();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { createTransaction, resetTransaction } = useAddTransaction();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const snapPoints = useMemo(() => ['48%'], []);

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  const selectedWallet = useMemo(() => wallets.find(w => w.id === walletId) || wallets[0] || null, [wallets, walletId]);

  const handlePress = useCallback((key: string) => {
    setAmount(prev => {
      if (key === '⌫') {
        if (prev.length <= 1) return '';
        return prev.slice(0, -1);
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '' && key !== '.') return key;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto válido');
      return;
    }
    if (!categoryId) {
      Alert.alert('Categoría requerida', 'Por favor selecciona una categoría');
      return;
    }
    const wallet = wallets.find(w => w.id === walletId) || wallets[0];
    if (!wallet) {
      Alert.alert('Cuenta requerida', 'No tienes ninguna cuenta configurada');
      return;
    }
    const cat = categories.find(c => c.id === categoryId) || null;

    const timestamp = Date.now();
    const success = await createTransaction(timestamp, {
      amount: numAmount.toString(),
      wallet,
      category: cat,
      note,
      title: cat?.name || 'Gasto',
      type: 'expense',
    });
    if (success) {
      resetTransaction();
      setAmount('');
      setCategoryId('');
      setNote('');
      router.back();
    } else {
      Alert.alert('No se pudo guardar', 'Revisa el monto, la cuenta seleccionada o el saldo disponible.');
    }
  }, [amount, categoryId, walletId, wallets, categories, note, createTransaction, resetTransaction, router]);

  const layout = numpadStyle === 'phone'
    ? ['1','2','3','4','5','6','7','8','9','.','0','⌫']
    : ['7','8','9','4','5','6','1','2','3','.','0','⌫'];

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.15} />,
    []
  );

  const toggleVoice = () => {
    setListening(true);
    setTimeout(() => {
      setAmount('245');
      setCategoryId(categories[0]?.id || '');
      setNote('Gasto rápido');
      setListening(false);
    }, 1800);
  };

  const formattedAmount = (() => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    const parts = num.toFixed(2).split('.');
    const intFmt = parseInt(parts[0]).toLocaleString('es-MX');
    return `${intFmt}.${parts[1]}`;
  })();

  const walletBalance = selectedWallet
    ? (selectedWallet.net_balance ?? selectedWallet.balance)
    : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <DesignIcon.Close size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nuevo gasto</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Formulario de detalle (encima del numpad) */}
      <View style={[styles.formArea, { backgroundColor: theme.bg }]}>
        {/* Monto */}
        <View style={styles.amountRow}>
          <Text style={{ color: theme.textTer, fontSize: 28 }}>$</Text>
          <Text style={[styles.amount, { color: amount === '' ? theme.textTer : theme.text }]}>
            {formattedAmount}
          </Text>
        </View>

        {/* Selector de cuenta */}
        <TouchableOpacity
          onPress={() => setWalletPickerOpen(true)}
          style={[styles.walletSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
          activeOpacity={0.75}
        >
          <View style={styles.walletSelectorLeft}>
            <View style={[styles.walletIconBox, { backgroundColor: selectedWallet?.color ? `${selectedWallet.color}20` : theme.surfaceAlt }]}>
              <WalletIcon type={selectedWallet?.type} size={20} color={selectedWallet?.color || accent} />
            </View>
            <View>
              <Text style={[styles.walletSelectorName, { color: theme.text }]}>
                {selectedWallet?.name || 'Sin cuenta'}
              </Text>
              <Text style={[styles.walletSelectorBal, { color: selectedWallet?.type === 'credit' ? theme.bad : theme.textSec }]}>
                {selectedWallet?.type === 'credit' ? 'Disponible: ' : 'Saldo: '}
                {selectedWallet?.type === 'credit'
                  ? MXN((selectedWallet.available_credit ?? 0))
                  : MXN(walletBalance)}
              </Text>
            </View>
          </View>
          <View style={styles.walletSelectorRight}>
            <Text style={[styles.walletSelectorHint, { color: theme.textTer }]}>Cambiar</Text>
            <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={1.5} />
          </View>
        </TouchableOpacity>

        {/* Categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesRow}>
            {categories.slice(0, 8).map((cat) => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[
                    styles.catChip,
                    { backgroundColor: active ? `${accent}1A` : 'transparent', borderColor: active ? accent : theme.border }
                  ]}
                >
                  <CategoryIcon name={cat.name} size={18} color={active ? accent : theme.textSec} />
                  <Text style={{ color: active ? accent : theme.textSec, fontSize: 10, fontWeight: '500' }}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Nota */}
        <View style={styles.noteRow}>
          {noteOpen ? (
            <TextInput
              autoFocus
              value={note}
              onChangeText={setNote}
              placeholder="Nota…"
              placeholderTextColor={theme.textTer}
              style={[styles.noteInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setNoteOpen(true)}
              style={[styles.noteBtn, { borderColor: theme.borderStrong }]}
            >
              <Text style={{ color: theme.textSec, fontSize: 12 }}>+ Agregar nota</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom sheet con numpad */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: theme.borderStrong }}
      >
        <BottomSheetView style={styles.numpadContainer}>
          <View style={styles.numpad}>
            {layout.map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => handlePress(k)}
                style={[styles.numpadBtn, { backgroundColor: theme.surfaceAlt }]}
              >
                {k === '⌫' ? (
                  <DesignIcon.Backspace size={20} color={theme.text} strokeWidth={1.7} />
                ) : (
                  <Text style={[styles.numpadKey, { color: theme.text }]}>{k}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={toggleVoice}
              style={[styles.voiceBtn, { backgroundColor: listening ? accent : theme.surface, borderColor: theme.border }]}
            >
              <DesignIcon.Mic size={20} color={listening ? fabIconColor : theme.text} strokeWidth={1.7} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!amount || parseFloat(amount) <= 0}
              style={[
                styles.saveBtn,
                { backgroundColor: amount && parseFloat(amount) > 0 ? accent : theme.surfaceAlt }
              ]}
            >
              <Text style={{
                color: amount && parseFloat(amount) > 0 ? fabIconColor : theme.textTer,
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: -0.2
              }}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Modal picker de cuenta */}
      <Modal
        visible={walletPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setWalletPickerOpen(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.borderStrong }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar cuenta</Text>
          <FlatList
            data={wallets}
            keyExtractor={w => w.id}
            renderItem={({ item: w }) => {
              const bal = w.net_balance ?? w.balance;
              const selected = w.id === walletId;
              return (
                <TouchableOpacity
                  onPress={() => { setWalletId(w.id); setWalletPickerOpen(false); }}
                  style={[
                    styles.walletPickerRow,
                    {
                      backgroundColor: selected ? `${accent}12` : 'transparent',
                      borderColor: selected ? accent : theme.border,
                    }
                  ]}
                >
                  <View style={[styles.walletIconBox, { backgroundColor: w.color ? `${w.color}20` : theme.surfaceAlt }]}>
                    <WalletIcon type={w.type} size={20} color={w.color || accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.walletPickerName, { color: theme.text }]}>{w.name}</Text>
                    <Text style={[styles.walletPickerBal, { color: w.type === 'credit' ? theme.bad : theme.textSec }]}>
                      {w.type === 'credit'
                        ? `Disponible: ${MXN(w.available_credit ?? 0)}`
                        : `Saldo: ${MXN(bal)}`}
                    </Text>
                  </View>
                  {selected && (
                    <View style={[styles.checkDot, { backgroundColor: accent }]} />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            contentContainerStyle={{ padding: 16 }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  amount: {
    fontSize: 52,
    fontWeight: '600',
    letterSpacing: -2.5,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  walletSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletSelectorName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  walletSelectorBal: {
    fontSize: 11,
    marginTop: 1,
  },
  walletSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletSelectorHint: {
    fontSize: 12,
  },
  categoriesScroll: {
    height: 70,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  catChip: {
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 6,
    minWidth: 64,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 5,
  },
  noteRow: {
    paddingVertical: 10,
  },
  noteInput: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  noteBtn: {
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  numpadBtn: {
    width: '31%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKey: {
    fontSize: 22,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  voiceBtn: {
    width: 56,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal estilos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 8,
    letterSpacing: -0.2,
  },
  walletPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  walletPickerName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  walletPickerBal: {
    fontSize: 12,
    marginTop: 2,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
