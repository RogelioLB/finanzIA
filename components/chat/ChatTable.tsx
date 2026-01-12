import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from "react-native";

interface ChatTableProps {
  headers: string[];
  rows: string[][];
}

export default function ChatTable({ headers, rows }: ChatTableProps) {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  // Calcular ancho de columnas
  const columnWidths = useMemo(() => {
    const minWidth = 100;
    const availableWidth = 100;

    return headers.map((header, index) => {
      // Calcular basado en contenido
      const maxContentLength = Math.max(
        header.length,
        ...rows.map((row) => (row[index] ? row[index].length : 0))
      );
      return Math.max(minWidth, maxContentLength * 8);
    });
  }, [headers, rows]);

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <View style={[styles.table, { minWidth: totalWidth }]}>
          {/* Headers */}
          <View style={styles.headerRow}>
            {headers.map((header, index) => (
              <View
                key={`header-${index}`}
                style={[
                  styles.headerCell,
                  { width: columnWidths[index] },
                ]}
              >
                <Text
                  style={styles.headerText}
                  numberOfLines={1}
                >
                  {header}
                </Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {rows.map((row, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={[
                styles.bodyRow,
                rowIndex % 2 === 0 && styles.alternateRow,
              ]}
            >
              {headers.map((_, colIndex) => (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.bodyCell,
                    { width: columnWidths[colIndex] },
                  ]}
                >
                  <Text
                    style={styles.bodyText}
                    numberOfLines={2}
                  >
                    {row[colIndex] || "-"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  table: {
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#7952FC",
    borderBottomWidth: 1,
    borderBottomColor: "#6B40DC",
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  alternateRow: {
    backgroundColor: "#F9FAFB",
  },
  bodyCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  bodyText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
});
