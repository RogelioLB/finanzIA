import * as Haptics from "expo-haptics";
import { useCallback } from "react";

/**
 * Hook for triggering haptic feedback throughout the app
 * Provides consistent haptic patterns for different interaction types
 */
export function useHaptics() {
  // Light tap - for tab switches, toggles
  const lightTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Medium tap - for button presses, selections
  const mediumTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Heavy tap - for important actions like delete, confirm
  const heavyTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // Success feedback - for successful operations
  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Warning feedback - for warnings or caution
  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  // Error feedback - for errors or failures
  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  // Selection changed - for picker/selection changes
  const selectionChanged = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    selectionChanged,
  };
}

// Static functions for use outside of React components
export const triggerLightTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const triggerMediumTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const triggerHeavyTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const triggerSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const triggerWarning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const triggerError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
export const triggerSelection = () => Haptics.selectionAsync();
