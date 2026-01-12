import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface CreditCardProps {
  name: string;
  bank?: string;
  lastFourDigits?: string;
  color?: string;
  style?: ViewStyle;
  isMini?: boolean;
}

export default function CreditCard({
  name,
  bank,
  lastFourDigits,
  color = "#1E3A8A",
  style,
  isMini = false,
}: CreditCardProps) {
  // Generate a darker shade for the gradient
  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = ((num >> 8) & 0x00ff) - amt,
      B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const gradientColors: [string, string] = [color, darkenColor(color, 30)];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {/* Glossy overlay effect */}
      <View style={styles.glossyOverlay} />

      <View style={[styles.cardContent, isMini && styles.cardContentMini]}>
        <View style={styles.header}>
          <Text style={[styles.bankName, isMini && styles.bankNameMini]}>
            {bank || "BANCO"}
          </Text>
          <View style={[styles.chipContainer, isMini && styles.chipContainerMini]}>
            <View style={styles.chip} />
          </View>
        </View>

        <View style={[styles.middle, isMini && styles.middleMini]}>
          {!isMini && <MaterialCommunityIcons name="contactless-payment" size={24} color="rgba(255,255,255,0.6)" />}
          <Text style={[styles.cardNumber, isMini && styles.cardNumberMini]}>
            {isMini ? `•••• ${lastFourDigits || "0000"}` : `••••  ••••  ••••  ${lastFourDigits || "0000"}`}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            {!isMini && <Text style={styles.label}>TITULAR</Text>}
            <Text style={[styles.ownerName, isMini && styles.ownerNameMini]} numberOfLines={1}>
              {name.toUpperCase() || "NOMBRE DEL TITULAR"}
            </Text>
          </View>
          {!isMini && (
            <View style={styles.brandContainer}>
               <Ionicons name="card" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 1.586, // Standard credit card ratio
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  glossyOverlay: {
    position: "absolute",
    top: -100,
    left: -100,
    width: "200%",
    height: "200%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    transform: [{ rotate: "45deg" }],
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  cardContentMini: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bankNameMini: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  chipContainer: {
    width: 45,
    height: 35,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  chipContainerMini: {
    width: 24,
    height: 18,
    borderRadius: 3,
    padding: 2,
  },
  chip: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
  },
  middle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  middleMini: {
    gap: 0,
  },
  cardNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 2,
    flex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardNumberMini: {
    fontSize: 12,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  ownerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  ownerNameMini: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  brandContainer: {
    opacity: 0.9,
  },
});
