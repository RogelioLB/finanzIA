// FinanzIA icon set — simple stroke icons. All accept size + color.
const Icon = {
  Home: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  List: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h10"/>
    </svg>
  ),
  Debt: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2"/>
      <path d="M3 11h18"/>
    </svg>
  ),
  Envelope: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 8l9 6 9-6"/>
    </svg>
  ),
  Plus: ({ s = 22, c = 'currentColor', w = 2 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Close: ({ s = 22, c = 'currentColor', w = 1.7 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Mic: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
    </svg>
  ),
  Back: ({ s = 22, c = 'currentColor', w = 1.7 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6"/>
    </svg>
  ),
  Chevron: ({ s = 16, c = 'currentColor', w = 1.7 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  ),
  Settings: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Sun: ({ s = 20, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
  Moon: ({ s = 20, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Check: ({ s = 16, c = 'currentColor', w = 2.2 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-11"/>
    </svg>
  ),
  TrendUp: ({ s = 14, c = 'currentColor', w = 1.8 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8"/>
      <path d="M14 7h7v7"/>
    </svg>
  ),
  TrendDown: ({ s = 14, c = 'currentColor', w = 1.8 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l6 6 4-4 8 8"/>
      <path d="M14 17h7v-7"/>
    </svg>
  ),
  Backspace: ({ s = 22, c = 'currentColor', w = 1.7 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 5H9l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/>
      <path d="M14 9l4 4M18 9l-4 4"/>
    </svg>
  ),
  // Category glyphs
  Food: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7a3 3 0 0 0 3 3v10M9 2v7a3 3 0 0 1-3 3M15 14v8M15 4c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v8h-3v10"/>
    </svg>
  ),
  Transport: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17l1.5-7h11L19 17M5 17v3M19 17v3"/>
      <circle cx="8" cy="14" r="1"/>
      <circle cx="16" cy="14" r="1"/>
    </svg>
  ),
  Fun: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 10h.01M15 10h.01M8 15c1 1.5 2.5 2 4 2s3-.5 4-2"/>
    </svg>
  ),
  Home2: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  Health: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>
    </svg>
  ),
  Bag: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0"/>
    </svg>
  ),
  Bolt: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
    </svg>
  ),
  Phone: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2"/>
      <path d="M11 18h2"/>
    </svg>
  ),
  Education: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9l10-5 10 5-10 5z"/>
      <path d="M6 11v5c0 2 3 3 6 3s6-1 6-3v-5"/>
    </svg>
  ),
  Pet: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/>
      <circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/>
      <path d="M12 12c-3 0-6 3-6 6 0 2 2 3 4 3l2-1 2 1c2 0 4-1 4-3 0-3-3-6-6-6z"/>
    </svg>
  ),
  Wallet: ({ s = 18, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h13V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2"/>
      <circle cx="16.5" cy="13" r="1"/>
    </svg>
  ),
  Card: ({ s = 18, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2"/>
      <path d="M3 10h18"/>
    </svg>
  ),
  Cash: ({ s = 18, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="11" rx="1.5"/>
      <circle cx="12" cy="12.5" r="2.5"/>
      <path d="M5 10v5M19 10v5"/>
    </svg>
  ),
  Dots: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
    </svg>
  ),
  Bank: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>
    </svg>
  ),
  Crypto: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 7v10M9 9h4.5a2 2 0 010 4H9M9 13h5a2 2 0 010 4H9M11 5v3M11 16v3"/>
    </svg>
  ),
  Stocks: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18M6 20V10M11 20V6M16 20V13M21 20V8"/>
    </svg>
  ),
  PiggyBank: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a7 7 0 0114 0v3l2 1v3h-3l-1 2h-3v-2H9v2H6v-3a7 7 0 01-3-6z"/>
      <circle cx="15" cy="11" r="0.8" fill={c}/>
      <path d="M9 7s1.5-2 4-2 4 2 4 2"/>
    </svg>
  ),
  Bond: ({ s = 22, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M7 9h10M7 13h6M7 17h4"/>
    </svg>
  ),
  Eye: ({ s = 18, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: ({ s = 18, c = 'currentColor', w = 1.6 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.2 1.5M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.2-1.5M3 3l18 18M9 9a4 4 0 015 5"/>
    </svg>
  ),
};
window.Icon = Icon;
