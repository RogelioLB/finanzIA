export function MXN(n: number, withSign: boolean = false): string {
  const sign = n < 0 ? '−' : (withSign && n > 0 ? '+' : '');
  const abs = Math.abs(Math.round(n));
  const fmt = abs.toLocaleString('es-MX');
  return `${sign}$${fmt}`;
}

export function MXN_decimal(n: number): string {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyForDisplay(
  amount: number,
  currency: string = 'MXN',
  withSign: boolean = false
): string {
  if (currency === 'MXN') {
    return MXN(amount, withSign);
  }
  const sign = amount < 0 ? '-' : (withSign && amount > 0 ? '+' : '');
  const fmt = Math.abs(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currency} ${fmt}`;
}