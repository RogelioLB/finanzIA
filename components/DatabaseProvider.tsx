import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { initDatabase } from '@/lib/database/database';

interface DatabaseContextType {
  initialized: boolean;
  error: string | null;
}

export const DatabaseContext = createContext<DatabaseContextType>({
  initialized: false,
  error: null
});

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [state, setState] = useState<DatabaseContextType>({
    initialized: false,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    
    async function setupDatabase() {
      try {
        await initDatabase();
        if (mounted) {
          setState({ initialized: true, error: null });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing database:', error);
          setState({ initialized: false, error: (error as Error).message });
        }
      }
    }
    
    setupDatabase();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (!state.initialized) {
    // Mostrar un splash screen o loading mientras se inicializa la BD
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#7952FC" />
        <Text style={{ marginTop: 12, color: '#333', fontSize: 16 }}>Inicializando base de datos...</Text>
        {state.error && (
          <Text style={{ marginTop: 8, color: 'red', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
            {state.error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}
