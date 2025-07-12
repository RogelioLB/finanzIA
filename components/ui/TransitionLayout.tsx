import React, { ReactNode, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

interface TransitionLayoutProps {
  children: ReactNode;
}

export default function TransitionLayout({ children }: TransitionLayoutProps) {
  // Valores animados para controlar la entrada y salida de la pantalla
  const animationValue = useSharedValue(0);

  // Efecto para animar la entrada de la pantalla
  useFocusEffect(
    React.useCallback(() => {
      // Cuando la pantalla obtiene el foco, animamos desde 0 a 1
      animationValue.value = 0;
      animationValue.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      return () => {
        // Cuando la pantalla pierde el foco, animamos de vuelta a 0
        animationValue.value = withTiming(0, {
          duration: 250,
          easing: Easing.in(Easing.cubic),
        });
      };
    }, [])
  );

  // Estilos animados para la pantalla
  const animatedStyles = useAnimatedStyle(() => {
    // Interpolamos los valores de opacidad, escala y traslación
    const opacity = animationValue.value;
    
    const translateY = interpolate(
      animationValue.value,
      [0, 1],
      [10, 0],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      animationValue.value,
      [0, 1],
      [0.97, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY },
        { scale }
      ]
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyles]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
