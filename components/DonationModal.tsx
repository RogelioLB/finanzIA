import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const STORAGE_KEY = "@finanzia_donation_last_shown";
const DAYS_INTERVAL = 2;

// Donation link - replace with your actual donation URL
const DONATION_URL = "https://buymeacoffee.com/rogeliolb"; // TODO: Replace with actual link

interface DonationModalProps {
  forceShow?: boolean; // For testing purposes
}

export default function DonationModal({ forceShow = false }: DonationModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    if (forceShow) {
      setVisible(true);
      return;
    }

    try {
      const lastShown = await AsyncStorage.getItem(STORAGE_KEY);

      if (!lastShown) {
        // Never shown before, show after a brief delay to let the app load
        setTimeout(() => setVisible(true), 2000);
        return;
      }

      const lastShownDate = new Date(parseInt(lastShown, 10));
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastShownDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= DAYS_INTERVAL) {
        // Show after a brief delay
        setTimeout(() => setVisible(true), 2000);
      }
    } catch (error) {
      console.error("[DonationModal] Error checking last shown date:", error);
    }
  };

  const handleClose = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (error) {
      console.error("[DonationModal] Error saving last shown date:", error);
    }
  };

  const handleDonate = async () => {
    try {
      await Linking.openURL(DONATION_URL);
    } catch (error) {
      console.error("[DonationModal] Error opening donation URL:", error);
    }
    handleClose();
  };

  const handleMaybeLater = () => {
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={styles.container}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Heart icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={48} color="#EF4444" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Apoya a FinanzIA</Text>

          {/* Description */}
          <Text style={styles.description}>
            FinanzIA es una app gratuita creada con mucho esfuerzo. Si te ha sido
            util para manejar tus finanzas, considera hacer una donacion para
            mantener el desarrollo activo.
          </Text>

          {/* Features supported */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#7952FC" />
              <Text style={styles.featureText}>Nuevas funcionalidades</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#7952FC" />
              <Text style={styles.featureText}>Mejoras en la IA</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#7952FC" />
              <Text style={styles.featureText}>Soporte continuo</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
            <Ionicons name="cafe-outline" size={20} color="#fff" />
            <Text style={styles.donateButtonText}>Invitame un cafe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={handleMaybeLater}>
            <Text style={styles.laterButtonText}>Quiza mas tarde</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: width - 48,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
  },
  donateButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7952FC",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  laterButton: {
    paddingVertical: 12,
  },
  laterButtonText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
