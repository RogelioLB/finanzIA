import { useCategories as useCategoriesContext } from '@/contexts/CategoriesContext';
import { useCallback, useMemo } from 'react';

export const useCategories = () => {
  const context = useCategoriesContext();

  // Función para obtener una categoría por ID (memoizada)
  const getCategoryById = useCallback(
    (id: string) => {
      return context.categories.find((cat) => cat.id === id) || null;
    },
    [context.categories]
  );

  // Función para obtener categorías por tipo (memoizada)
  const getCategoriesByType = useCallback(
    (type: 'expense' | 'income') => {
      return context.categories.filter((cat) => cat.type === type);
    },
    [context.categories]
  );

  // Función para buscar categorías por nombre (memoizada)
  const searchCategories = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return context.categories.filter((cat) =>
        cat.name.toLowerCase().includes(lowercaseQuery)
      );
    },
    [context.categories]
  );

  // Función para obtener la categoría más usada (memoizada)
  const getMostUsedCategory = useCallback(
    (type?: 'expense' | 'income') => {
      const filteredCategories = type
        ? context.categories.filter((cat) => cat.type === type)
        : context.categories;

      return filteredCategories[0] || null;
    },
    [context.categories]
  );

  // Memoizar el objeto retornado
  return useMemo(
    () => ({
      ...context,
      getCategoryById,
      getCategoriesByType,
      searchCategories,
      getMostUsedCategory,
    }),
    [context, getCategoryById, getCategoriesByType, searchCategories, getMostUsedCategory]
  );
};
