import { Wallet, Category, Objective } from "@/lib/database/sqliteService";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Type for transaction display data (from TransactionsContext)
interface TransactionDisplay {
  id: string;
  title: string;
  amount: number;
  type: string;
  timestamp: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
  is_excluded: number;
  is_subscription?: number;
  subscription_frequency?: string | null;
  next_payment_date?: number;
}

/**
 * Converts transactions to CSV format
 */
export function transactionsToCSV(transactions: TransactionDisplay[]): string {
  const headers = [
    "ID",
    "Fecha",
    "Titulo",
    "Tipo",
    "Monto",
    "Categoria",
    "Wallet",
    "Es Suscripcion",
    "Frecuencia",
    "Excluida",
  ];

  const rows = transactions.map((t) => [
    t.id,
    new Date(t.timestamp).toISOString(),
    `"${(t.title || "").replace(/"/g, '""')}"`,
    t.type,
    t.amount.toString(),
    `"${(t.category_name || "Sin categoria").replace(/"/g, '""')}"`,
    `"${(t.wallet_name || "").replace(/"/g, '""')}"`,
    t.is_subscription === 1 ? "Si" : "No",
    t.subscription_frequency || "",
    t.is_excluded === 1 ? "Si" : "No",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  return csvContent;
}

/**
 * Converts wallets to CSV format
 */
export function walletsToCSV(wallets: Wallet[]): string {
  const headers = ["ID", "Nombre", "Balance", "Balance Neto", "Moneda", "Icono", "Color"];

  const rows = wallets.map((w) => [
    w.id,
    `"${(w.name || "").replace(/"/g, '""')}"`,
    w.balance.toString(),
    (w.net_balance || w.balance).toString(),
    w.currency,
    w.icon || "",
    w.color || "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  return csvContent;
}

/**
 * Converts categories to CSV format
 */
export function categoriesToCSV(categories: any[]): string {
  const headers = ["ID", "Nombre", "Icono", "Color", "Es Ingreso"];

  const rows = categories.map((c) => [
    c.id,
    `"${(c.name || "").replace(/"/g, '""')}"`,
    c.icon || "",
    c.color || "",
    c.is_income === true || c.is_income === 1 ? "Si" : "No",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  return csvContent;
}

/**
 * Converts objectives to CSV format
 */
export function objectivesToCSV(objectives: any[]): string {
  const headers = [
    "ID",
    "Titulo",
    "Monto Objetivo",
    "Monto Actual",
    "Tipo",
    "Fecha Límite",
  ];

  const rows = objectives.map((o) => [
    o.id,
    `"${(o.title || "").replace(/"/g, '""')}"`,
    o.amount.toString(),
    o.current_amount.toString(),
    o.type,
    o.due_date ? new Date(o.due_date).toISOString() : "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  return csvContent;
}

/**
 * Exports the entire database file
 */
export async function exportDatabase(): Promise<boolean> {
  try {
    const dbName = "financeapp.db";
    const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

    // Check if the database file exists
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      console.error("[Export] Database file not found at:", dbPath);
      return false;
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error("[Export] Sharing is not available on this device");
      return false;
    }

    // Share the file
    await Sharing.shareAsync(dbPath, {
      dialogTitle: "Copia de seguridad de FinanzIA",
      UTI: "public.database", // General UTI for database files
    });

    return true;
  } catch (error) {
    console.error("[Export] Error exporting database:", error);
    return false;
  }
}

/**
 * Exports data to a CSV file and opens the share dialog
 */
export async function exportToCSV(
  data: string,
  filename: string
): Promise<boolean> {
  try {
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // Write the CSV content to a file
    await FileSystem.writeAsStringAsync(fileUri, data, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error("[Export] Sharing is not available on this device");
      return false;
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Exportar datos de FinanzIA",
      UTI: "public.comma-separated-values-text",
    });

    return true;
  } catch (error) {
    console.error("[Export] Error exporting CSV:", error);
    return false;
  }
}

/**
 * Generates a filename with the current date
 */
export function generateFilename(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}_${dateStr}.csv`;
}
