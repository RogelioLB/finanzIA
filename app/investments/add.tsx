import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { useSQLiteContext } from 'expo-sqlite';
import uuid from 'react-native-uuid';
import { useWallets } from '@/contexts/WalletsContext';

const ICONS = ['📈', '💰', '🏦', '💎', '🌱', '⚡', '🎯', '💵'];
const COLORS = ['#10B981', '#0A84FF', '#FF6B35', '#AF52DE', '#FF375F', '#FFCC00'];

export default function AddInvestmentScreen() {
  const { theme, accent } = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { wallets } = useWallets();
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📈');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [notes, setNotes] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const eligibleWallets = wallets.filter(w => w.type !== 'credit');

  const handleSave = async () => {
    const principalNum = parseFloat(principal);
    const rateNum = parseFloat(annualRate);

    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!principalNum || principalNum <= 0) {
      Alert.alert('Error', 'El monto principal debe ser mayor a 0');
      return;
    }
    if (!rateNum || rateNum <= 0 || rateNum > 100) {
      Alert.alert('Error', 'La tasa anual debe ser entre 0.01% y 100%');
      return;
    }

    setLoading(true);
    try {
      const id = uuid.v4() as string;
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      await db.runAsync(
        `INSERT INTO investments (id, name, principal, annual_rate, currency, wallet_id, icon, color, start_date, current_value, last_compound_date, is_active, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), principalNum, rateNum, 'MXN', walletId, selectedIcon, selectedColor, now, principalNum, startOfToday.getTime(), 1, notes.trim() || null, now, now]
      );

      const historyId = uuid.v4() as string;
      await db.runAsync(
        'INSERT INTO investment_history (id, investment_id, date, value) VALUES (?, ?, ?, ?)',
        [historyId, id, startOfToday.getTime(), principalNum]
      );

      router.back();
    } catch (error) {
      console.error('Error creating investment:', error);
      Alert.alert('Error', 'No se pudo crear la inversión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <DesignIcon.Close size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nueva Inversión</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>NOMBRE</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Inversión Nu"
            placeholderTextColor={theme.textTer}
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
        </View>

        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>MONTO PRINCIPAL (MXN)</Text>
          <TextInput
            value={principal}
            onChangeText={setPrincipal}
            placeholder="10000"
            placeholderTextColor={theme.textTer}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
        </View>

        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>TASA ANUAL (%)</Text>
          <TextInput
            value={annualRate}
            onChangeText={setAnnualRate}
            placeholder="12.5"
            placeholderTextColor={theme.textTer}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.hint, { color: theme.textTer }]}>Ej: 12.5% anual — se capitaliza diariamente</Text>
        </View>

        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>ICONO</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => setSelectedIcon(icon)}
                style={[styles.iconBtn, { backgroundColor: selectedIcon === icon ? accent : theme.surface, borderColor: selectedIcon === icon ? accent : theme.border }]}
              >
                <Text style={{ fontSize: 24 }}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>COLOR</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorBtn, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: theme.bg }]}
              />
            ))}
          </View>
        </View>

        {eligibleWallets.length > 0 && (
          <View style={[styles.field, { marginBottom: 20 }]}>
            <Text style={[styles.label, { color: theme.textSec }]}>CUENTA BANCARIA (OPCIONAL)</Text>
            <Text style={[styles.hint, { color: theme.textTer, marginBottom: 8 }]}>
              Vincula esta inversión a una cuenta de banco o débito para incluirla en tu saldo neto.
            </Text>
            <TouchableOpacity
              onPress={() => setWalletId(null)}
              style={[styles.walletOption, { backgroundColor: walletId === null ? accent : theme.surface, borderColor: walletId === null ? accent : theme.border }]}
            >
              <Text style={{ color: walletId === null ? '#fff' : theme.text, fontWeight: '500', fontSize: 14 }}>Sin cuenta vinculada</Text>
            </TouchableOpacity>
            {eligibleWallets.map(w => (
              <TouchableOpacity
                key={w.id}
                onPress={() => setWalletId(w.id)}
                style={[styles.walletOption, { backgroundColor: walletId === w.id ? accent : theme.surface, borderColor: walletId === w.id ? accent : theme.border, marginTop: 8 }]}
              >
                <View style={[styles.walletDot, { backgroundColor: w.color || accent }]} />
                <Text style={{ color: walletId === w.id ? '#fff' : theme.text, flex: 1, fontWeight: '500', fontSize: 14 }}>{w.name}</Text>
                {walletId === w.id && <DesignIcon.Check size={16} color="#fff" strokeWidth={2} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.field, { marginBottom: 24 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>NOTAS (OPCIONAL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas sobre esta inversión..."
            placeholderTextColor={theme.textTer}
            multiline
            style={[styles.textarea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveBtn, { backgroundColor: accent, opacity: loading ? 0.6 : 1, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' }]}
        >
          <Text style={[styles.saveBtnText, { color: '#fff' }]}>
            {loading ? 'Guardando...' : 'Crear Inversión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollView: { flex: 1 },
  field: {},
  label: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, fontWeight: '500' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  textarea: { minHeight: 80, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, textAlignVertical: 'top' },
  hint: { fontSize: 12, marginTop: 6 },
  iconGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  iconBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  colorGrid: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
  saveBtn: {},
  saveBtnText: { fontSize: 15, fontWeight: '600' },
  walletOption: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10 },
  walletDot: { width: 10, height: 10, borderRadius: 5 },
});