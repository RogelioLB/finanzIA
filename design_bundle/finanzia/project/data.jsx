// Theme system + data for FinanzIA

const THEME_LIGHT = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F5',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',
  text: '#0A0A0A',
  textSec: 'rgba(10,10,10,0.62)',
  textTer: 'rgba(10,10,10,0.40)',
  divider: 'rgba(0,0,0,0.06)',
  good: '#0F8A3F',
  bad: '#D14343',
  fabShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
  navBg: 'rgba(255,255,255,0.92)',
  isDark: false,
};

const THEME_DARK = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#1C1C1E',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text: '#FAFAFA',
  textSec: 'rgba(250,250,250,0.62)',
  textTer: 'rgba(250,250,250,0.38)',
  divider: 'rgba(255,255,255,0.06)',
  good: '#3DDC84',
  bad: '#FF6B6B',
  fabShadow: '0 10px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
  navBg: 'rgba(20,20,20,0.92)',
  isDark: true,
};

function getTheme(mode) { return mode === 'light' ? THEME_LIGHT : THEME_DARK; }

// Format helpers
const MXN = (n, withSign = false) => {
  const sign = n < 0 ? '−' : (withSign && n > 0 ? '+' : '');
  const abs = Math.abs(Math.round(n));
  const fmt = abs.toLocaleString('es-MX');
  return `${sign}$${fmt}`;
};
const MXN_decimal = (n) => {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Sample data — realistic Mexican household
const TRANSACTIONS = [
  { id: 't1', merchant: 'Mercado Roma', cat: 'Food', amount: -487, method: 'card', when: 'Hoy · 14:23' },
  { id: 't2', merchant: 'Uber', cat: 'Transport', amount: -132, method: 'card', when: 'Hoy · 09:11' },
  { id: 't3', merchant: 'Spotify', cat: 'Fun', amount: -169, method: 'card', when: 'Ayer' },
  { id: 't4', merchant: 'OXXO', cat: 'Food', amount: -85, method: 'cash', when: 'Ayer' },
  { id: 't5', merchant: 'CFE', cat: 'Home2', amount: -892, method: 'debit', when: '28 abr' },
  { id: 't6', merchant: 'Rappi', cat: 'Food', amount: -245, method: 'credit', when: '27 abr' },
  { id: 't7', merchant: 'Farmacia del Ahorro', cat: 'Health', amount: -340, method: 'debit', when: '26 abr' },
  { id: 't8', merchant: 'Cinépolis', cat: 'Fun', amount: -180, method: 'credit', when: '25 abr' },
];

const DEBTS = [
  { id: 'd1', name: 'Tarjeta Nu', original: 18500, paid: 11200, monthly: 1850, due: 'Sep 2026', apr: '34.9%' },
  { id: 'd2', name: 'Préstamo familiar', original: 25000, paid: 22000, monthly: 1500, due: 'Jul 2026', apr: '0%' },
  { id: 'd3', name: 'BBVA Crédito Auto', original: 142000, paid: 38400, monthly: 3200, due: 'Mar 2030', apr: '12.4%' },
  { id: 'd4', name: 'MSI iPhone', original: 24999, paid: 20832, monthly: 2083, due: 'Oct 2026', apr: '0%' },
];

const ENVELOPES = [
  { id: 'e1', name: 'Despensa', icon: 'Food', budget: 6500, spent: 4820 },
  { id: 'e2', name: 'Transporte', icon: 'Transport', budget: 1500, spent: 1380 },
  { id: 'e3', name: 'Entretenimiento', icon: 'Fun', budget: 1200, spent: 1340 },
  { id: 'e4', name: 'Servicios', icon: 'Bolt', budget: 2400, spent: 1892 },
  { id: 'e5', name: 'Salud', icon: 'Health', budget: 1000, spent: 340 },
  { id: 'e6', name: 'Renta', icon: 'Home2', budget: 12000, spent: 12000 },
  { id: 'e7', name: 'Mascota', icon: 'Pet', budget: 800, spent: 215 },
  { id: 'e8', name: 'Educación', icon: 'Education', budget: 1500, spent: 0 },
];

const CATEGORIES = [
  { id: 'food', label: 'Comida', icon: 'Food' },
  { id: 'transport', label: 'Transporte', icon: 'Transport' },
  { id: 'fun', label: 'Diversión', icon: 'Fun' },
  { id: 'home', label: 'Hogar', icon: 'Home2' },
  { id: 'health', label: 'Salud', icon: 'Health' },
  { id: 'shop', label: 'Compras', icon: 'Bag' },
  { id: 'bills', label: 'Servicios', icon: 'Bolt' },
  { id: 'edu', label: 'Educación', icon: 'Education' },
];

// Banking accounts
const ACCOUNTS = [
  { id: 'a1', name: 'BBVA Débito',     type: 'debit',   bank: 'BBVA',         last4: '4892', balance: 18420.50, color: '#004481' },
  { id: 'a2', name: 'Nu Crédito',       type: 'credit',  bank: 'Nu',           last4: '7723', balance: -11200,    limit: 30000, color: '#820AD1' },
  { id: 'a3', name: 'Banorte Nómina',   type: 'debit',   bank: 'Banorte',      last4: '1147', balance: 24890,     color: '#EB0029' },
  { id: 'a4', name: 'Santander Oro',    type: 'credit',  bank: 'Santander',    last4: '0331', balance: -4250,     limit: 50000, color: '#EC0000' },
  { id: 'a5', name: 'Efectivo',         type: 'cash',    bank: null,           last4: null,   balance: 1850,      color: '#3DDC84' },
  { id: 'a6', name: 'Mercado Pago',     type: 'wallet',  bank: 'Mercado Pago', last4: null,   balance: 3420,      color: '#00B1EA' },
];

// Investments
const INVESTMENTS = [
  { id: 'i1', name: 'CETES 28 días',     type: 'bond',  symbol: 'CETES',  shares: null, value: 25000, cost: 24100, change1d: 0.04 },
  { id: 'i2', name: 'NAFTRAC',            type: 'etf',   symbol: 'NAFTRAC', shares: 142,  value: 8420,  cost: 7800,  change1d: 0.82 },
  { id: 'i3', name: 'Voo (S&P 500)',      type: 'etf',   symbol: 'VOO',    shares: 4.2,  value: 12380, cost: 9600,  change1d: 1.21 },
  { id: 'i4', name: 'Bitcoin',            type: 'crypto', symbol: 'BTC',   shares: 0.018, value: 18900, cost: 14200, change1d: -2.14 },
  { id: 'i5', name: 'Caja de ahorro Nu',  type: 'savings', symbol: 'NU',   shares: null,  value: 12300, cost: 12000, change1d: 0.03 },
];

// 12 months of expense data — 6 back, current (idx 6), 5 forward (projected)
const MONTH_DATA = [
  { key: '2025-11', label: 'Nov', year: 2025, total: 14820, income: 28500, projected: false, byCat: { Food: 4820, Transport: 1280, Fun: 920,  Home2: 5400, Health: 280,  Bag: 980, Bolt: 1140 } },
  { key: '2025-12', label: 'Dic', year: 2025, total: 19340, income: 32000, projected: false, byCat: { Food: 5240, Transport: 1380, Fun: 2840, Home2: 5400, Health: 420,  Bag: 2920, Bolt: 1140 } },
  { key: '2026-01', label: 'Ene', year: 2026, total: 13280, income: 28500, projected: false, byCat: { Food: 4120, Transport: 1180, Fun: 720,  Home2: 5400, Health: 580,  Bag: 320,  Bolt: 960 } },
  { key: '2026-02', label: 'Feb', year: 2026, total: 12940, income: 28500, projected: false, byCat: { Food: 3980, Transport: 1240, Fun: 880,  Home2: 5400, Health: 420,  Bag: 460,  Bolt: 560 } },
  { key: '2026-03', label: 'Mar', year: 2026, total: 15620, income: 29200, projected: false, byCat: { Food: 4680, Transport: 1420, Fun: 1240, Home2: 5400, Health: 1340, Bag: 720,  Bolt: 820 } },
  { key: '2026-04', label: 'Abr', year: 2026, total: 13180, income: 28500, projected: false, byCat: { Food: 4280, Transport: 1320, Fun: 920,  Home2: 5400, Health: 280,  Bag: 380,  Bolt: 600 } },
  { key: '2026-05', label: 'May', year: 2026, total: 12480, income: 28500, projected: false, current: true, byCat: { Food: 4820, Transport: 1380, Fun: 1340, Home2: 3000, Health: 340, Bag: 920, Bolt: 680 } },
  { key: '2026-06', label: 'Jun', year: 2026, total: 13800, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1100, Home2: 5400, Health: 400, Bag: 500, Bolt: 600 } },
  { key: '2026-07', label: 'Jul', year: 2026, total: 14200, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1500, Home2: 5400, Health: 400, Bag: 500, Bolt: 600 } },
  { key: '2026-08', label: 'Ago', year: 2026, total: 13800, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1100, Home2: 5400, Health: 400, Bag: 500, Bolt: 600 } },
  { key: '2026-09', label: 'Sep', year: 2026, total: 14500, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1100, Home2: 5400, Health: 400, Bag: 1200, Bolt: 600 } },
  { key: '2026-10', label: 'Oct', year: 2026, total: 13800, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1100, Home2: 5400, Health: 400, Bag: 500, Bolt: 600 } },
  { key: '2026-11', label: 'Nov', year: 2026, total: 14000, income: 28500, projected: true,  byCat: { Food: 4500, Transport: 1300, Fun: 1100, Home2: 5400, Health: 400, Bag: 700, Bolt: 600 } },
];

const CAT_LABELS = { Food: 'Comida', Transport: 'Transporte', Fun: 'Diversión', Home2: 'Hogar', Health: 'Salud', Bag: 'Compras', Bolt: 'Servicios', Education: 'Educación' };

// Recurring payments — subscriptions + income
// type: 'income' | 'subscription'
// freq: 'monthly' | 'yearly' | 'biweekly'
// dayOfMonth or dayOfYear used for next-due calculation
const RECURRING = [
  { id: 'r1', name: 'Salario',           type: 'income',       amount: 28500, freq: 'monthly',  dayOfMonth: 15, account: 'a3', icon: 'Bag',     color: '#3DDC84', active: true },
  { id: 'r2', name: 'Freelance UX',      type: 'income',       amount: 8500,  freq: 'monthly',  dayOfMonth: 28, account: 'a1', icon: 'Bag',     color: '#3DDC84', active: true },
  { id: 'r3', name: 'Renta',             type: 'subscription', amount: -12000, freq: 'monthly', dayOfMonth: 1,  account: 'a1', icon: 'Home2',   color: '#FF9500', active: true },
  { id: 'r4', name: 'CFE',               type: 'subscription', amount: -892,  freq: 'monthly',  dayOfMonth: 28, account: 'a1', icon: 'Bolt',    color: '#FFCC00', active: true },
  { id: 'r5', name: 'Spotify',           type: 'subscription', amount: -169,  freq: 'monthly',  dayOfMonth: 4,  account: 'a2', icon: 'Fun',     color: '#1DB954', active: true },
  { id: 'r6', name: 'Netflix',           type: 'subscription', amount: -299,  freq: 'monthly',  dayOfMonth: 12, account: 'a2', icon: 'Fun',     color: '#E50914', active: true },
  { id: 'r7', name: 'YouTube Premium',   type: 'subscription', amount: -139,  freq: 'monthly',  dayOfMonth: 7,  account: 'a2', icon: 'Fun',     color: '#FF0000', active: true },
  { id: 'r8', name: 'Claude Pro',        type: 'subscription', amount: -380,  freq: 'monthly',  dayOfMonth: 18, account: 'a2', icon: 'Bolt',    color: '#D97757', active: true },
  { id: 'r9', name: 'iCloud+',           type: 'subscription', amount: -49,   freq: 'monthly',  dayOfMonth: 22, account: 'a2', icon: 'Phone',   color: '#0A84FF', active: true },
  { id: 'r10', name: 'Gym Smart Fit',    type: 'subscription', amount: -550,  freq: 'monthly',  dayOfMonth: 5,  account: 'a3', icon: 'Health',  color: '#FF375F', active: true },
  { id: 'r11', name: 'Internet Totalplay', type: 'subscription', amount: -699, freq: 'monthly', dayOfMonth: 10, account: 'a1', icon: 'Phone',   color: '#7B1FA2', active: true },
  { id: 'r12', name: 'Adobe Creative',   type: 'subscription', amount: -890,  freq: 'monthly',  dayOfMonth: 14, account: 'a2', icon: 'Education', color: '#FF0000', active: false },
];

const ACCENT_PALETTE = [
  '#FF6B35', // Orange (default)
  '#0A84FF', // Blue
  '#34C759', // Green
  '#AF52DE', // Purple
  '#FF375F', // Red
  '#FFCC00', // Yellow
  '#5AC8FA', // Cyan
  '#A78BFA', // Lavender
  '#F472B6', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#FAFAFA', // Mono (white)
];

window.FZ = {
  THEME_LIGHT, THEME_DARK, getTheme,
  MXN, MXN_decimal,
  TRANSACTIONS, DEBTS, ENVELOPES, CATEGORIES, ACCENT_PALETTE,
  ACCOUNTS, INVESTMENTS, MONTH_DATA, CAT_LABELS, RECURRING,
};
