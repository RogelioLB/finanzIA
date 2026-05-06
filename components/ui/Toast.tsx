import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { DesignIcon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastAPI {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];
let nextId = 1;

function notify() {
  toastListeners.forEach(l => l([...toasts]));
}

export const Toast: ToastAPI = {
  success: (title: string, message?: string) => {
    toasts = [...toasts, { id: nextId++, type: 'success', title, message }];
    notify();
  },
  error: (title: string, message?: string) => {
    toasts = [...toasts, { id: nextId++, type: 'error', title, message }];
    notify();
  },
  warn: (title: string, message?: string) => {
    toasts = [...toasts, { id: nextId++, type: 'warn', title, message }];
    notify();
  },
  info: (title: string, message?: string) => {
    toasts = [...toasts, { id: nextId++, type: 'info', title, message }];
    notify();
  },
};

function ToastItemComponent({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    progressAnim.setValue(0);
    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, 3000);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id]);

  const config = {
    success: { icon: DesignIcon.Check, color: '#10B981', bg: '#D1FAE5' },
    error: { icon: DesignIcon.Close, color: '#EF4444', bg: '#FEE2E2' },
    warn: { icon: DesignIcon.Alert, color: '#F59E0B', bg: '#FEF3C7' },
    info: { icon: DesignIcon.Eye, color: '#3B82F6', bg: '#DBEAFE' },
  };

  const { icon: IconComp, color, bg } = config[item.type];

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <IconComp size={16} color={color} strokeWidth={2.5} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.toastTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.message && (
          <Text style={[styles.toastMessage, { color: theme.textSec }]} numberOfLines={2}>
            {item.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onDismiss(item.id)} style={styles.closeBtn}>
        <DesignIcon.Close size={14} color={theme.textTer} strokeWidth={1.7} />
      </TouchableOpacity>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              right: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { theme } = useTheme();
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => setVisibleToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  const handleDismiss = (id: number) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  };

  const handleDismissAll = () => {
    toasts = [];
    notify();
  };

  if (visibleToasts.length === 0) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
    >
      <TouchableWithoutFeedback onPress={handleDismissAll}>
        <View style={styles.modalOverlay}>
          <View style={styles.container} pointerEvents="box-none">
            {visibleToasts.map(item => (
              <ToastItemComponent key={item.id} item={item} onDismiss={handleDismiss} />
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 2147483647,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: { flex: 1, marginRight: 8 },
  toastTitle: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  toastMessage: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 2,
  },
});