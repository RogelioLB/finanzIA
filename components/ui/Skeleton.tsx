import React, { useEffect } from "react";
import { DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A shimmer skeleton loading component
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1, // Infinite loop
      false // Don't reverse
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX: `${translateX}%` as any }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
}

/**
 * Pre-built skeleton patterns for common UI elements
 */

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={40} style={{ marginTop: 16 }} />
    </View>
  );
}

export function SkeletonTransaction() {
  return (
    <View style={styles.transaction}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.transactionContent}>
        <Skeleton width={140} height={14} />
        <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.transactionAmount}>
        <Skeleton width={60} height={14} />
        <Skeleton width={40} height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonTransactionList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonTransaction key={index} />
      ))}
    </View>
  );
}

export function SkeletonWalletCard() {
  return (
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width={120} height={28} style={{ marginTop: 12 }} />
    </View>
  );
}

export function SkeletonStats() {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Skeleton width={60} height={10} />
        <Skeleton width={80} height={18} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statCard}>
        <Skeleton width={60} height={10} />
        <Skeleton width={80} height={18} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.statCard}>
        <Skeleton width={60} height={10} />
        <Skeleton width={80} height={18} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  walletCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
