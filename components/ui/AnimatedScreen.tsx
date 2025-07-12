import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  SharedValue,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

type AnimatedScreenProps = {
  children: ReactNode;
  isActive: boolean;
  isFocused: SharedValue<number>;
};

export default function AnimatedScreen({
  children,
  isActive,
  isFocused,
}: AnimatedScreenProps) {
  const animatedStyles = useAnimatedStyle(() => {
    const opacity = withTiming(isActive ? 1 : 0, {
      duration: 300,
    });
    
    // Animación de escala y posición
    const scale = interpolate(
      isFocused.value,
      [0, 1],
      [0.95, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      isFocused.value,
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
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
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
    width: "100%",
    height: "100%",
  },
});
