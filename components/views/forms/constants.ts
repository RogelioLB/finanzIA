export interface CurrencyDef {
  code: string;
  symbol: string;
  label: string;
  flag: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "MXN", symbol: "$", label: "Peso mexicano", flag: "🇲🇽" },
  { code: "USD", symbol: "US$", label: "Dólar EE.UU.", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "Libra", flag: "🇬🇧" },
  { code: "CAD", symbol: "CA$", label: "Dólar canadiense", flag: "🇨🇦" },
  { code: "JPY", symbol: "¥", label: "Yen", flag: "🇯🇵" },
];

export const ICON_OPTIONS = [
  "Bank",
  "Card",
  "Cash",
  "Wallet",
  "PiggyBank",
  "Stocks",
  "Crypto",
  "Bag",
  "Bolt",
  "Home2",
  "Phone",
  "Education",
];

export const COLOR_OPTIONS = [
  "#FF6B35",
  "#0A84FF",
  "#34C759",
  "#AF52DE",
  "#FF375F",
  "#FFCC00",
  "#5AC8FA",
  "#A78BFA",
  "#F472B6",
  "#10B981",
  "#F59E0B",
  "#FAFAFA",
  "#820AD1",
  "#004481",
  "#EB0029",
  "#1DB954",
];

export const BANKS = [
  "BBVA",
  "Banorte",
  "Santander",
  "Banamex (Citibanamex)",
  "HSBC",
  "Scotiabank",
  "Nu",
  "Hey Banco",
  "Mercado Pago",
  "Klar",
  "Stori",
  "Inbursa",
  "Otro",
];
