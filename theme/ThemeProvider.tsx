import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { THEME_DARK, THEME_LIGHT, getFabContrast, Theme, ACCENT_PALETTE } from "./tokens";

export type ThemeMode = 'dark' | 'light';
export type FabStyle = 'notch' | 'floating';
export type NumpadStyle = 'calculator' | 'phone';
export type Density = 'comfortable' | 'compact';

interface ThemeState {
  mode: ThemeMode;
  accent: string;
  customAccent: string | null;
  fabStyle: FabStyle;
  numpadStyle: NumpadStyle;
  density: Density;
}

interface ThemeContextType extends ThemeState {
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setCustomAccent: (accent: string | null) => void;
  setFabStyle: (style: FabStyle) => void;
  setNumpadStyle: (style: NumpadStyle) => void;
  setDensity: (density: Density) => void;
  fabIconColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'finanzia.theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>({
    mode: 'dark',
    accent: '#FF6B35',
    customAccent: null,
    fabStyle: 'notch',
    numpadStyle: 'calculator',
    density: 'comfortable',
  });

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("[ThemeProvider] Failed to load theme:", error);
    }
  };

  const saveTheme = async (updates: Partial<ThemeState>) => {
    try {
      const newState = { ...state, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: newState.mode,
        accent: newState.accent,
        customAccent: newState.customAccent,
        fabStyle: newState.fabStyle,
        numpadStyle: newState.numpadStyle,
        density: newState.density,
      }));
    } catch (error) {
      console.error("[ThemeProvider] Failed to save theme:", error);
    }
  };

  const setMode = (mode: ThemeMode) => {
    setState(prev => ({ ...prev, mode }));
    saveTheme({ mode });
  };

  const setAccent = (accent: string) => {
    setState(prev => ({ ...prev, accent }));
    saveTheme({ accent });
  };

  const setCustomAccent = (accent: string | null) => {
    setState(prev => ({ ...prev, customAccent: accent }));
    saveTheme({ customAccent: accent });
  };

  const setFabStyle = (fabStyle: FabStyle) => {
    setState(prev => ({ ...prev, fabStyle }));
    saveTheme({ fabStyle });
  };

  const setNumpadStyle = (numpadStyle: NumpadStyle) => {
    setState(prev => ({ ...prev, numpadStyle }));
    saveTheme({ numpadStyle });
  };

  const setDensity = (density: Density) => {
    setState(prev => ({ ...prev, density }));
    saveTheme({ density });
  };

  const theme = state.mode === 'light' ? THEME_LIGHT : THEME_DARK;
  const fabIconColor = getFabContrast(state.accent);

  const value: ThemeContextType = {
    ...state,
    theme,
    setMode,
    setAccent,
    setCustomAccent,
    setFabStyle,
    setNumpadStyle,
    setDensity,
    fabIconColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}