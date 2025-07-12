import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import AnimatedList from './AnimatedList';

interface AnimatedListWithExitHandlingProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  containerStyle?: StyleProp<ViewStyle>;
  itemContainerStyle?: StyleProp<ViewStyle>;
  initialDelay?: number;
  staggerDelay?: number;
  maxStaggerItems?: number;
  entryAnimation?: 'fadeIn' | 'fadeInDown' | 'custom';
  exitAnimation?: 'fadeOut' | 'slideOutRight' | 'slideOutLeft' | 'custom';
  customEntryAnimation?: any;
  customExitAnimation?: any;
  animationDuration?: number;
}

type ItemStatus = 'active' | 'exiting';

interface TrackedItem<T> {
  item: T;
  status: ItemStatus;
  id: string;
}

/**
 * Un componente wrapper para AnimatedList que maneja las animaciones de salida
 * manteniendo elementos eliminados en el DOM hasta que su animación termine
 */
function AnimatedListWithExitHandling<T>({
  data,
  renderItem,
  keyExtractor,
  containerStyle,
  itemContainerStyle,
  initialDelay = 200,
  staggerDelay = 200,
  maxStaggerItems = 3,
  entryAnimation = 'fadeInDown',
  exitAnimation = 'slideOutLeft',
  customEntryAnimation,
  customExitAnimation,
  animationDuration = 500,
}: AnimatedListWithExitHandlingProps<T>) {
  // Estado para mantener los elementos visibles, incluyendo los que están saliendo
  const [trackedItems, setTrackedItems] = useState<TrackedItem<T>[]>([]);
  
  // Usar una referencia para mantener los IDs previos y evitar bucles de actualización
  const previousIdsRef = useRef<Set<string>>(new Set());
  
  // Actualizar el estado cuando cambian los datos
  useEffect(() => {
    // Obtener los IDs actuales y anteriores
    const currentIds = new Set(data.map(keyExtractor));
    const prevIds = previousIdsRef.current;
    
    // Encontrar elementos eliminados (estaban en prevIds pero no en currentIds)
    const exitingIds = [...prevIds].filter(id => !currentIds.has(id));
    
    // Actualizar el estado basado en el estado anterior, no del valor actual
    setTrackedItems(prevTrackedItems => {
      // Crear una copia para modificar
      const updatedItems = [...prevTrackedItems];
      
      // Marcar elementos que ya no están como "exiting"
      exitingIds.forEach(exitingId => {
        const index = updatedItems.findIndex(item => item.id === exitingId);
        if (index !== -1) {
          updatedItems[index] = { ...updatedItems[index], status: 'exiting' };
        }
      });
      
      // Añadir nuevos elementos como "active"
      data.forEach(item => {
        const id = keyExtractor(item);
        if (!updatedItems.some(trackedItem => trackedItem.id === id)) {
          updatedItems.push({
            item,
            status: 'active',
            id
          });
        }
      });
      
      return updatedItems;
    });
    
    // Actualizar la referencia de IDs anteriores
    previousIdsRef.current = currentIds;
    
    // Programar la eliminación de los elementos en "exiting" después de la animación
    if (exitingIds.length > 0) {
      const timeoutId = setTimeout(() => {
        setTrackedItems(items => 
          items.filter(item => !exitingIds.includes(item.id))
        );
      }, animationDuration);
      
      return () => clearTimeout(timeoutId);
    }
  }, [data, keyExtractor, animationDuration]); // Ya no dependemos de trackedItems o previousIds
  
  return (
    <AnimatedList
      data={trackedItems}
      keyExtractor={(trackedItem) => trackedItem.id}
      initialDelay={initialDelay}
      staggerDelay={staggerDelay}
      maxStaggerItems={maxStaggerItems}
      entryAnimation={entryAnimation}
      exitAnimation={exitAnimation}
      customEntryAnimation={customEntryAnimation}
      customExitAnimation={customExitAnimation}
      containerStyle={containerStyle}
      itemContainerStyle={itemContainerStyle}
      renderItem={(trackedItem, index) => 
        renderItem(trackedItem.item, index)
      }
    />
  );
}

export default AnimatedListWithExitHandling;
