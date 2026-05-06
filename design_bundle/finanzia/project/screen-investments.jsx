// Investments screen — portfolio with performance chart and holdings

function InvestmentsScreen({ theme, accent, density, onClose }) {
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const { INVESTMENTS, MXN } = window.FZ;
  const [range, setRange] = React.useState('1M');

  const totalValue = INVESTMENTS.reduce((s, i) => s + i.value, 0);
  const totalCost = INVESTMENTS.reduce((s, i) => s + i.cost, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = (totalGain / totalCost) * 100;

  // Generated chart data per range
  const chartPoints = generateSeries(range, totalValue);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.bg, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
      {/* Header */}
      <div style={{
        padding: `60px ${pad}px 16px`, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: theme.surfaceAlt, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: theme.text,
        }}>
          <window.Icon.Back s={18} c={theme.text} w={1.7}/>
        </button>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>Inversiones</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `8px 0 40px` }}>
        {/* Hero portfolio value */}
        <div style={{ padding: `4px ${pad}px 16px` }}>
          <div style={{ fontSize: 12, color: theme.textSec, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
            Valor del portafolio
          </div>
          <div style={{
            fontSize: 44, fontWeight: 600, letterSpacing: -2, fontVariantNumeric: 'tabular-nums',
            lineHeight: 1, marginBottom: 8,
          }}>{MXN(totalValue)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {totalGain >= 0
              ? <window.Icon.TrendUp s={13} c={theme.good} w={2}/>
              : <window.Icon.TrendDown s={13} c={theme.bad} w={2}/>}
            <span style={{
              fontSize: 14, fontWeight: 500,
              color: totalGain >= 0 ? theme.good : theme.bad,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {totalGain >= 0 ? '+' : '−'}{MXN(Math.abs(totalGain))} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%)
            </span>
            <span style={{ fontSize: 13, color: theme.textTer }}>total</span>
          </div>
        </div>

        {/* Chart */}
        <PerformanceChart points={chartPoints} theme={theme} accent={accent} positive={totalGain >= 0}/>

        {/* Range selector */}
        <div style={{
          display: 'flex', gap: 6, padding: `12px ${pad}px 20px`, justifyContent: 'space-between',
        }}>
          {['1S', '1M', '3M', '6M', '1A', 'Todo'].map(r => {
            const active = range === r;
            return (
              <button key={r} onClick={() => setRange(r)} style={{
                flex: 1, height: 32, borderRadius: 10, border: 'none',
                background: active ? theme.surfaceAlt : 'transparent',
                color: active ? accent : theme.textSec,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
                transition: 'all 0.15s',
              }}>{r}</button>
            );
          })}
        </div>

        {/* Allocation strip */}
        <div style={{ padding: `0 ${pad}px 20px` }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, marginBottom: 10 }}>Asignación</div>
          <AllocationBar items={INVESTMENTS} accent={accent} theme={theme}/>
        </div>

        {/* Holdings */}
        <div style={{ padding: `0 ${pad}px` }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1, marginBottom: 10 }}>
            Posiciones · {INVESTMENTS.length}
          </div>
          <div style={{
            background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: 'hidden',
          }}>
            {INVESTMENTS.map((inv, i) => (
              <HoldingRow key={inv.id} inv={inv} theme={theme} isLast={i === INVESTMENTS.length - 1}/>
            ))}
          </div>

          <button style={{
            width: '100%', height: 52, borderRadius: 16, border: `1.5px dashed ${theme.borderStrong}`,
            background: 'transparent', color: theme.text,
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 12,
          }}>
            <window.Icon.Plus s={18} c={theme.text} w={2}/>
            Agregar inversión
          </button>
        </div>
      </div>
    </div>
  );
}

// Generate fake price series — deterministic-ish via range
function generateSeries(range, endValue) {
  const counts = { '1S': 7, '1M': 30, '3M': 30, '6M': 30, '1A': 36, 'Todo': 40 };
  const n = counts[range] || 30;
  const seed = range.charCodeAt(0);
  const points = [];
  let v = endValue * 0.85;
  for (let i = 0; i < n; i++) {
    const wave = Math.sin((i + seed) / 3.5) * (endValue * 0.04);
    const drift = (endValue - v) * (i / n) * 0.4;
    v = v + drift + wave + (Math.sin(i * 1.7 + seed) * endValue * 0.012);
    points.push(v);
  }
  // Force end point
  points[points.length - 1] = endValue;
  return points;
}

function PerformanceChart({ points, theme, accent, positive }) {
  const W = 360, H = 140;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((p - min) / range) * (H - 12) - 6;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Area fill path
  const areaPath = `${path} L ${W} ${H} L 0 ${H} Z`;

  const stroke = positive ? theme.good : theme.bad;

  return (
    <div style={{ padding: '0 12px', position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* horizontal grid */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="0" x2={W} y1={H * g} y2={H * g}
                stroke={theme.divider} strokeDasharray="2 4"/>
        ))}
        <path d={areaPath} fill="url(#chartGradient)"/>
        <path d={path} stroke={stroke} strokeWidth="2" fill="none"
              strokeLinecap="round" strokeLinejoin="round"/>
        {/* end dot */}
        <circle
          cx={W} cy={H - ((points[points.length - 1] - min) / range) * (H - 12) - 6}
          r="4" fill={stroke}/>
        <circle
          cx={W} cy={H - ((points[points.length - 1] - min) / range) * (H - 12) - 6}
          r="8" fill={stroke} opacity="0.25"/>
      </svg>
    </div>
  );
}

function AllocationBar({ items, theme, accent }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  // Sort and assign deterministic shades from accent
  const sorted = [...items].sort((a, b) => b.value - a.value);

  const palette = [accent, '#A78BFA', '#5AC8FA', '#F59E0B', '#34C759', '#FF6B6B'];

  return (
    <div>
      <div style={{
        height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex',
        background: theme.surfaceAlt, marginBottom: 10,
      }}>
        {sorted.map((item, i) => (
          <div key={item.id} style={{
            width: `${(item.value / total) * 100}%`,
            background: palette[i % palette.length],
          }}/>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {sorted.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2, background: palette[i % palette.length],
            }}/>
            <span style={{ fontSize: 11, color: theme.textSec }}>{item.symbol}</span>
            <span style={{ fontSize: 11, color: theme.textTer, fontVariantNumeric: 'tabular-nums' }}>
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingRow({ inv, theme, isLast }) {
  const Icons = { etf: window.Icon.Stocks, crypto: window.Icon.Crypto, bond: window.Icon.Bond, savings: window.Icon.PiggyBank };
  const Ico = Icons[inv.type] || window.Icon.Stocks;

  const gain = inv.value - inv.cost;
  const gainPct = (gain / inv.cost) * 100;
  const isUp = gain >= 0;
  const dayUp = inv.change1d >= 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: isLast ? 'none' : `0.5px solid ${theme.divider}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: theme.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ico s={18} c={theme.text} w={1.6}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inv.name}
        </div>
        <div style={{ fontSize: 11, color: theme.textTer, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
          {inv.symbol}{inv.shares ? ` · ${inv.shares} ud` : ''} · hoy <span style={{ color: dayUp ? theme.good : theme.bad }}>{dayUp ? '+' : ''}{inv.change1d}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
          {window.FZ.MXN(inv.value)}
        </div>
        <div style={{
          fontSize: 11, marginTop: 2, fontVariantNumeric: 'tabular-nums',
          color: isUp ? theme.good : theme.bad,
        }}>
          {isUp ? '+' : '−'}{window.FZ.MXN(Math.abs(gain))} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

window.InvestmentsScreen = InvestmentsScreen;
