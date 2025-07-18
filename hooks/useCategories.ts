import { useCategories as useCategoriesContext } from '@/contexts/CategoriesContext';

export const useCategories = () => {
  const context = useCategoriesContext();
  
  // Función para obtener una categoría por ID
  const getCategoryById = (id: string) => {
    return context.categories.find(cat => cat.id === id) || null;
  };

  // Función para obtener categorías por tipo
  const getCategoriesByType = (type: 'expense' | 'income') => {
    return context.categories.filter(cat => cat.type === type);
  };

  // Función para buscar categorías por nombre
  const searchCategories = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return context.categories.filter(cat => 
      cat.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Función para obtener la categoría más usada (placeholder - se podría implementar con estadísticas)
  const getMostUsedCategory = (type?: 'expense' | 'income') => {
    const filteredCategories = type 
      ? context.categories.filter(cat => cat.type === type)
      : context.categories;
    
    // Por ahora retorna la primera categoría, pero se podría implementar lógica de estadísticas
    return filteredCategories[0] || null;
  };

  return {
    ...context,
    getCategoryById,
    getCategoriesByType,
    searchCategories,
    getMostUsedCategory,
  };
};
