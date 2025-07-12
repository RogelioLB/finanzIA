import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AnimatedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export default function AnimatedAlert({
  visible,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonColor = "#DD6B55",
  cancelButtonColor = "#7952FC",
  onConfirm,
  onCancel,
  onDismiss,
}: AnimatedAlertProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // Show the modal immediately
      setModalVisible(true);

      // Then animate in
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, { damping: 15 });
      }, 10);
    } else {
      // Hide immediately when not visible
      opacity.value = 0;
      scale.value = 0.8;
      setModalVisible(false);

      // Call onDismiss after a short delay
      if (onDismiss) {
        setTimeout(() => {
          onDismiss();
        }, 100);
      }
    }
  }, [visible, opacity, scale, onDismiss]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const alertStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: interpolate(scale.value, [0.8, 1], [0, 1]),
    };
  });

  const handleConfirm = () => {
    // Call confirm handler directly
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    // Call cancel handler directly
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <Animated.View
        className="flex-1 items-center justify-center"
        style={[overlayStyle, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <Animated.View
          className="bg-white p-6 rounded-2xl w-4/5 max-w-md"
          style={alertStyle}
        >
          <Text className="text-center text-xl font-bold mb-2">{title}</Text>
          <Text className="text-center text-gray-600 mb-4">{message}</Text>

          <View className="flex-row justify-between mt-2">
            {onCancel && (
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl mr-2"
                style={{ backgroundColor: cancelButtonColor }}
                onPress={handleCancel}
              >
                <Text className="text-white text-center font-medium">
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            {onConfirm && (
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl ml-2"
                style={{ backgroundColor: confirmButtonColor }}
                onPress={handleConfirm}
              >
                <Text className="text-white text-center font-medium">
                  {confirmText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
