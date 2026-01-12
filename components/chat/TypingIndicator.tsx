import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const DURATION = 600;

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  useEffect(() => {
    // Animar con delay
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, {
          duration: DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.dot, animatedStyle]}
    />
  );
}

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  bubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9CA3AF",
  },
});
