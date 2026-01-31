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

  // Guard to prevent multiple close calls (using shared value for UI thread access)
  const isClosingShared = useSharedValue(false);
  const hasCalledOnClose = useRef(false);

  // Function to set closing state (called from UI thread via runOnJS)
  const setIsClosing = useCallback((value: boolean) => {
    isClosingShared.value = value;
  }, [isClosingShared]);

  // Define open function
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

  // Safe wrapper to call onClose only once from the JS thread
  const safeOnClose = useCallback(() => {
    if (hasCalledOnClose.current) return;
    hasCalledOnClose.current = true;
    Keyboard.dismiss();

    // Use setTimeout to ensure animation completes before calling onClose
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 150);
  }, [onClose]);

  // Close function (runs on JS thread, triggers worklet animation)
  const closeFromJS = useCallback(() => {
    // Prevent multiple close calls
    if (isClosingShared.value || hasCalledOnClose.current) return;

    isClosingShared.value = true;

    cancelAnimation(translateY);
    cancelAnimation(overlayOpacity);

    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    overlayOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    });

    safeOnClose();
  }, [translateY, overlayOpacity, safeOnClose, isClosingShared]);

  // Worklet version of close for use in gesture handler
  const closeWorklet = useCallback(() => {
    "worklet";
    // Check shared value (accessible from UI thread)
    if (isClosingShared.value) return;

    isClosingShared.value = true;

    cancelAnimation(translateY);
    cancelAnimation(overlayOpacity);

    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    overlayOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    });

    // Call the safe wrapper on JS thread
    runOnJS(safeOnClose)();
  }, [translateY, overlayOpacity, safeOnClose, isClosingShared]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

  // Gesture for the bottom sheet
  // activeOffsetY: solo activar cuando el movimiento vertical supera 10px
  // failOffsetX: fallar si el movimiento horizontal supera 20px (permite scroll horizontal)
  const gesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
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
        // Use the worklet version of close
        closeWorklet();
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
    // Reset guards when visibility changes to true (opening)
    if (visible) {
      isClosingShared.value = false;
      hasCalledOnClose.current = false;
    }

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
    } else if (!isClosingShared.value) {
      closeFromJS();
    }
  }, [visible, open, closeFromJS, isClosingShared]);

  return (
    <>
      {/* Background overlay */}
      <Animated.View
        className="absolute top-0 left-0 right-0 bottom-0 bg-black z-40"
        style={overlayStyle}
        pointerEvents={visible && !isClosingShared.value ? "auto" : "none"}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isClosingShared.value) {
              closeFromJS();
            }
          }}
        >
          <View className="w-full h-full" />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Bottom sheet - wrapper for keyboard avoidance */}
      <Animated.View
        className="w-full absolute bottom-0 z-50"
        style={animatedStyle}
        pointerEvents={visible && !isClosingShared.value ? "auto" : "none"}
      >
        {/* Inner container with styling and drag animation */}
        <Animated.View
          className="bg-white rounded-t-[25px] px-5 pb-6"
          style={reanimatedBottomStyle}
        >
          {/* Handle area - only this part captures drag gestures */}
          <GestureDetector gesture={gesture}>
            <View className="w-full items-center pt-4 pb-2">
              <View className="w-[75px] h-1 bg-gray-300 rounded-full" />
            </View>
          </GestureDetector>

          {title && (
            <View className="mb-4">
              <Animated.Text className="text-black text-xl font-bold text-center">
                {title}
              </Animated.Text>
            </View>
          )}

          {children}
        </Animated.View>
      </Animated.View>
    </>
  );
}
