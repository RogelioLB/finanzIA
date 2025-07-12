import { ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

type AnimatedTabScreenProps = {
  children: ReactNode;
  active: boolean;
};

export default function AnimatedTabScreen({ children, active }: AnimatedTabScreenProps) {
  // Usamos un SharedValue para controlar la animación
  const activeValue = useSharedValue(active ? 1 : 0);

  // Actualizamos el valor cuando cambia la propiedad active
  useEffect(() => {
    activeValue.value = withTiming(active ? 1 : 0, { duration: 300 });
  }, [active, activeValue]);

  // Definimos los estilos animados
  const animatedStyles = useAnimatedStyle(() => {
    const opacity = activeValue.value;
    
    // Animación de escala y posición para un efecto suave
    const scale = interpolate(
      activeValue.value,
      [0, 1],
      [0.95, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      activeValue.value,
      [0, 1],
      [20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { scale },
        { translateY },
      ],
      zIndex: active ? 1 : 0,
      position: "absolute",
      width: "100%",
      height: "100%",
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyles]}>
      <View style={styles.innerContainer}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});
