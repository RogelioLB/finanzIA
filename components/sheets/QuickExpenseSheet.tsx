import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN } from '@/theme/format';
import { useAddTransaction } from '@/hooks/useAddTransaction';
import { useCategories } from '@/hooks/useCategories';
import { useWallets } from '@/contexts/WalletsContext';
import { Toast } from '@/components/ui/Toast';
import ClockTimePicker from '@/components/views/forms/ClockTimePicker';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/services/voice/transcriptionService';
import { parseVoiceTransaction, Category } from '@/lib/services/voice/transactionParserService';

const AI_CONFIG_KEY = 'ai_config';

interface QuickExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
}

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
  if (n.includes('freelance') || n.includes('trabajo') || n.includes('proyecto') || n.includes('servicio')) return <DesignIcon.Phone {...props} />;
  if (n.includes('inversi') || n.includes('bolsa') || n.includes('acciones') || n.includes('crypto')) return <DesignIcon.Stocks {...props} />;
  if (n.includes('salario') || n.includes('sueldo') || n.includes('ingreso')) return <DesignIcon.Cash {...props} />;
  if (n.includes('otro') || n.includes('otros')) return <DesignIcon.Dots {...props} />;
  return <DesignIcon.Bag {...props} />;
}

export default function QuickExpenseSheet({ visible, onClose }: QuickExpenseSheetProps) {
  const { theme, accent, numpadStyle, fabIconColor } = useTheme();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { createTransaction, resetTransaction } = useAddTransaction();

  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [listening, setListening] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    isRecording,
    startRecording,
    stopRecordingOnSilence,
    stopRecording,
    requestPermission,
  } = useVoiceRecorder();

  const toggleRef = useRef<View>(null);
  const expenseBtnRef = useRef<View>(null);
  const incomeBtnRef = useRef<View>(null);
  const togglePos = useSharedValue(0);
  const toggleWidth = useSharedValue(50);
  const pulseAnim = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const isIncome = kind === 'income';

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === 'income'),
    [categories]
  );

  useEffect(() => {
    if (visible) {
      togglePos.value = 0;
      expenseBtnRef.current?.measureLayout(toggleRef.current as any, (x: number, _y: number, width: number) => {
        toggleWidth.value = width;
        togglePos.value = x - 4;
      });
    }
  }, [visible]);

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  useEffect(() => {
    if (kind === 'income') {
      incomeBtnRef.current?.measureLayout(toggleRef.current as any, (x: number, _y: number, width: number) => {
        togglePos.value = withSpring(x - 4, { damping: 15, stiffness: 150 });
        toggleWidth.value = withSpring(width, { damping: 15, stiffness: 150 });
      });
    } else {
      expenseBtnRef.current?.measureLayout(toggleRef.current as any, (x: number, _y: number, width: number) => {
        togglePos.value = withSpring(x - 4, { damping: 15, stiffness: 150 });
        toggleWidth.value = withSpring(width, { damping: 15, stiffness: 150 });
      });
    }
  }, [kind]);

  const toggleBgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: togglePos.value }],
    width: toggleWidth.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: pulseOpacity.value,
  }));

  const handleVoiceRecording = async () => {
    if (listening) {
      await stopRecording();
      return;
    }
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        Toast.error('Sin permiso', 'Por favor permite el acceso al micrófono');
        return;
      }

      setListening(true);
      await startRecording();
    } catch (error) {
      console.error('[QuickExpense] Voice recording error:', error);
      setListening(false);
      Toast.error('Error', 'No se pudo iniciar la grabación');
    }
  };

  const processVoiceTransaction = async (audioUri: string, apiKey: string) => {
    try {
      setIsTranscribing(true);

      const text = await transcribeAudio(audioUri, apiKey);
      
      if (!text || text.trim().length < 3) {
        Toast.error('Sin audio', 'No se entendió la grabación. Intenta de nuevo.');
        return;
      }
      
      const categoryList: Category[] = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));

      const result = await parseVoiceTransaction(text, apiKey, categoryList);

      const numAmount = parseFloat(result.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        Toast.error('Sin monto', 'No se detectó un monto válido. Intenta de nuevo.');
        return;
      }

      setAmount(result.amount);
      
      if (result.categoryId) {
        setCategoryId(result.categoryId);
      } else {
        const matchedCategory = categories.find(
          c => c.name === result.category && c.type === result.type
        );
        if (matchedCategory) {
          setCategoryId(matchedCategory.id);
        }
      }

      if (result.note) {
        setNote(result.note);
        setNoteOpen(true);
      }

      if (result.type !== kind) {
        setKind(result.type);
      }

      Toast.success('Listo', `Transacción: ${result.amount} - ${result.category}`);
    } catch (error) {
      console.error('[QuickExpense] Transcription error:', error);
      Toast.error('Error', 'No se pudo procesar la voz');
    } finally {
      setIsTranscribing(false);
      setListening(false);
    }
  };

  useEffect(() => {
    if (listening && isRecording && !isTranscribing) {
      pulseAnim.value = withSpring(1.15, { damping: 10, stiffness: 100 });
      pulseOpacity.value = withSpring(0.6, { damping: 10, stiffness: 100 });
      const stopPromise = stopRecordingOnSilence({ silenceThresholdMs: 1500 });
      stopPromise.then(async (audioUri) => {
        if (!listening) return;
        if (audioUri) {
          try {
            const stored = await AsyncStorage.getItem(AI_CONFIG_KEY);
            if (stored) {
              const config = JSON.parse(stored);
              const apiKey = config.openaiApiKey || config.anthropicApiKey;
              if (apiKey) {
                await processVoiceTransaction(audioUri, apiKey);
              } else {
                Toast.error('Sin API key', 'Configura tu API key de IA en Ajustes');
                setListening(false);
              }
            } else {
              Toast.error('Sin API key', 'Configura tu API key de IA en Ajustes');
              setListening(false);
            }
          } catch (error) {
            console.error('[QuickExpense] Stop recording error:', error);
            setListening(false);
          }
        }
      });
      return () => {
        stopRecording();
      };
    }
  }, [listening, isRecording, isTranscribing]);

  useEffect(() => {
    if (listening && isRecording) {
      const interval = setInterval(() => {
        pulseAnim.value = withSpring(pulseAnim.value === 1 ? 1.15 : 1, { damping: 10, stiffness: 100 });
        pulseOpacity.value = withSpring(pulseOpacity.value === 0 ? 0.6 : 0, { damping: 10, stiffness: 100 });
      }, 800);
      return () => clearInterval(interval);
    } else if (!listening) {
      pulseAnim.value = withSpring(1);
      pulseOpacity.value = withSpring(0);
    }
  }, [listening, isRecording]);

  const selectedWallet = useMemo(
    () => wallets.find(w => w.id === walletId) || wallets[0] || null,
    [wallets, walletId]
  );

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const handlePress = useCallback((key: string) => {
    setAmount(prev => {
      if (key === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (key === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0' && key !== '.') return key;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.length >= 10) return prev;
      return prev + key;
    });
  }, []);

  const handleClose = useCallback(() => {
    setAmount('0');
    setCategoryId('');
    setNote('');
    setNoteOpen(false);
    setShowAccountPicker(false);
    setKind('expense');
    setListening(false);
    setTimestamp(Date.now());
    setShowDatePicker(false);
    setShowClock(false);
    resetTransaction();
    onClose();
  }, [onClose, resetTransaction]);

  const handleSave = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Toast.error('Monto inválido', 'Por favor ingresa un monto válido');
      return;
    }
    if (!categoryId) {
      Toast.error('Categoría requerida', 'Selecciona una categoría');
      return;
    }
    if (!selectedWallet) {
      Toast.error('Sin cuenta', 'No tienes ninguna cuenta configurada');
      return;
    }
    const cat = selectedCategory;
    const success = await createTransaction(timestamp, {
      amount: amount,
      wallet: selectedWallet,
      category: cat,
      note,
      title: kind === 'income' ? (note || cat?.name || 'Ingreso') : (cat?.name || 'Gasto'),
      type: kind,
    });
    if (success) {
      handleClose();
    } else {
      Toast.error('No se pudo guardar', 'Revisa el monto o la cuenta seleccionada');
    }
  }, [amount, kind, categoryId, selectedWallet, selectedCategory, note, timestamp, createTransaction, handleClose]);

  const toggleVoice = () => handleVoiceRecording();

  const layout = numpadStyle === 'phone'
    ? ['1','2','3','4','5','6','7','8','9','.','0','⌫']
    : ['7','8','9','4','5','6','1','2','3','.','0','⌫'];

  const formattedAmount = (() => {
    const [int, dec] = amount.split('.');
    const intFmt = parseInt(int || '0').toLocaleString('es-MX');
    return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
  })();

  const sign = isIncome ? '+' : '−';
  const signColor = isIncome ? theme.good : theme.bad;
  const valid = parseFloat(amount) > 0;

  const walletIcon = (type?: string) => {
    if (type === 'credit') return DesignIcon.Card;
    if (type === 'cash') return DesignIcon.Cash;
    return DesignIcon.Wallet;
  };
  const WalletIconComp = walletIcon(selectedWallet?.type);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
        <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: theme.textSec }]}>Nueva transacción</Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}>
            <DesignIcon.Close size={16} color={theme.text} strokeWidth={1.7} />
          </TouchableOpacity>
        </View>

        <View ref={toggleRef} style={[styles.kindToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Animated.View style={[styles.toggleBg, { backgroundColor: isIncome ? theme.good : accent }, toggleBgStyle]} />
          <TouchableOpacity ref={expenseBtnRef} onPress={() => setKind('expense')} style={styles.kindBtn}>
            <Text style={[styles.kindLabel, { color: kind === 'expense' ? fabIconColor : theme.text }]}>Gasto</Text>
          </TouchableOpacity>
          <TouchableOpacity ref={incomeBtnRef} onPress={() => setKind('income')} style={styles.kindBtn}>
            <Text style={[styles.kindLabel, { color: kind === 'income' ? '#0A0A0A' : theme.text }]}>Ingreso</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountSign, { color: theme.textTer }]}>{sign}$</Text>
          <Text style={[styles.amountValue, { color: amount === '0' ? theme.textTer : signColor }]}>
            {formattedAmount}
          </Text>
        </View>

        <View style={[styles.accountPickerWrap, { paddingHorizontal: 18, marginBottom: 10 }]}>
          <TouchableOpacity
            onPress={() => setShowAccountPicker(s => !s)}
            style={[styles.accountBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.accountIconWrap, { backgroundColor: selectedWallet?.color ? `${selectedWallet.color}22` : theme.surfaceAlt }]}>
              <WalletIconComp size={15} color={selectedWallet?.color || accent} strokeWidth={1.7} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountLabel, { color: theme.textTer }]}>
                {isIncome ? 'A cuenta' : 'Pagar con'}
              </Text>
              <Text style={[styles.accountName, { color: theme.text }]}>
                {selectedWallet?.name || 'Sin cuenta'}
              </Text>
            </View>
            <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={1.7} />
          </TouchableOpacity>
          {showAccountPicker && (
            <View style={[styles.accountList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {wallets.map((w, i) => {
                const WI = walletIcon(w.type);
                const sel = walletId === w.id;
                const bal = w.balance ?? 0;
                return (
                  <TouchableOpacity key={w.id} onPress={() => { setWalletId(w.id); setShowAccountPicker(false); }} style={styles.accountListRow}>
                    <View style={[styles.accountIconWrap, { backgroundColor: w.color ? `${w.color}22` : theme.surfaceAlt }]}>
                      <WI size={14} color={w.color || accent} strokeWidth={1.7} />
                    </View>
                    <Text style={[styles.accountListName, { color: theme.text, flex: 1 }]}>{w.name}</Text>
                    <Text style={[styles.accountListBal, { color: theme.textTer }]}>{MXN(Math.abs(bal))}</Text>
                    {sel && <DesignIcon.Check size={14} color={accent} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {!isIncome && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catsScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {expenseCategories.slice(0, 9).map(cat => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[styles.catChip, { backgroundColor: active ? `${accent}1A` : 'transparent', borderColor: active ? accent : theme.border }]}
                >
                  <View style={styles.catIconWrap}>
                    <CategoryIcon name={cat.name} size={18} color={active ? accent : theme.text} />
                  </View>
                  <Text style={[styles.catLabel, { color: active ? accent : theme.textSec }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {isIncome && incomeCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catsScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {incomeCategories.slice(0, 9).map(cat => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[styles.catChip, { backgroundColor: active ? `${accent}1A` : 'transparent', borderColor: active ? accent : theme.border }]}
                >
                  <View style={styles.catIconWrap}>
                    <CategoryIcon name={cat.name} size={18} color={active ? accent : theme.text} />
                  </View>
                  <Text style={[styles.catLabel, { color: active ? accent : theme.textSec }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: 18, marginBottom: 10, flexDirection: 'row', gap: 8 }}>
          {noteOpen ? (
            <TextInput
              autoFocus
              value={note}
              onChangeText={setNote}
              placeholder={isIncome ? 'Concepto…' : 'Nota…'}
              placeholderTextColor={theme.textTer}
              style={[styles.noteInput, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setNoteOpen(true)}
              style={[styles.noteBtn, { flex: 1, borderColor: theme.borderStrong }]}
            >
              <Text style={{ color: theme.textSec, fontSize: 12 }}>
                + {isIncome ? 'Concepto' : 'Nota'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.dateChipText, { color: theme.text, fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
              {new Date(timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowClock(true)}
            style={[styles.dateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.dateChipText, { color: theme.text, fontVariant: ['tabular-nums'] }]}>
              {new Date(timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.numpad}>
          {layout.map(k => (
            <TouchableOpacity
              key={k}
              onPress={() => handlePress(k)}
              style={[styles.numpadBtn, { backgroundColor: theme.surface }]}
            >
              {k === '⌫'
                ? <DesignIcon.Backspace size={20} color={theme.text} strokeWidth={1.7} />
                : <Text style={[styles.numpadTxt, { color: theme.text }]}>{k}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={toggleVoice} 
            disabled={isTranscribing}
            style={[
              styles.micBtn, 
              { backgroundColor: isTranscribing ? theme.surfaceAlt : theme.surface },
              isTranscribing && styles.micBtnDisabled
            ]}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <>
                <Animated.View style={[styles.pulseRing, styles.pulseRingOuter, { borderColor: accent }, pulseStyle]} />
                <Animated.View style={[styles.pulseRing, styles.pulseRingInner, { backgroundColor: accent + '30' }, pulseStyle]} />
                {listening ? (
                  <DesignIcon.Square size={20} color="#fff" strokeWidth={0} />
                ) : (
                  <DesignIcon.Mic 
                    size={22} 
                    color={isTranscribing ? theme.textTer : theme.text} 
                    strokeWidth={1.7} 
                  />
                )}
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!valid}
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: valid ? (isIncome ? theme.good : accent) : theme.surfaceAlt }]}
          >
            <Text style={[styles.saveBtnText, { color: valid ? (isIncome ? '#0A0A0A' : fabIconColor) : theme.textTer }]}>
              {isIncome ? 'Registrar ingreso' : 'Guardar gasto'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(timestamp)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (d) {
              const next = new Date(timestamp);
              next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setTimestamp(next.getTime());
            }
          }}
        />
      )}

      <ClockTimePicker
        visible={showClock}
        initialDate={timestamp}
        onClose={() => setShowClock(false)}
        onConfirm={(ts) => setTimestamp(ts)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 28,
    maxHeight: '94%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 4,
    paddingTop: 6,
  },
  sheetTitle: { fontSize: 13, fontWeight: '500' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  kindToggle: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginVertical: 10,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    position: 'relative',
  },
  toggleBg: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
  },
  kindBtn: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  kindLabel: { fontSize: 13, fontWeight: '600' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 10,
  },
  amountSign: { fontSize: 24, marginRight: 2, marginBottom: 8 },
  amountValue: { fontSize: 50, fontWeight: '600', letterSpacing: -2.2, lineHeight: 56 },
  accountPickerWrap: {},
  accountBtn: {
    height: 48, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 12,
  },
  accountIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  accountLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  accountName: { fontSize: 13, fontWeight: '500' },
  accountList: {
    marginTop: 8, borderRadius: 14, borderWidth: 1,
    overflow: 'hidden', maxHeight: 200,
  },
  accountListRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 10,
  },
  accountListName: { fontSize: 12 },
  accountListBal: { fontSize: 11 },
  catsScroll: { height: 82, flexGrow: 0, marginBottom: 10 },
  catChip: {
    flexShrink: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 8,
    minWidth: 80,
    minHeight: 80,
    maxWidth: 80,
    maxHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 9.5, fontWeight: '500', textAlign: 'center' },
  noteInput: {
    height: 38, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, fontSize: 13,
  },
  noteBtn: {
    height: 38, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    justifyContent: 'center',
  },
  dateChip: {
    height: 38, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 64,
  },
  dateChipText: { fontSize: 12, fontWeight: '600' },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 10,
  },
  numpadBtn: {
    width: '30%',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadTxt: { fontSize: 20, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  micBtn: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnDisabled: {
    opacity: 0.5,
  },
  pulseRing: {
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2,
  },
  pulseRingOuter: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 3,
  },
  pulseRingInner: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 0,
  },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
