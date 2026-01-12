import { Skeleton } from "@/components/ui/Skeleton";
import useBalance from "@/hooks/useBalance";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";

export default function AccountsWidget() {
  const { walletBalances, loading } = useBalance();
  const router = useRouter();

  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.walletItem, { backgroundColor: '#F3F4F6' }]}>
            <View style={styles.walletHeader}>
              <Skeleton width={32} height={32} borderRadius={16} />
              <Skeleton width={40} height={20} borderRadius={10} />
            </View>
            <View style={styles.walletContent}>
              <Skeleton width={100} height={14} />
              <Skeleton width={80} height={18} style={{ marginTop: 8 }} />
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {walletBalances.map((wallet, index) => (
        <Animated.View
          key={wallet.id}
          entering={SlideInRight.delay(index * 100).duration(600)}
        >
          <TouchableOpacity 
            style={[
              styles.walletItem,
              { backgroundColor: wallet.color || '#F8F9FA' }
            ]}
            onPress={() => router.push(`/wallets/${wallet.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.walletHeader}>
              <View style={styles.walletIcon}>
                {wallet.icon ? (
                  <Text style={styles.iconText}>{wallet.icon}</Text>
                ) : (
                  <Ionicons name="wallet" size={20} color="#7952FC" />
                )}
              </View>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>{wallet.currency}</Text>
              </View>
            </View>
            
            <View style={styles.walletContent}>
              <Text style={styles.walletName} numberOfLines={1}>
                {wallet.name}
              </Text>
              <Text style={styles.walletBalance}>
                {wallet.balance}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
      
      <Animated.View
        entering={FadeIn.delay(walletBalances.length * 100 + 200).duration(600)}
      >
        <TouchableOpacity 
          style={styles.addWallet}
          onPress={() => router.push("/wallets/add-wallet" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.addWalletIcon}>
            <Ionicons name="add" size={24} color="#7952FC" />
          </View>
          <Text style={styles.addWalletText}>Añadir Wallet</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  contentContainer: {
    gap: 16,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  walletItem: {
    padding: 16,
    borderRadius: 16,
    width: 180,
    height: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  currencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  walletContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  addWallet: {
    borderWidth: 2,
    borderColor: '#E8E0FF',
    backgroundColor: '#F8F5FF',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 16,
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addWalletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addWalletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7952FC',
    textAlign: 'center',
  },
});
