import { currencies, Currency } from "@/constants/currencies";

/**
 * Obtiene el símbolo de moneda basado en el código de moneda
 * @param currency - Código de moneda (ej: 'MXN', 'USD')
 * @returns Símbolo de la moneda (ej: '$', '€')
 */
export const getCurrencySymbol = (currency: string = 'MXN'): string => {
  const currencyObj = currencies.find((c: Currency) => c.code === currency);
  return currencyObj?.symbol || "$";
};

/**
 * Formatea un monto con el símbolo de moneda y signo apropiado
 * @param amount - Cantidad a formatear
 * @param type - Tipo de transacción ('income' o 'expense')
 * @param currency - Código de moneda (opcional, por defecto 'MXN')
 * @returns Monto formateado con símbolo y signo
 */
export const formatAmount = (
  amount: number, 
  type: string, 
  currency: string = 'MXN'
): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return type === 'income' ? `+${symbol}${formattedAmount}` : `-${symbol}${formattedAmount}`;
};

/**
 * Formatea un monto simple con símbolo de moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (opcional, por defecto 'MXN')
 * @param decimals - Número de decimales (opcional, por defecto 2)
 * @returns Monto formateado con símbolo
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'MXN', 
  decimals: number = 2
): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formattedAmount}`;
};
