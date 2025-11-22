import TransitionLayout from "@/components/ui/TransitionLayout";
import { useTransactions } from "@/contexts/TransactionsContext";
import {
  calculateTransactionStats,
  filterTransactionsByMonth,
  formatAmount,
  formatDate,
  getCurrencySymbol,
  getMonthName,
  sortTransactionsByDate,
} from "@/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface MonthTab {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
}

interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: string;
  timestamp: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
}

export default function HistoryScreen() {
  const { transactions, loading } = useTransactions();
  const scrollViewRef = useRef<ScrollView>(null);
  const transactionsListRef = useRef<FlatList>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(6); // Mes actual en el centro
  const indicatorPosition = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = 80;

  // Referencias para cada tab para poder medir su posición
  const tabRefs = useRef<(View | null)[]>([]);

  // Generar tabs de meses (6 antes, actual, 6 después)
  const monthTabs = useMemo(() => {
    const tabs: MonthTab[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Generar 13 meses (6 antes, actual, 6 después)
    for (let i = -6; i <= 6; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();

      tabs.push({
        month,
        year,
        label: getMonthName(month),
        shortLabel: getMonthName(month, true),
      });
    }

    return tabs;
  }, []);

  // Función para obtener una fecha formateada para encabezados de sección
  const getSectionHeaderDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    // Capitalizar primera letra
    const formatted = date.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Función para agrupar transacciones por día
  const groupByDay = useCallback((transactions: TransactionItem[]) => {
    const groups: Record<string, TransactionItem[]> = {};
    
    // Primero ordenamos por fecha
    const sorted = sortTransactionsByDate(transactions);
    
    // Agrupamos por día
    sorted.forEach((transaction) => {
      // Convertir timestamp a fecha sin hora
      const date = new Date(transaction.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      
      groups[dayKey].push(transaction);
    });
    
    // Convertir a formato para secciones
    return Object.entries(groups).map(([dayKey, items]) => {
      return {
        date: new Date(items[0].timestamp),
        title: getSectionHeaderDate(items[0].timestamp),
        data: items
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Ordenar por fecha descendente (más reciente primero)
  }, []);
  
  // Agrupar transacciones por mes
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, {title: string; data: TransactionItem[]; date: Date}[]> = {};

    // Procesar cada mes y agrupar las transacciones
    monthTabs.forEach((tab) => {
      const monthKey = `${tab.year}-${tab.month}`;
      const filtered = filterTransactionsByMonth(
        transactions,
        tab.month,
        tab.year
      );
      grouped[monthKey] = groupByDay(filtered);
    });

    return grouped;
  }, [transactions, monthTabs, groupByDay]);

  // Obtener transacciones para el mes seleccionado
  const filteredTransactions = useMemo(() => {
    const selectedTab = monthTabs[selectedTabIndex];
    if (!selectedTab) return [];

    const monthKey = `${selectedTab.year}-${selectedTab.month}`;
    return groupedTransactions[monthKey] || [];
  }, [groupedTransactions, selectedTabIndex, monthTabs]);

  // Calcular estadísticas del mes
  const monthStats = useMemo(() => {
    // Si las transacciones están agrupadas, necesitamos extraer todas las transacciones de todos los grupos
    const flatTransactions = filteredTransactions.length > 0 && Array.isArray(filteredTransactions[0]?.data)
      ? filteredTransactions.flatMap(section => section.data)
      : [];

    return calculateTransactionStats(flatTransactions);
  }, [filteredTransactions]);

  // Las funciones de formato ahora se importan desde utils

  // Manejador para cambio de pestaña
  const handleTabPress = (index: number) => {
    setSelectedTabIndex(index);

    // Actualizamos la posición del indicador inmediatamente
    // para que coincida con el tab seleccionado
    indicatorPosition.value = withSpring(index * tabWidth + index * 8);

    // Medimos la posición exacta del tab seleccionado para hacer scroll
    if (tabRefs.current[index]) {
      tabRefs.current[index]?.measureLayout(
        // @ts-ignore - Este método existe pero tiene problemas de tipado
        scrollViewRef.current,
        (x: number, y: number, width: number, height: number) => {
          // Calculamos la posición para centrar el tab en la pantalla
          const scrollToX = x - screenWidth / 2 + width / 2;

          // Ejecutamos el scroll con animación
          scrollViewRef.current?.scrollTo({
            x: Math.max(0, scrollToX),
            animated: true,
          });
        },
        () => console.log("Measurement failed")
      );
    }

    // Deslizar la lista de transacciones al mes seleccionado
    transactionsListRef.current?.scrollToIndex({
      index: index,
      animated: true,
    });
  };

  // Manejador para cuando se desliza la vista de transacciones
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== selectedTabIndex && index !== null) {
          setSelectedTabIndex(index);
          indicatorPosition.value = withSpring(index * tabWidth + index * 8);

          // Actualizamos la posición del tab para que quede centrado
          if (tabRefs.current[index]) {
            tabRefs.current[index]?.measureLayout(
              // @ts-ignore
              scrollViewRef.current,
              (x: number, y: number, width: number, height: number) => {
                const scrollToX = x - screenWidth / 2 + width / 2;
                scrollViewRef.current?.scrollTo({
                  x: Math.max(0, scrollToX),
                  animated: true,
                });
              },
              () => console.log("Measurement failed on swipe")
            );
          }
        }
      }
    },
    [selectedTabIndex, tabWidth, screenWidth, indicatorPosition]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Centrar el mes actual al cargar
  useEffect(() => {
    // Dar tiempo para que el layout se complete
    setTimeout(() => {
      // Iniciamos con el indicador en la posición correcta
      indicatorPosition.value = 6 * tabWidth + 6 * 8;

      // Medimos la posición del tab inicial (6)
      if (tabRefs.current[6]) {
        tabRefs.current[6]?.measureLayout(
          // @ts-ignore - Este método existe pero tiene problemas de tipado
          scrollViewRef.current,
          (x: number, y: number, width: number, height: number) => {
            // Calculamos la posición para centrar el tab en la pantalla
            const initialScrollX = x - screenWidth / 2 + width / 2;

            // Aplicamos scroll inicial sin animación
            scrollViewRef.current?.scrollTo({
              x: Math.max(0, initialScrollX),
              animated: false,
            });

            // También posicionamos la lista de transacciones en el mes inicial
            transactionsListRef.current?.scrollToIndex({
              index: 6,
              animated: false,
            });
          },
          () => console.log("Initial measurement failed")
        );
      } else {
        // Fallback si no podemos medir
        const fallbackScrollX = 6 * tabWidth - screenWidth / 2 + tabWidth / 2;

        scrollViewRef.current?.scrollTo({
          x: Math.max(0, fallbackScrollX),
          animated: false,
        });

        // También posicionamos la lista de transacciones en el mes inicial
        transactionsListRef.current?.scrollToIndex({
          index: 6,
          animated: false,
        });
      }
    }, 300); // Aumentamos el tiempo para asegurar que el layout esté completo
  }, [indicatorPosition, tabWidth, screenWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      // Añadimos el paddingLeft para compensar el padding del ScrollView
      // y hacer que el indicador se alinee correctamente con las pestañas
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  // Renderiza el encabezado de la fecha con un diseño mejorado
  const renderSectionHeader = ({ section }: { section: {title: string; date: Date} }) => {
    // Obtenemos el día del mes y el día de la semana para destacarlos visualmente
    const dayNumber = section.date.getDate();
    const isToday = new Date().setHours(0,0,0,0) === new Date(section.date).setHours(0,0,0,0);
    
    return (
      <Animated.View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <View style={styles.dateNumberContainer}>
            <Text style={styles.dayNumber}>{dayNumber}</Text>
          </View>
          <View style={styles.dateTextContainer}>
            <Text style={styles.sectionHeaderText}>
              {section.title}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>HOY</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };
  
  const renderTransactionItem = ({ item }: { item: TransactionItem }) => (
    <View style={styles.transactionItem}>
      <View
        style={{
          ...styles.transactionIcon,
          backgroundColor: item.category_color,
        }}
      >
        <Text style={styles.categoryIcon}>
          {item.category_icon || (item.type === "income" ? "💰" : "💸")}
        </Text>
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.categoryName}>
            {item.category_name || "Sin categoría"}
          </Text>
          <Text style={styles.walletName}>{item.wallet_name || "Wallet"}</Text>
        </View>
      </View>

      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.amountText,
            { color: item.type === "income" ? "#4CAF50" : "#FF6B6B" },
          ]}
        >
          {formatAmount(item.amount, item.type)}
        </Text>
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <TransitionLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.subtitle}>
            {monthTabs[selectedTabIndex]?.label}{" "}
            {monthTabs[selectedTabIndex]?.year}
          </Text>
        </View>

        {/* Month Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ingresos</Text>
            <Text style={[styles.statValue, { color: "#4CAF50" }]}>
              {formatAmount(monthStats.income, "income")}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gastos</Text>
            <Text style={[styles.statValue, { color: "#FF6B6B" }]}>
              {formatAmount(monthStats.expenses, "expense")}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text
              style={[
                styles.statValue,
                { color: monthStats.net >= 0 ? "#4CAF50" : "#FF6B6B" },
              ]}
            >
              {getCurrencySymbol()}
              {monthStats.net.toLocaleString("es-MX")}
            </Text>
          </View>
        </View>

        {/* Month Tabs */}
        <View style={styles.tabsContainer}>
          {/* Indicador posicionado absolutamente respecto al contenedor principal */}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              // Padding horizontal al inicio y final para permitir que las pestañas de los extremos se centren
              paddingLeft: screenWidth / 2 - tabWidth / 2,
              paddingRight: screenWidth / 2 - tabWidth / 2,
              // Añadimos paddingBottom para dar espacio al indicador
              paddingBottom: 8,
            }}
          >
            {/* Contenedor de tabs en fila */}
            <View style={styles.tabsRow}>
              {/* Tabs */}
              {monthTabs.map((tab, index) => (
                <TouchableOpacity
                  ref={(el) => {
                    // Asignando de esta forma evitamos el retorno implícito
                    tabRefs.current[index] = el;
                  }}
                  key={`${tab.year}-${tab.month}`}
                  style={[
                    styles.tab,
                    selectedTabIndex === index && styles.activeTab,
                  ]}
                  onPress={() => handleTabPress(index)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTabIndex === index && styles.activeTabText,
                    ]}
                  >
                    {tab.shortLabel}
                  </Text>
                  <Text
                    style={[
                      styles.tabYear,
                      selectedTabIndex === index && styles.activeTabYear,
                    ]}
                  >
                    {tab.year}
                  </Text>
                </TouchableOpacity>
              ))}
              <Animated.View
                style={[styles.indicator, animatedIndicatorStyle]}
                testID="tab-indicator"
              />
            </View>
          </ScrollView>
        </View>

        {/* Vista deslizable de transacciones por mes */}
        {loading ? (
          <View style={styles.transactionsContainer}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando transacciones...</Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={transactionsListRef}
            horizontal
            pagingEnabled
            data={monthTabs}
            keyExtractor={(item) => `${item.year}-${item.month}`}
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialScrollIndex={selectedTabIndex}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            style={styles.transactionsContainer}
            renderItem={({ item, index }) => {
              // Obtener transacciones para este mes
              const monthKey = `${item.year}-${item.month}`;
              const monthTransactions = groupedTransactions[monthKey] || [];

              return (
                <View
                  style={[styles.monthPageContainer, { width: screenWidth }]}
                >
                  {monthTransactions.length > 0 ? (
                    <>
                      <SectionList
                        sections={monthTransactions}
                        renderItem={renderTransactionItem}
                        renderSectionHeader={renderSectionHeader}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.transactionsList}
                        ListFooterComponent={() => (
                          <View style={styles.footer}>
                            <Text style={styles.footerText}>
                              Flujo total de dinero: {formatAmount(monthStats.net, monthStats.net >= 0 ? 'income' : 'expense')}
                            </Text>
                            <Text style={styles.footerText}>
                              Total de transacciones: {
                                monthTransactions.reduce((total, section) => total + section.data.length, 0)
                              }
                            </Text>
                          </View>
                        )}
                        stickySectionHeadersEnabled={true}
                      />
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>📊</Text>
                      <Text style={styles.emptyTitle}>Sin transacciones</Text>
                      <Text style={styles.emptySubtitle}>
                        No hay transacciones en {item.label} {item.year}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7c3aed',
  },
  dateTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    flex: 1,
  },
  todayBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  monthPageContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabsContainer: {
    position: "relative",
    marginBottom: 20,
    overflow: "visible", // Permite que el indicador sea visible fuera del contenedor
  },
  tabsRow: {
    flexDirection: "row",
  },

  tab: {
    width: 80,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  activeTab: {
    // El indicador visual se maneja con el Animated.View
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
  },
  activeTabText: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  tabYear: {
    fontSize: 11,
    color: "#4B5563",
  },
  activeTabYear: {
    color: "#8B5CF6",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0, // Fijamos la posición izquierda en 0
    height: 3,
    width: 80, // Ancho igual al de un tab
    backgroundColor: "#8B5CF6",
    borderRadius: 2,
    zIndex: 10, // Aseguramos que esté por encima de otros elementos
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    //Color de fondo purpura pero claro para que se vea bien
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    gap: 8,
  },
  categoryName: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  walletName: {
    fontSize: 12,
    color: "#6B7280",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
