import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { Asset, searchAssets, getAllAssets } from "@/lib/services/assetSearchService";

export interface PickerOption {
  id: string;
  label: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

interface ListPickerSheetProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function ListPickerSheet({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: ListPickerSheetProps) {
  const { theme, accent } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
            {options.map((o) => {
              const sel = o.id === value;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => onPick(o.id)}
                  style={[
                    styles.row,
                    { backgroundColor: sel ? theme.surfaceAlt : "transparent" },
                  ]}
                  activeOpacity={0.7}
                >
                  {o.color ? (
                    <View
                      style={[styles.colorDot, { backgroundColor: o.color }]}
                    />
                  ) : null}
                  {o.icon}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>
                      {o.label}
                    </Text>
                    {o.sub ? (
                      <Text style={[styles.rowSub, { color: theme.textTer }]}>
                        {o.sub}
                      </Text>
                    ) : null}
                  </View>
                  {sel ? (
                    <DesignIcon.Check size={18} color={accent} strokeWidth={2} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface SearchableAssetPickerProps {
  visible: boolean;
  title: string;
  typeFilter?: 'crypto' | 'stock' | 'etf';
  onPick: (asset: Asset) => void;
  onClose: () => void;
}

export function SearchableAssetPicker({
  visible,
  title,
  typeFilter,
  onPick,
  onClose,
}: SearchableAssetPickerProps) {
  const { theme, accent } = useTheme();
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[SearchableAssetPicker] visible:', visible, 'typeFilter:', typeFilter);
    if (visible) {
      loadAssets();
    }
  }, [visible, typeFilter]);

  useEffect(() => {
    console.log('[SearchableAssetPicker] query changed:', query);
    const timeout = setTimeout(async () => {
      console.log('[SearchableAssetPicker] Searching with query:', query, 'typeFilter:', typeFilter);
      if (query) {
        const results = await searchAssets(query, typeFilter);
        console.log('[SearchableAssetPicker] Search results:', results.length);
        setAssets(results);
      } else {
        console.log('[SearchableAssetPicker] No query, loading assets');
        loadAssets();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, typeFilter]);

  const loadAssets = async () => {
    console.log('[SearchableAssetPicker] loadAssets called');
    setLoading(true);
    try {
      const result = await getAllAssets();
      console.log('[SearchableAssetPicker] getAllAssets result:', {
        crypto: result.crypto.length,
        stocks: result.stocks.length,
        etfs: result.etfs.length
      });
      if (typeFilter === 'crypto') setAssets(result.crypto);
      else if (typeFilter === 'stock') setAssets(result.stocks);
      else if (typeFilter === 'etf') setAssets(result.etfs);
      else setAssets([...result.crypto, ...result.stocks, ...result.etfs]);
    } catch (e) {
      console.error('[SearchableAssetPicker] Failed to load assets:', e);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: 'crypto' | 'stock' | 'etf') => {
    if (type === 'crypto') return DesignIcon.Crypto;
    if (type === 'etf') return DesignIcon.Stocks;
    return DesignIcon.TrendUp;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textTer} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar activo..."
              placeholderTextColor={theme.textTer}
              style={[styles.searchInput, { color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <DesignIcon.Close size={16} color={theme.textTer} strokeWidth={1.7} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
            {loading ? (
              <Text style={[styles.emptyText, { color: theme.textTer }]}>Cargando...</Text>
            ) : assets.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textTer }]}>No se encontraron activos</Text>
            ) : (
              assets.map((asset) => {
                const IconComp = getTypeIcon(asset.type);
                const sel = false;
                return (
                  <TouchableOpacity
                    key={asset.id}
                    onPress={() => {
                      onPick(asset);
                      onClose();
                    }}
                    style={[
                      styles.row,
                      { backgroundColor: sel ? theme.surfaceAlt : "transparent" },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.assetIconWrap, { backgroundColor: accent + '20' }]}>
                      <IconComp size={18} color={accent} strokeWidth={1.7} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.text }]}>
                        {asset.symbol}
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.textTer }]}>
                        {asset.name}
                      </Text>
                    </View>
                    <View style={[styles.typeTag, { backgroundColor: theme.surfaceAlt }]}>
                      <Text style={[styles.typeTagText, { color: theme.textTer }]}>
                        {asset.type.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 12 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  assetIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  typeTag: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: { fontSize: 9, fontWeight: '600' },
});