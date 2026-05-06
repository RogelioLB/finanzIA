// Home / Dashboard screen

function HomeScreen({ theme, accent, density }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { MXN, MXN_decimal, TRANSACTIONS } = window.FZ;

  const netWorth = 48732.50;
  const monthSpent = 12480;
  const monthBudget = 18500;
  const savings = 12300;
  const debtsRemaining = 102835;
  const nuToday = 23.40;
  const nuPct = 0.41;

  const recent = TRANSACTIONS.slice(0, 4);

  return (
    <div style={{ padding: `60px ${pad}px 120px`, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 18 : 24 }}>
        <div>
          <div style={{ fontSize: 13, color: theme.textSec, letterSpacing: -0.1 }}>Hola, Daniela</div>
          <div style={{ fontSize: 11, color: theme.textTer, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>Mayo 2026</div>
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 18, border: `1px solid ${theme.border}`,
          background: 'transparent', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }} onClick={() => window.FZ_navigate?.('settings')}>
          <window.Icon.Settings s={16} c={theme.text} w={1.5}/>
        </button>
      </div>

      {/* Net worth — hero */}
      <div style={{ marginBottom: compact ? 22 : 32 }}>
        <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
          Saldo neto
        </div>
        <div style={{
          fontFamily: 'Geist, sans-serif', fontWeight: 600,
          fontSize: 56, letterSpacing: -2.4, lineHeight: 1, color: theme.text,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {MXN_decimal(netWorth).split('.')[0]}<span style={{ color: theme.textTer, fontSize: 32, letterSpacing: -1 }}>.{MXN_decimal(netWorth).split('.')[1]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <window.Icon.TrendUp s={13} c={theme.good} w={2}/>
          <span style={{ fontSize: 13, color: theme.good, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>+$1,240</span>
          <span style={{ fontSize: 13, color: theme.textTer }}>este mes</span>
        </div>
      </div>

      {/* Month progress */}
      <div style={{
        background: theme.surface, borderRadius: 20, padding: compact ? 14 : 18,
        marginBottom: 12, border: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: theme.textSec }}>Gastado este mes</span>
          <span style={{ fontSize: 11, color: theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
            de {MXN(monthBudget)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            fontSize: 28, fontWeight: 600, letterSpacing: -1, fontVariantNumeric: 'tabular-nums',
          }}>{MXN(monthSpent)}</span>
          <span style={{
            fontSize: 12, fontVariantNumeric: 'tabular-nums', color: theme.textSec,
            fontWeight: 500,
          }}>{Math.round(monthSpent / monthBudget * 100)}%</span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: theme.surfaceAlt, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(100, monthSpent / monthBudget * 100)}%`,
            background: accent, borderRadius: 3,
          }}/>
        </div>
      </div>

      {/* 2-up summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <SummaryCard theme={theme} label="Ahorros" value={MXN(savings)} hint="3 metas activas" accent={accent}/>
        <SummaryCard theme={theme} label="Deudas" value={MXN(debtsRemaining)} hint="4 pendientes" accent={accent} muted/>
      </div>

      {/* Nu performance */}
      <div style={{
        background: theme.surface, borderRadius: 20, padding: compact ? 14 : 16,
        marginBottom: compact ? 18 : 24, border: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: theme.surfaceAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <window.Icon.TrendUp s={16} c={theme.text} w={1.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: theme.textSec }}>Inversión Nu · hoy</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            +${nuToday.toFixed(2)} <span style={{ color: theme.good, fontSize: 12, fontWeight: 500, marginLeft: 4 }}>+{nuPct}%</span>
          </div>
        </div>
        {/* tiny sparkline */}
        <svg width="56" height="22" viewBox="0 0 56 22" fill="none">
          <path d="M0 16 L8 14 L16 17 L24 11 L32 13 L40 8 L48 5 L56 2"
                stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Recent transactions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>Movimientos recientes</span>
        <button onClick={() => window.FZ_navigate?.('expenses')} style={{
          background: 'transparent', border: 'none', color: accent, fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', padding: 0,
        }}>Ver todos</button>
      </div>
      <div style={{
        background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden',
      }}>
        {recent.map((t, i) => <TxRow key={t.id} tx={t} theme={theme} accent={accent} isLast={i === recent.length - 1}/>)}
      </div>
    </div>
  );
}

function SummaryCard({ theme, label, value, hint, accent, muted = false }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: 20, padding: 14,
      border: `1px solid ${theme.border}`,
    }}>
      <div style={{ fontSize: 12, color: theme.textSec, marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums',
        color: muted ? theme.textSec : theme.text,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.textTer, marginTop: 4 }}>{hint}</div>
    </div>
  );
}

function TxRow({ tx, theme, accent, isLast }) {
  const I = window.Icon[tx.cat] || window.Icon.Bag;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: isLast ? 'none' : `0.5px solid ${theme.divider}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: theme.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <I s={18} c={theme.text} w={1.6}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.merchant}
        </div>
        <div style={{ fontSize: 11, color: theme.textTer, marginTop: 1 }}>{tx.when}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: theme.text }}>
        {window.FZ.MXN(tx.amount)}
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.TxRow = TxRow;
