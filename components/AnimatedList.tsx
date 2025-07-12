import React, { ReactNode } from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  LinearTransition,
  SlideOutRight,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AnimatedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  containerStyle?: StyleProp<ViewStyle>;
  itemContainerStyle?: StyleProp<ViewStyle>;
  initialDelay?: number;
  staggerDelay?: number;
  maxStaggerItems?: number;
  entryAnimation?: "fadeIn" | "fadeInDown" | "custom";
  exitAnimation?: "fadeOut" | "slideOutRight" | "slideOutLeft" | "custom";
  customEntryAnimation?: any;
  customExitAnimation?: any;
  itemLayout?: boolean;
  listLayout?: boolean;
}

/**
 * Un componente de lista con animaciones para entrada y salida de elementos
 */
function AnimatedList<T>({
  data,
  renderItem,
  keyExtractor,
  containerStyle,
  itemContainerStyle,
  initialDelay = 0,
  staggerDelay = 100,
  maxStaggerItems = 3,
  entryAnimation = "fadeInDown",
  exitAnimation = "fadeOut",
  customEntryAnimation,
  customExitAnimation,
  itemLayout = true,
  listLayout = true,
}: AnimatedListProps<T>) {
  // Determinar la animación de entrada basada en las props
  const getEntryAnimation = (index: number) => {
    // Si hay una animación personalizada, usarla
    if (entryAnimation === "custom" && customEntryAnimation) {
      return customEntryAnimation;
    }

    // Calcular el delay basado en el índice
    const delay =
      index < maxStaggerItems
        ? initialDelay + index * staggerDelay
        : initialDelay + maxStaggerItems * staggerDelay;

    // Elegir la animación basada en la prop
    switch (entryAnimation) {
      case "fadeIn":
        return FadeIn.delay(delay).springify();
      case "fadeInDown":
      default:
        return FadeInDown.delay(delay).springify().damping(12);
    }
  };

  // Determinar la animación de salida basada en las props
  const getExitAnimation = () => {
    if (exitAnimation === "custom" && customExitAnimation) {
      return customExitAnimation;
    }

    // Crear una animación personalizada que combina deslizar a la izquierda con color rojo
    if (exitAnimation === "slideOutLeft") {
      return (_values: any) => {
        "worklet";
        const animations = {
          transform: [
            {
              translateX: withSequence(
                withTiming(0),
                withTiming(-300, { duration: 300 })
              ),
            },
          ],
        };
        const initialValues = {
          transform: [{ translateX: 0 }],
        };
        return {
          initialValues,
          animations,
        };
      };
    }

    switch (exitAnimation) {
      case "slideOutRight":
        return SlideOutRight;
      case "fadeOut":
      default:
        return FadeOut;
    }
  };

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        layout={listLayout ? LinearTransition.springify() : undefined}
      >
        {data.map((item, index) => (
          <Animated.View
            key={keyExtractor(item)}
            style={itemContainerStyle}
            entering={getEntryAnimation(index)}
            exiting={getExitAnimation()}
            layout={itemLayout ? Layout.springify() : undefined}
          >
            {renderItem(item, index)}
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

export default AnimatedList;
