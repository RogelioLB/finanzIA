import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSQLiteService } from '@/lib/database/sqliteService';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  type: "expense" | "income";
  is_income?: boolean;
}

interface CategoriesContextType {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

interface CategoriesProviderProps {
  children: ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCategories } = useSQLiteService();
  const getCategoriesRef = useRef(getCategories);
  
  // Actualizar las referencias cuando cambien las funciones
  useEffect(() => {
    getCategoriesRef.current = getCategories;
  }, [getCategories]);


  // Memorizar refreshCategories con useCallback
  const refreshCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dbCategories = await getCategoriesRef.current();
      
      // Convertir el formato de la DB al formato esperado
      const formattedCategories: Category[] = dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '💭',
        color: cat.color || '#4ECDC4',
        type: cat.is_income ? 'income' : 'expense',
        is_income: Boolean(cat.is_income)
      }));
      
      setCategories(formattedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);  // Sin dependencias ya que usamos refs

  useEffect(() => {
    refreshCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar categorías por tipo
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const value: CategoriesContextType = {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    error,
    refreshCategories,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
