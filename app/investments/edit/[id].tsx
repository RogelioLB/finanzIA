import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { MXN } from '@/theme/format';
import { useSQLiteContext } from 'expo-sqlite';
import { Investment } from '@/lib/database/investmentService';
import { useWallets } from '@/contexts/WalletsContext';
import { useInvestments } from '@/contexts/InvestmentsContext';
import { DesignIcon } from '@/components/ui/Icon';

const ICONS = ['📈', '💰', '🏦', '💎', '🌱', '⚡', '🎯', '💵'];
const COLORS = ['#10B981', '#0A84FF', '#FF6B35', '#AF52DE', '#FF375F', '#FFCC00'];

export default function EditInvestmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { wallets } = useWallets();
  const { refreshInvestments } = useInvestments();

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [name, setName] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📈');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [notes, setNotes] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const eligibleWallets = wallets.filter(w => w.type !== 'credit');

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const inv = await db.getFirstAsync<Investment>('SELECT * FROM investments WHERE id = ?', [id]);
      if (inv) {
        setInvestment(inv);
        setName(inv.name);
        setAnnualRate(inv.annual_rate.toString());
        setSelectedIcon(inv.icon);
        setSelectedColor(inv.color);
        setNotes(inv.notes || '');
        setWalletId(inv.wallet_id);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    const rateNum = parseFloat(annualRate);

    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!rateNum || rateNum <= 0 || rateNum > 100) {
      Alert.alert('Error', 'La tasa anual debe ser entre 0.01% y 100%');
      return;
    }

    setSaving(true);
    try {
      await db.runAsync(
        'UPDATE investments SET name = ?, annual_rate = ?, icon = ?, color = ?, notes = ?, wallet_id = ?, updated_at = ? WHERE id = ?',
        [name.trim(), rateNum, selectedIcon, selectedColor, notes.trim() || null, walletId, Date.now(), id]
      );
      await refreshInvestments();
      router.back();
    } catch (error) {
      console.error('Error updating investment:', error);
      Alert.alert('Error', 'No se pudo actualizar la inversión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSec }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!investment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: theme.text }}>Inversión no encontrada</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: accent }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: pad, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.text, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Editar Inversión</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.infoBanner, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 }]}>
          <Text style={[styles.infoLabel, { color: theme.textSec }]}>Capital actual</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{MXN(investment.current_value)}</Text>
          <Text style={[styles.infoSub, { color: theme.textTer, marginTop: 4 }]}>No se puede modificar el capital en la edición</Text>
        </View>

        <View style={[styles.field, { marginBottom: 20 }]}>
          <Text style={[styles.label, { color: theme.textSec }]}>NOMBRE</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la inversión"
            placeholderTextColor={theme.textTer}
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
          <Text style={[styles.hint, { color: theme.textTer }]}>La tasa se capitaliza diariamente automáticamente</Text>
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
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: accent, opacity: saving ? 0.6 : 1, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' }]}
        >
          <Text style={[styles.saveBtnText, { color: '#fff' }]}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
  infoBanner: {},
  infoLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 24, fontWeight: '600', letterSpacing: -0.8, marginTop: 4 },
  infoSub: { fontSize: 12 },
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