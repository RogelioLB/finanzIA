import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetBaseProps {
  children: ReactNode;
  onClose?: () => void;
  visible?: boolean;
  title?: string;
}

export default function BottomSheetBase({
  children,
  onClose,
  visible = true,
  title,
}: BottomSheetBaseProps) {
  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const keyboard = useAnimatedKeyboard();

  // Define open and close functions first
  const open = useCallback(() => {
    "worklet";
    cancelAnimation(translateY);
    cancelAnimation(overlayOpacity);

    translateY.value = withSpring(0, {
      damping: 20,
      mass: 0.8,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
    overlayOpacity.value = withTiming(0.5, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [translateY, overlayOpacity]);

  const close = useCallback(() => {
    "worklet";
    cancelAnimation(translateY);
    cancelAnimation(overlayOpacity);

    translateY.value = withSpring(SCREEN_HEIGHT, {
      damping: 25,
      stiffness: 400,
      mass: 0.6,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
    overlayOpacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.in(Easing.quad),
    });

    // Solo cerrar el teclado si el bottom sheet estaba realmente abierto
    if (translateY.value < SCREEN_HEIGHT * 0.5) {
      runOnJS(Keyboard.dismiss)();
    }
    if (onClose) {
      runOnJS(onClose)();
    }
  }, [translateY, overlayOpacity, onClose]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

  // Gesture for the bottom sheet
  const gesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      context.value = { y: translateY.value };
      cancelAnimation(translateY);
      cancelAnimation(overlayOpacity);
    })
    .onUpdate((event) => {
      "worklet";
      // Only allow moving down, not up beyond content height
      const newTranslateY = event.translationY + context.value.y;
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;

        // Update overlay opacity based on bottom sheet position
        // As the sheet slides down, the overlay becomes more transparent
        overlayOpacity.value = interpolate(
          translateY.value,
          [0, SCREEN_HEIGHT],
          [0.5, 0], // From 0.5 opacity to 0
          "clamp"
        );
      }
    })
    .onEnd((event) => {
      "worklet";
      const velocity = event.velocityY;
      const shouldClose =
        translateY.value > SCREEN_HEIGHT * 0.2 || velocity > 500;

      if (shouldClose) {
        // Must use runOnJS since we're calling a JS function from UI thread
        runOnJS(close)();
      } else {
        // Otherwise snap back to initial position with spring animation
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          velocity: velocity,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        });
        overlayOpacity.value = withTiming(0.5, {
          duration: 100,
          easing: Easing.out(Easing.quad),
        });
      }
    });

  // Animated styles
  const reanimatedBottomStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  // Handle visibility changes
  const firstRenderRef = useRef(true);

  useEffect(() => {
    // Solo abrir en la primera renderización si visible es true
    // No cerrar en la primera renderización aunque visible sea false
    if (firstRenderRef.current) {
      if (visible) {
        open();
      }
      firstRenderRef.current = false;
      return;
    }

    // Después de la primera renderización, responder normalmente a los cambios de visible
    if (visible) {
      open();
    } else {
      close();
    }
  }, [visible, open, close]);

  return (
    <>
      {/* Background overlay */}
      <Animated.View
        className="absolute top-0 left-0 right-0 bottom-0 bg-black z-40"
        style={overlayStyle}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableWithoutFeedback 
          onPress={() => {
            Keyboard.dismiss();
            close();
          }}
        >
          <View className="w-full h-full" />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Bottom sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          className="w-full absolute bottom-0 z-50 bg-white rounded-t-[25px] px-5 pb-6"
          style={[reanimatedBottomStyle, visible ? animatedStyle : {}]}
        >
          <View className="w-full items-center pt-4 pb-2">
            <View className="w-[75px] h-1 bg-gray-300 rounded-full" />
          </View>

          {title && (
            <View className="mb-4">
              <Animated.Text className="text-black text-xl font-bold text-center">
                {title}
              </Animated.Text>
            </View>
          )}

          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
}
